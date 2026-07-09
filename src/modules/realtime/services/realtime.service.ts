import { AuthJwtAccessTokenInvalidException } from '@modules/auth/exceptions/auth.jwt-access-token-invalid.exception';
import { AuthService } from '@modules/auth/services/auth.service';
import { AuthUtil } from '@modules/auth/utils/auth.util';
import {
    RealtimeAckMaxRetryCount,
    RealtimeAckTimeoutInMs,
} from '@modules/realtime/constants/realtime.constant';
import { EnumRealtimeClientMessageType } from '@modules/realtime/enums/realtime.client-message-type.enum';
import { EnumRealtimePushType } from '@modules/realtime/enums/realtime.push-type.enum';
import {
    IRealtimeAuthenticateResult,
    IRealtimeClientFrame,
    IRealtimePendingAck,
    IRealtimeRouteCache,
    IRealtimeServerFrame,
    IRealtimeService,
} from '@modules/realtime/interfaces/realtime.interface';
import { RealtimeRepository } from '@modules/realtime/repositories/realtime.repository';
import {
    Injectable,
    Logger,
    OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';
import { hostname } from 'os';
import { RawData, WebSocket } from 'ws';

@Injectable()
export class RealtimeService implements IRealtimeService, OnModuleDestroy {
    private readonly logger = new Logger(RealtimeService.name);
    private readonly connectionsByUserId = new Map<string, WebSocket>();
    private readonly usersByClient = new Map<WebSocket, string>();
    private readonly pendingAckMessages = new Map<
        string,
        IRealtimePendingAck
    >();
    private readonly jwtPrefix: string;
    private readonly nodeId = `${hostname()}:${process.pid}`;

    constructor(
        private readonly realtimeRepository: RealtimeRepository,
        private readonly authUtil: AuthUtil,
        private readonly authService: AuthService,
        configService: ConfigService
    ) {
        this.jwtPrefix = configService.get<string>('auth.jwt.prefix')!;
    }

    onModuleDestroy(): void {
        for (const pending of this.pendingAckMessages.values()) {
            this.clearPendingTimer(pending);
        }
        this.pendingAckMessages.clear();
        this.connectionsByUserId.clear();
        this.usersByClient.clear();
    }

    async handleConnection(
        client: WebSocket,
        request: IncomingMessage
    ): Promise<boolean> {
        try {
            const auth = await this.authenticate(request);

            this.replaceConnection(auth.userId, client);
            await this.realtimeRepository.setRoute(
                auth.userId,
                this.createRoute(auth.userId)
            );

            return true;
        } catch (err: unknown) {
            this.logger.warn(
                {
                    err,
                    remoteAddress: request.socket.remoteAddress ?? null,
                },
                'Realtime handshake rejected'
            );
            client.close(1008, 'Unauthorized');

            return false;
        }
    }

    async handleMessage(client: WebSocket, raw: RawData): Promise<void> {
        const frame = this.parseFrame(raw);

        switch (frame.type) {
            case EnumRealtimeClientMessageType.ack:
                this.ack(frame);
                return;
            case EnumRealtimeClientMessageType.logOut:
                await this.handleLogout(client);
                return;
            case EnumRealtimeClientMessageType.heartBeat:
                await this.handleHeartbeat(client, frame);
                return;
            default:
                await this.handleDisconnect(client);
                client.close(1003, 'Unsupported message type');
                return;
        }
    }

    async handleDisconnect(client: WebSocket): Promise<void> {
        await this.removeConnection(client, true);
    }

    async push(
        userId: string,
        type: EnumRealtimePushType,
        data: unknown,
        businessId: string | null
    ): Promise<boolean> {
        const client = this.connectionsByUserId.get(userId);
        if (!client || client.readyState !== WebSocket.OPEN) {
            return false;
        }

        const ackId = this.buildAckId(type, userId, businessId, data);
        const frame: IRealtimeServerFrame = {
            type,
            msgUuid: ackId,
            data,
        };

        if (!this.sendFrame(client, frame)) {
            return false;
        }

        this.addPending({
            ackId,
            userId,
            frame,
            retryCount: 0,
            lastSentAt: new Date(),
            timer: null,
        });

        return true;
    }

    async pushMessage(
        userId: string,
        data: unknown,
        businessId: string | null
    ): Promise<boolean> {
        return this.push(
            userId,
            EnumRealtimePushType.messageNotification,
            data,
            businessId
        );
    }

    async pushMoment(
        userId: string,
        data: unknown,
        businessId: string | null
    ): Promise<boolean> {
        return this.push(
            userId,
            EnumRealtimePushType.momentNotification,
            data,
            businessId
        );
    }

    async pushFriendApplication(
        userId: string,
        data: unknown,
        businessId: string | null
    ): Promise<boolean> {
        return this.push(
            userId,
            EnumRealtimePushType.friendApplicationNotification,
            data,
            businessId
        );
    }

    async pushConversation(
        userId: string,
        data: unknown,
        businessId: string | null
    ): Promise<boolean> {
        return this.push(
            userId,
            EnumRealtimePushType.newSessionNotification,
            data,
            businessId
        );
    }

    private async authenticate(
        request: IncomingMessage
    ): Promise<IRealtimeAuthenticateResult> {
        const rawToken = this.extractToken(request);
        if (!rawToken) {
            throw new AuthJwtAccessTokenInvalidException();
        }

        const token = this.normalizeToken(rawToken);
        const decoded = this.authUtil.payloadToken<unknown>(token);
        if (!this.isJwtPayload(decoded)) {
            throw new AuthJwtAccessTokenInvalidException();
        }

        const subject = decoded.sub ?? decoded.userId;
        if (
            !subject ||
            !decoded.jti ||
            (decoded.userId && decoded.userId !== subject)
        ) {
            throw new AuthJwtAccessTokenInvalidException();
        }

        const isValidToken = this.authUtil.validateAccessToken(
            subject,
            decoded.jti,
            token
        );
        if (!isValidToken) {
            throw new AuthJwtAccessTokenInvalidException();
        }

        const payload = await this.authService.validateJwtAccessStrategy({
            ...decoded,
            sub: subject,
            jti: decoded.jti,
            userId: subject,
        });

        const userIdentifier = this.extractUserIdentifier(request);
        const expectedUserId = userIdentifier
            ? await this.realtimeRepository.findUserIdByIdentifier(
                  userIdentifier
              )
            : subject;
        if (!expectedUserId || expectedUserId !== subject) {
            throw new AuthJwtAccessTokenInvalidException();
        }

        return {
            userId: subject,
            payload,
        };
    }

    private parseFrame(raw: RawData): IRealtimeClientFrame {
        const text = this.rawToText(raw);
        let parsed: unknown;
        try {
            parsed = JSON.parse(text) as unknown;
        } catch {
            return { type: 99 };
        }

        if (
            typeof parsed !== 'object' ||
            parsed === null ||
            !('type' in parsed)
        ) {
            return { type: 99 };
        }

        const frame = parsed as IRealtimeClientFrame;
        return {
            type: Number(frame.type),
            msgUuid:
                typeof frame.msgUuid === 'string' ? frame.msgUuid : undefined,
            data: frame.data,
        };
    }

    private rawToText(raw: RawData): string {
        if (typeof raw === 'string') {
            return raw;
        }

        if (Buffer.isBuffer(raw)) {
            return raw.toString('utf8');
        }

        if (Array.isArray(raw)) {
            return Buffer.concat(raw).toString('utf8');
        }

        return Buffer.from(raw).toString('utf8');
    }

    private ack(frame: IRealtimeClientFrame): void {
        const ackId = frame.msgUuid ?? this.extractStringField(frame.data, 'msgUuid');
        if (!ackId) {
            return;
        }

        const pending = this.pendingAckMessages.get(ackId);
        if (!pending) {
            return;
        }

        this.clearPendingTimer(pending);
        this.pendingAckMessages.delete(ackId);
    }

    private async handleLogout(client: WebSocket): Promise<void> {
        await this.removeConnection(client, true);
        client.close(1000, 'Logout');
    }

    private async handleHeartbeat(
        client: WebSocket,
        frame: IRealtimeClientFrame
    ): Promise<void> {
        const userId = this.usersByClient.get(client);
        if (!userId) {
            client.close(1008, 'Unauthorized');
            return;
        }

        await this.realtimeRepository.refreshRoute(
            userId,
            new Date().toISOString()
        );
        this.sendFrame(client, {
            type: EnumRealtimeClientMessageType.heartBeat,
            msgUuid: frame.msgUuid ?? null,
            data: { ok: true },
        });
    }

    private replaceConnection(userId: string, client: WebSocket): void {
        const existing = this.connectionsByUserId.get(userId);
        if (existing && existing !== client) {
            void this.removeConnection(existing, false);
            existing.close(4000, 'Replaced');
        }

        this.connectionsByUserId.set(userId, client);
        this.usersByClient.set(client, userId);
    }

    private async removeConnection(
        client: WebSocket,
        removeRoute: boolean
    ): Promise<void> {
        const userId = this.usersByClient.get(client);
        if (!userId) {
            return;
        }

        if (this.connectionsByUserId.get(userId) === client) {
            this.connectionsByUserId.delete(userId);
        }

        this.usersByClient.delete(client);
        this.removePendingByUser(userId);

        if (removeRoute) {
            await this.realtimeRepository.deleteRoute(userId);
        }
    }

    private createRoute(userId: string): IRealtimeRouteCache {
        const now = new Date().toISOString();

        return {
            userId,
            nodeId: this.nodeId,
            route: this.nodeId,
            connectedAt: now,
            lastSeenAt: now,
        };
    }

    private sendFrame(client: WebSocket, frame: IRealtimeServerFrame): boolean {
        if (client.readyState !== WebSocket.OPEN) {
            return false;
        }

        client.send(JSON.stringify(frame));

        return true;
    }

    private addPending(pending: IRealtimePendingAck): void {
        const existing = this.pendingAckMessages.get(pending.ackId);
        if (existing) {
            this.clearPendingTimer(existing);
        }

        this.pendingAckMessages.set(pending.ackId, pending);
        this.scheduleRetry(pending);
    }

    private scheduleRetry(pending: IRealtimePendingAck): void {
        pending.timer = setTimeout(() => {
            this.retryPending(pending.ackId);
        }, RealtimeAckTimeoutInMs);
        pending.timer.unref();
    }

    private retryPending(ackId: string): void {
        const pending = this.pendingAckMessages.get(ackId);
        if (!pending) {
            return;
        }

        if (pending.retryCount >= RealtimeAckMaxRetryCount) {
            this.clearPendingTimer(pending);
            this.pendingAckMessages.delete(ackId);
            this.logger.warn(
                {
                    ackId,
                    userId: pending.userId,
                },
                'Realtime ACK retry limit reached'
            );
            return;
        }

        pending.retryCount += 1;
        pending.lastSentAt = new Date();

        const client = this.connectionsByUserId.get(pending.userId);
        if (client) {
            this.sendFrame(client, pending.frame);
        }

        this.scheduleRetry(pending);
    }

    private removePendingByUser(userId: string): void {
        for (const [ackId, pending] of this.pendingAckMessages.entries()) {
            if (pending.userId !== userId) {
                continue;
            }

            this.clearPendingTimer(pending);
            this.pendingAckMessages.delete(ackId);
        }
    }

    private clearPendingTimer(pending: IRealtimePendingAck): void {
        if (!pending.timer) {
            return;
        }

        clearTimeout(pending.timer);
        pending.timer = null;
    }

    private buildAckId(
        type: EnumRealtimePushType,
        userId: string,
        businessId: string | null,
        data: unknown
    ): string {
        const resolvedBusinessId =
            businessId ??
            this.extractStringField(data, 'messageId') ??
            randomUUID().replace(/-/g, '');

        return `${type}:${userId}:${resolvedBusinessId}`;
    }

    private extractToken(request: IncomingMessage): string | null {
        const query = this.extractQuery(request);

        return (
            this.extractHeaderValue(request.headers.token) ??
            this.extractHeaderValue(request.headers.authorization) ??
            query.get('token')
        );
    }

    private extractUserIdentifier(request: IncomingMessage): string | null {
        const query = this.extractQuery(request);

        return (
            this.extractHeaderValue(request.headers['useruuid']) ??
            query.get('userUuid') ??
            query.get('userId')
        );
    }

    private extractQuery(request: IncomingMessage): URLSearchParams {
        return new URL(request.url ?? '/', 'ws://localhost').searchParams;
    }

    private extractHeaderValue(
        value: string | string[] | undefined
    ): string | null {
        const resolved = Array.isArray(value) ? value[0] : value;
        const trimmed = resolved?.trim();

        return trimmed ? trimmed : null;
    }

    private normalizeToken(token: string): string {
        const prefix = `${this.jwtPrefix} `;
        if (token.toLowerCase().startsWith(prefix.toLowerCase())) {
            return token.slice(prefix.length).trim();
        }

        return token.trim();
    }

    private isJwtPayload(
        payload: unknown
    ): payload is IRealtimeAuthenticateResult['payload'] {
        return typeof payload === 'object' && payload !== null;
    }

    private extractStringField(data: unknown, field: string): string | null {
        if (typeof data !== 'object' || data === null || !(field in data)) {
            return null;
        }

        const record = data as Record<string, unknown>;
        const value = record[field];
        return typeof value === 'string' && value.trim() ? value : null;
    }
}
