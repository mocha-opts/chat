import {
    EnumConversationStatus,
    EnumRedPacketStatus,
    EnumRedPacketType,
    EnumUserStatus,
    Prisma,
} from '@generated/prisma-client';

export interface IRedPacketUser {
    id: string;
    legacyId: bigint | null;
    username: string;
    name: string | null;
    avatar: string | null;
    status: EnumUserStatus;
}

export interface IRedPacketConversation {
    id: bigint;
    status: EnumConversationStatus;
}

export interface IRedPacketRecord {
    id: bigint;
    senderId: string;
    conversationId: bigint;
    wrapperText: string;
    type: EnumRedPacketType;
    totalAmount: Prisma.Decimal;
    totalCount: number;
    remainingAmount: Prisma.Decimal;
    remainingCount: number;
    status: EnumRedPacketStatus;
    expireAt: Date;
    createdAt: Date;
}

export interface IRedPacketCreatePayload {
    id: bigint;
    senderId: string;
    conversationId: bigint;
    wrapperText: string;
    type: EnumRedPacketType;
    totalAmount: Prisma.Decimal;
    totalCount: number;
    expireAt: Date;
}

export interface IRedPacketClaimResult {
    code: 'received' | 'empty' | 'success';
    amount: Prisma.Decimal | null;
}

export interface IRedPacketReceivePersistResult {
    ok: boolean;
    claimed: boolean;
}

export interface IRedPacketReceiveRecord {
    amount: Prisma.Decimal;
}

export interface IRedPacketReceiveUser {
    receiver: {
        username: string;
        name: string | null;
        avatar: string | null;
    };
    amount: Prisma.Decimal;
    receivedAt: Date;
}

export interface IRedPacketDetail {
    id: bigint;
    sender: {
        username: string;
        name: string | null;
        avatar: string | null;
    };
    wrapperText: string;
    type: EnumRedPacketType;
    totalAmount: Prisma.Decimal;
    totalCount: number;
    remainingAmount: Prisma.Decimal;
    remainingCount: number;
    status: EnumRedPacketStatus;
    receives: IRedPacketReceiveUser[];
}
