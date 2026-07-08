import {
    EnumFriendApplicationStatus,
    EnumFriendStatus,
} from '@generated/prisma-client';

export const ContactLegacyFriendStatus = {
    nonFriend: 0,
    normal: 1,
    blocked: 2,
    deleted: 3,
} as const;

export const ContactLegacyApplicationStatus = {
    unread: 0,
    accepted: 1,
    rejected: 2,
    read: 3,
    expired: 4,
} as const;

export const ContactLegacyConversationType = {
    single: 1,
    group: 2,
} as const;

export const ContactLegacyIsReceiver = {
    no: 0,
    yes: 1,
} as const;

export const ContactLegacyGroupAvatar = '';

export function contactMapFriendStatus(
    status: EnumFriendStatus | null
): number {
    switch (status) {
        case EnumFriendStatus.normal:
            return ContactLegacyFriendStatus.normal;
        case EnumFriendStatus.blocked:
            return ContactLegacyFriendStatus.blocked;
        case EnumFriendStatus.deleted:
            return ContactLegacyFriendStatus.deleted;
        default:
            return ContactLegacyFriendStatus.nonFriend;
    }
}

export function contactMapApplicationStatus(
    status: EnumFriendApplicationStatus
): number {
    switch (status) {
        case EnumFriendApplicationStatus.accepted:
            return ContactLegacyApplicationStatus.accepted;
        case EnumFriendApplicationStatus.rejected:
            return ContactLegacyApplicationStatus.rejected;
        case EnumFriendApplicationStatus.read:
            return ContactLegacyApplicationStatus.read;
        case EnumFriendApplicationStatus.expired:
            return ContactLegacyApplicationStatus.expired;
        case EnumFriendApplicationStatus.unread:
        default:
            return ContactLegacyApplicationStatus.unread;
    }
}
