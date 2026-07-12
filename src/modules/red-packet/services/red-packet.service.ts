import { IResponseReturn } from '@common/response/interfaces/response.interface';
import {
    EnumRedPacketStatus,
    EnumRedPacketType,
    EnumUserStatus,
    Prisma,
} from '@generated/prisma-client';
import {
    EnumMessagingLegacyMessageType,
} from '@modules/messaging/enums/messaging.legacy.enum';
import { MessagingService } from '@modules/messaging/services/messaging.service';
import {
    RedPacketDefaultWrapperText,
    RedPacketExpireInMs,
    RedPacketExpireScanLimit,
    RedPacketMaxAmountPerPacketInCents,
    RedPacketMinAmountInCents,
    RedPacketRandomMultiplier,
    RedPacketSnowflakeEpochInMs,
} from '@modules/red-packet/constants/red-packet.constant';
import { RedPacketDetailRequestDto } from '@modules/red-packet/dtos/request/red-packet.detail.request.dto';
import { RedPacketReceiveRequestDto } from '@modules/red-packet/dtos/request/red-packet.receive.request.dto';
import { RedPacketSendRequestDto } from '@modules/red-packet/dtos/request/red-packet.send.request.dto';
import {
    RedPacketDetailResponseDto,
    RedPacketUserResponseDto,
} from '@modules/red-packet/dtos/response/red-packet.detail.response.dto';
import { RedPacketReceiveResponseDto } from '@modules/red-packet/dtos/response/red-packet.receive.response.dto';
import { RedPacketSendResponseDto } from '@modules/red-packet/dtos/response/red-packet.send.response.dto';
import {
    EnumRedPacketLegacyStatus,
    EnumRedPacketLegacyType,
} from '@modules/red-packet/enums/red-packet.legacy.enum';
import { EnumRedPacketStatusCodeError } from '@modules/red-packet/enums/red-packet.status-code.enum';
import { RedPacketException } from '@modules/red-packet/exceptions/red-packet.exception';
import {
    IRedPacketDetail,
    IRedPacketUser,
} from '@modules/red-packet/interfaces/red-packet.interface';
import { IRedPacketService } from '@modules/red-packet/interfaces/red-packet.service.interface';
import { RedPacketRepository } from '@modules/red-packet/repositories/red-packet.repository';
import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { DateTime } from 'luxon';

@Injectable()
export class RedPacketService implements IRedPacketService {
    private lastRedPacketTimestamp = 0n;
    private redPacketSequence = 0n;

    constructor(
        private readonly redPacketRepository: RedPacketRepository,
        private readonly messagingService: MessagingService
    ) {}

    async sendRedPacket(
        authUserId: string,
        body: RedPacketSendRequestDto
    ): Promise<IResponseReturn<RedPacketSendResponseDto>> {
        this.assertRedPacketMessageType(body.type);
        const sender = await this.resolveActiveUser(body.sendUserId);
        this.assertCurrentUser(authUserId, sender.id);
        const conversationId = BigInt(body.sessionId);
        const conversation =
            await this.redPacketRepository.findConversation(conversationId);
        if (!conversation) {
            throw new RedPacketException(
                EnumRedPacketStatusCodeError.conversationNotFound
            );
        }

        const totalAmount = new Prisma.Decimal(body.body.totalAmount);
        const totalCents = this.toCents(totalAmount);
        this.assertAmount(totalCents, body.body.totalCount);
        const redPacketType = this.toPrismaType(body.body.redPacketType);
        const amounts = this.splitAmounts(
            totalCents,
            body.body.totalCount,
            body.body.redPacketType
        );
        const redPacketId = this.createRedPacketId();
        const wrapperText = this.resolveWrapperText(
            body.body.redPacketWrapperText ?? null
        );
        const redPacket =
            await this.redPacketRepository.createRedPacketWithBalance({
                id: redPacketId,
                senderId: sender.id,
                conversationId,
                wrapperText,
                type: redPacketType,
                totalAmount,
                totalCount: body.body.totalCount,
                expireAt: new Date(Date.now() + RedPacketExpireInMs),
            });
        if (!redPacket) {
            throw new RedPacketException(
                EnumRedPacketStatusCodeError.insufficientBalance
            );
        }

        try {
            await this.redPacketRepository.initializeRedis(
                redPacket.id,
                amounts.map(amount => this.formatCents(amount)),
                redPacket.totalCount
            );
            const message = await this.messagingService.sendMessage(authUserId, {
                sessionId: body.sessionId,
                sendUserId: body.sendUserId,
                receiveUserId: body.receiveUserId,
                sessionType: body.sessionType,
                type: EnumMessagingLegacyMessageType.redPacket,
                body: {
                    content: redPacket.id.toString(),
                    redPacketId: redPacket.id.toString(),
                    redPacketWrapperText: redPacket.wrapperText,
                },
            });

            return {
                data: message.data,
            };
        } catch (error: unknown) {
            await this.compensateCreatedRedPacket(redPacket.id);
            throw error;
        }
    }

