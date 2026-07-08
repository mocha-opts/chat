import {
    EnumFriendApplicationStatus,
    EnumFriendStatus,
    EnumUserGender,
    EnumUserStatus,
} from '@generated/prisma-client';

export interface IContactUser {
    id: string;
    legacyId: bigint | null;
    name: string | null;
    username: string;
    email: string;
    avatar: string | null;
    photo: unknown;
    signature: string | null;
    gender: EnumUserGender | null;
    status: EnumUserStatus;
    mobileNumbers: { number: string }[];
}

export interface IContactFriendApplication {
    id: bigint;
    senderId: string;
    receiverId: string;
    message: string | null;
    status: EnumFriendApplicationStatus;
    createdAt: Date;
    sender: IContactUser;
    receiver: IContactUser;
}

export interface IContactFriendRelation {
    status: EnumFriendStatus;
}

export interface IContactSingleConversation {
    id: bigint;
    name: string;
}

export interface IContactAcceptApplicationResult {
    applicant: IContactUser;
    conversationId: bigint;
}
