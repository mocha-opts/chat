import {
    EnumConversationMemberRole,
    EnumConversationType,
    EnumUserStatus,
} from '@generated/prisma-client';

export interface IConversationUser {
    id: string;
    legacyId: bigint | null;
    name: string | null;
    username: string;
    avatar: string | null;
    photo: unknown;
    status: EnumUserStatus;
}

export interface IConversationEntity {
    id: bigint;
    name: string;
    type: EnumConversationType;
}

export interface IConversationMember {
    id: bigint;
    userId: string;
    role: EnumConversationMemberRole;
    user: IConversationUser;
}

export interface IConversationCreateGroupResult {
    conversation: IConversationEntity;
    creator: IConversationUser;
    members: IConversationUser[];
    failedMemberIds: string[];
}

export interface IConversationNewGroupSessionRealtimePayload
    extends Record<string, unknown> {
    creatorId: string;
    sessionId: string;
    sessionType: number;
    sessionName: string;
    avatar: string | null;
}
