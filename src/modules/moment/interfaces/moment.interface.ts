import { EnumUserStatus, Prisma } from '@generated/prisma-client';

export interface IMomentUser {
    id: string;
    legacyId: bigint | null;
    username: string;
    name: string | null;
    avatar: string | null;
    photo: Prisma.JsonValue | null;
    status: EnumUserStatus;
}

export interface IMomentMoment {
    id: bigint;
    userId: string;
    text: string | null;
    mediaUrls: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    user: IMomentUser;
}

export interface IMomentLike {
    id: bigint;
    momentId: bigint;
    userId: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: IMomentUser;
}

export interface IMomentComment {
    id: bigint;
    momentId: bigint;
    userId: string;
    parentCommentId: bigint | null;
    content: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: IMomentUser;
}

export interface IMomentParentComment {
    id: bigint;
    userId: string;
    user: IMomentUser;
}

export interface IMomentTimelineSnapshot {
    moments: IMomentMoment[];
    likes: IMomentLike[];
    comments: IMomentComment[];
}

export interface IMomentRealtimePayload extends Record<string, unknown> {
    noticeType: number;
    senderUserId: string;
    momentId: string;
    receiveUserIds: string[];
    avatar: string | null;
    action: string;
}
