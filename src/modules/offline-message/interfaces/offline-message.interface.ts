import {
    EnumConversationType,
    EnumMessageType,
    EnumUserStatus,
    Prisma,
} from '@generated/prisma-client';

export interface IOfflineMessageUser {
    id: string;
    legacyId: bigint | null;
    username: string;
    name: string | null;
    avatar: string | null;
    status: EnumUserStatus;
}

export interface IOfflineMessageSender {
    id: string;
    legacyId: bigint | null;
    username: string;
    name: string | null;
    avatar: string | null;
}

export interface IOfflineMessageEntity {
    id: bigint;
    senderId: string;
    conversationId: bigint;
    conversationType: EnumConversationType;
    type: EnumMessageType;
    content: string | null;
    body: Prisma.JsonValue;
    replyId: bigint | null;
    createdAt: Date;
    sender: IOfflineMessageSender;
}

export interface IOfflineMessageEntityWithConversation
    extends IOfflineMessageEntity {
    conversation: {
        id: bigint;
        name: string;
        type: EnumConversationType;
    };
}

export interface IOfflineMessageConversation {
    conversation: {
        id: bigint;
        name: string;
        type: EnumConversationType;
        messages: IOfflineMessageEntity[];
    };
}

export interface IOfflineMessageListResult {
    conversations: IOfflineMessageConversation[];
    nextCursor: string | null;
}