    async receiveRedPacket(
        authUserId: string,
        body: RedPacketReceiveRequestDto
    ): Promise<IResponseReturn<RedPacketReceiveResponseDto>> {
        const receiver = await this.resolveActiveUser(body.userId);
        this.assertCurrentUser(authUserId, receiver.id);
        const redPacketId = BigInt(body.redPacketId);
        const existing = await this.redPacketRepository.findReceive(
            redPacketId,
            receiver.id
        );
        if (existing) {
            return {
                data: {
                    receivedAmount: this.formatDecimal(existing.amount),
                    status: EnumRedPacketLegacyStatus.normal,
                },
            };
        }

        const redPacket =
            await this.redPacketRepository.findRedPacket(redPacketId);
        if (!redPacket) {
            throw new RedPacketException(EnumRedPacketStatusCodeError.notFound);
        }
        if (
            redPacket.status === EnumRedPacketStatus.expired ||
            redPacket.expireAt <= new Date()
        ) {
            await this.expireOne(redPacketId);
            return {
                data: {
                    receivedAmount: null,
                    status: EnumRedPacketLegacyStatus.expired,
                },
            };
        }
        if (
            redPacket.status === EnumRedPacketStatus.claimed ||
            redPacket.remainingCount <= 0
        ) {
            return {
                data: {
                    receivedAmount: null,
                    status: EnumRedPacketLegacyStatus.claimed,
                },
            };
        }

        const claim = await this.redPacketRepository.claimAmount(
            redPacketId,
            receiver.id
        );
        if (claim.code === 'received') {
            const received = await this.redPacketRepository.findReceive(
                redPacketId,
                receiver.id
            );

            return {
                data: {
                    receivedAmount: received
                        ? this.formatDecimal(received.amount)
                        : null,
                    status: EnumRedPacketLegacyStatus.normal,
                },
            };
        }
        if (claim.code === 'empty' || !claim.amount) {
            return {
                data: {
                    receivedAmount: null,
                    status: EnumRedPacketLegacyStatus.claimed,
                },
            };
        }

        const persisted = await this.persistClaimWithCompensation(
            redPacketId,
            receiver.id,
            claim.amount
        );
        if (persisted.claimed) {
            await this.redPacketRepository.clearRedis(redPacketId);
        }

        return {
            data: {
                receivedAmount: this.formatDecimal(claim.amount),
                status: EnumRedPacketLegacyStatus.normal,
            },
        };
    }

    private async persistClaimWithCompensation(
        redPacketId: bigint,
        receiverId: string,
        amount: Prisma.Decimal
    ): Promise<{ claimed: boolean }> {
        try {
            const persisted = await this.redPacketRepository.persistReceive(
                redPacketId,
                receiverId,
                amount
            );
            if (!persisted.ok) {
                throw new RedPacketException(
                    EnumRedPacketStatusCodeError.claimFailed
                );
            }

            return {
                claimed: persisted.claimed,
            };
        } catch (error: unknown) {
            await this.redPacketRepository.compensateClaim(
                redPacketId,
                receiverId,
                amount
            );
            throw new RedPacketException(
                EnumRedPacketStatusCodeError.claimFailed,
                { rawError: error }
            );
        }
    }

