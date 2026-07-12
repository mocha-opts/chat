import { IAuthJwtAccessTokenPayload } from '@modules/auth/interfaces/auth.interface';
import { EnumRealtimeClientMessageType } from '@modules/realtime/enums/realtime.client-message-type.enum';
import { EnumRealtimePushType } from '@modules/realtime/enums/realtime.push-type.enum';
import { IncomingMessage } from 'http';
import { RawData, WebSocket } from 'ws';

export interface IRealtimeClientFrame<TData = unknown> {
    type: number;
    msgUuid?: string;
    data?: TData;
}

export interface IRealtimeServerFrame<TData = unknown> {
    type: EnumRealtimePushType | EnumRealtimeClientMessageType.heartBeat;
    msgUuid: string | null;
    data: TData;
}

export interface IRealtimeRouteCache {
    userId: string;
    nodeId: string;
    route: string;
    connectedAt: string;
    lastSeenAt: string;
}

export interface IRealtimePendingAck {
    ackId: string;
    userId: string;
    nodeId: string;
    frame: IRealtimeServerFrame;
    retryCount: number;
    lastSentAt: string;
    dueAt: string;
}

export interface IRealtimePushPayload extends Record<string, unknown> {
    userId: string;
    targetNodeId: string;
    originNodeId: string;
    ackId: string;
    type: EnumRealtimePushType;
    businessId: string | null;
    data: unknown;
}

export interface IRealtimeAuthenticateResult {
    userId: string;
    payload: IAuthJwtAccessTokenPayload;
}

export interface IRealtimeService {
    handleConnection(
        client: WebSocket,
        request: IncomingMessage
    ): Promise<boolean>;
    handleMessage(client: WebSocket, raw: RawData): Promise<void>;
    handleDisconnect(client: WebSocket): Promise<void>;
    push(
        userId: string,
        type: EnumRealtimePushType,
        data: unknown,
        businessId: string | null
    ): Promise<boolean>;
    pushMessage(
        userId: string,
        data: unknown,
        businessId: string | null
    ): Promise<boolean>;
    pushMoment(
        userId: string,
        data: unknown,
        businessId: string | null
    ): Promise<boolean>;
    pushFriendApplication(
        userId: string,
        data: unknown,
        businessId: string | null
    ): Promise<boolean>;
    pushConversation(
        userId: string,
        data: unknown,
        businessId: string | null
    ): Promise<boolean>;
}
