import { IKafkaEventEnvelope } from '@common/kafka/interfaces/kafka.interface';
import {
    EnumConversationType,
    EnumMessageOutboxStatus,
    EnumMessageType,
    EnumUserStatus,
    Prisma,
} from '@generated/prisma-client';
import {
    EnumMessagingLegacyConversationType,
    EnumMessagingLegacyMessageType,
} from '@modules/messaging/enums/messaging.legacy.enum';

export interface IMessagingUser {
    id: string;
    legacyId: bigint | null;
    username: string;
    name: string | null;
    avatar: string | null;
    photo: unknown;
    status: EnumUserStatus;
}

export interface IMessagingConversation {
    id: bigint;
    name: string;
    type: EnumConversationType;
}

export interface IMessagingConversationMember {
    userId: string;
    user: IMessagingUser;
}

export interface IMessagingResolvedSend {
    sender: IMessagingUser;
    conversation: IMessagingConversation;
    receiverUsers: IMessagingUser[];
}

export interface IMessagingCreateMessagePayload {
    messageId: bigint;
    senderId: string;
    conversationId: bigint;
    conversationType: EnumConversationType;
    messageType: EnumMessageType;
    content: string | null;
    body: Prisma.InputJsonValue;
    replyId: bigint | null;
    event: IKafkaEventEnvelope<IMessagingMessagePersistPayload>;
}

export interface IMessagingCreatedMessage {
    id: bigint;
    senderId: string;
    conversationId: bigint;
    conversationType: EnumConversationType;
    type: EnumMessageType;
    content: string | null;
    body: Prisma.JsonValue;
    replyId: bigint | null;
    createdAt: Date;
}

export interface IMessagingOutbox {
    id: bigint;
    messageId: bigint;
    topic: string;
    messageKey: string;
    payload: Prisma.JsonValue;
    status: EnumMessageOutboxStatus;
    retryCount: number;
}

export interface IMessagingCreateMessageResult {
    message: IMessagingCreatedMessage;
    outbox: IMessagingOutbox;
}

export interface IMessagingMessagePersistPayload
    extends Record<string, unknown> {
    messageId: string;
    senderId: string;
    conversationId: string;
    conversationType: EnumConversationType;
    type: EnumMessageType;
    legacySessionType: EnumMessagingLegacyConversationType;
    legacyType: EnumMessagingLegacyMessageType;
    content: string | null;
    body: Record<string, unknown>;
    replyId: string | null;
    createdAt: string;
}

export interface IMessagingRealtimeMessage
    extends Record<string, unknown> {
    sessionId: string;
    receiveUserIds: string[];
    sendUserId: string;
    userName: string;
    avatar: string | null;
    type: EnumMessagingLegacyMessageType;
    messageId: string;
    sessionType: EnumMessagingLegacyConversationType;
    seesionName: string | null;
    sessionAvatr: string | null;
    created: string;
    body: Record<string, unknown>;
}