    async getRedPacket(
        redPacketId: string,
        query: RedPacketDetailRequestDto
    ): Promise<IResponseReturn<RedPacketDetailResponseDto>> {
        const detail = await this.redPacketRepository.findDetail(
            BigInt(redPacketId),
            query.pageNum ?? 1,
            query.pageSize ?? 10
        );
        if (!detail) {
            throw new RedPacketException(EnumRedPacketStatusCodeError.notFound);
        }

        return {
            data: this.mapDetail(detail),
        };
    }

    async expireRedPackets(): Promise<void> {
        const expired = await this.redPacketRepository.findExpiredUnclaimed(
            RedPacketExpireScanLimit
        );

        for (const redPacket of expired) {
            await this.expireOne(redPacket.id);
        }
    }

    private async expireOne(redPacketId: bigint): Promise<void> {
        const expired =
            await this.redPacketRepository.expireRedPacket(redPacketId);
        if (expired) {
            await this.redPacketRepository.clearRedis(redPacketId);
        }
    }

    private async compensateCreatedRedPacket(redPacketId: bigint): Promise<void> {
        await this.redPacketRepository.compensateCreatedRedPacket(redPacketId);
        await this.redPacketRepository.clearRedis(redPacketId);
    }

    private resolveActiveUser(identifier: string): Promise<IRedPacketUser> {
        return this.redPacketRepository
            .findUserByIdentifier(identifier)
            .then(user => {
                if (!user) {
                    throw new RedPacketException(
                        EnumRedPacketStatusCodeError.userNotFound
                    );
                }
                if (user.status !== EnumUserStatus.active) {
                    throw new RedPacketException(
                        EnumRedPacketStatusCodeError.userInactive
                    );
                }

                return user;
            });
    }

    private assertCurrentUser(authUserId: string, userId: string): void {
        if (authUserId !== userId) {
            throw new RedPacketException(EnumRedPacketStatusCodeError.forbidden);
        }
    }

    private assertRedPacketMessageType(
        type: EnumMessagingLegacyMessageType
    ): void {
        if (type !== EnumMessagingLegacyMessageType.redPacket) {
            throw new RedPacketException(
                EnumRedPacketStatusCodeError.typeInvalid
            );
        }
    }

    private assertAmount(totalCents: bigint, totalCount: number): void {
        if (totalCount < 1) {
            throw new RedPacketException(
                EnumRedPacketStatusCodeError.amountInvalid
            );
        }

        const count = BigInt(totalCount);
        if (totalCents < RedPacketMinAmountInCents * count) {
            throw new RedPacketException(
                EnumRedPacketStatusCodeError.amountInvalid
            );
        }

        if (totalCents > RedPacketMaxAmountPerPacketInCents * count) {
            throw new RedPacketException(
                EnumRedPacketStatusCodeError.amountInvalid
            );
        }
    }

    private splitAmounts(
        totalCents: bigint,
        totalCount: number,
        type: EnumRedPacketLegacyType
    ): bigint[] {
        if (type === EnumRedPacketLegacyType.normal) {
            return this.splitNormalAmounts(totalCents, totalCount);
        }

        if (type === EnumRedPacketLegacyType.random) {
            return this.splitRandomAmounts(totalCents, totalCount);
        }

        throw new RedPacketException(EnumRedPacketStatusCodeError.typeInvalid);
    }

    private splitNormalAmounts(totalCents: bigint, totalCount: number): bigint[] {
        const count = BigInt(totalCount);
        const average = totalCents / count;
        const amounts: bigint[] = [];
        let used = 0n;

        for (let i = 1; i < totalCount; i++) {
            amounts.push(average);
            used += average;
        }
        amounts.push(totalCents - used);

        return amounts;
    }

    private splitRandomAmounts(totalCents: bigint, totalCount: number): bigint[] {
        const amounts: bigint[] = [];
        let remainingAmount = totalCents;
        let remainingCount = totalCount;

        while (remainingCount > 1) {
            const count = BigInt(remainingCount);
            const averageMax = (remainingAmount / count) * RedPacketRandomMultiplier;
            const reserveMin =
                RedPacketMinAmountInCents * BigInt(remainingCount - 1);
            const allowedMax = remainingAmount - reserveMin;
            const max = this.minBigInt(
                this.minBigInt(averageMax, allowedMax),
                RedPacketMaxAmountPerPacketInCents
            );
            const amount = BigInt(randomInt(1, Number(max) + 1));
            amounts.push(amount);
            remainingAmount -= amount;
            remainingCount--;
        }

        amounts.push(remainingAmount);

        return amounts;
    }

    private toPrismaType(type: EnumRedPacketLegacyType): EnumRedPacketType {
        switch (type) {
            case EnumRedPacketLegacyType.normal:
                return EnumRedPacketType.normal;
            case EnumRedPacketLegacyType.random:
                return EnumRedPacketType.random;
        }
    }

    private toLegacyType(type: EnumRedPacketType): EnumRedPacketLegacyType {
        switch (type) {
            case EnumRedPacketType.normal:
                return EnumRedPacketLegacyType.normal;
            case EnumRedPacketType.random:
                return EnumRedPacketLegacyType.random;
        }
    }

    private toLegacyStatus(
        status: EnumRedPacketStatus
    ): EnumRedPacketLegacyStatus {
        switch (status) {
            case EnumRedPacketStatus.unclaimed:
                return EnumRedPacketLegacyStatus.unclaimed;
            case EnumRedPacketStatus.claimed:
                return EnumRedPacketLegacyStatus.claimed;
            case EnumRedPacketStatus.expired:
                return EnumRedPacketLegacyStatus.expired;
            case EnumRedPacketStatus.refunding:
                return EnumRedPacketLegacyStatus.refunding;
        }
    }

    private mapDetail(detail: IRedPacketDetail): RedPacketDetailResponseDto {
        return {
            list: detail.receives.map(receive => this.mapReceiveUser(receive)),
            senderName: detail.sender.name ?? detail.sender.username,
            senderAvatar: detail.sender.avatar,
            redPacketWrapperText: detail.wrapperText,
            redPacketType: this.toLegacyType(detail.type),
            totalAmount: this.formatDecimal(detail.totalAmount),
            totalCount: detail.totalCount,
            remainingAmount: this.formatDecimal(detail.remainingAmount),
            remainingCount: detail.remainingCount,
            status: this.toLegacyStatus(detail.status),
        };
    }

    private mapReceiveUser(
        receive: IRedPacketDetail['receives'][number]
    ): RedPacketUserResponseDto {
        return {
            userName: receive.receiver.name ?? receive.receiver.username,
            avatar: receive.receiver.avatar,
            receivedAt: this.formatLegacyDate(receive.receivedAt),
            amount: this.formatDecimal(receive.amount),
        };
    }

    private resolveWrapperText(value: string | null): string {
        const normalized = value?.trim();

        return normalized && normalized.length > 0
            ? normalized
            : RedPacketDefaultWrapperText;
    }

    private toCents(amount: Prisma.Decimal): bigint {
        const [whole, fraction = ''] = amount.toFixed(2).split('.');

        return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
    }

    private formatCents(cents: bigint): string {
        const whole = cents / 100n;
        const fraction = (cents % 100n).toString().padStart(2, '0');

        return `${whole.toString()}.${fraction}`;
    }

    private formatDecimal(amount: Prisma.Decimal): string {
        return amount.toFixed(2);
    }

    private formatLegacyDate(date: Date): string {
        return DateTime.fromJSDate(date).toFormat('yyyy-MM-dd HH:mm:ss');
    }

    private minBigInt(left: bigint, right: bigint): bigint {
        return left < right ? left : right;
    }

    private createRedPacketId(): bigint {
        const timestamp = BigInt(Date.now()) - RedPacketSnowflakeEpochInMs;
        if (timestamp === this.lastRedPacketTimestamp) {
            this.redPacketSequence = (this.redPacketSequence + 1n) & 4095n;
        } else {
            this.lastRedPacketTimestamp = timestamp;
            this.redPacketSequence = 0n;
        }

        return (
            (timestamp << 22n) |
            (BigInt(process.pid % 1024) << 12n) |
            this.redPacketSequence
        );
    }
}
