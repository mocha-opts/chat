import { DatabaseUtil } from '@common/database/utils/database.util';
import { DatabaseService } from '@common/database/services/database.service';
import {
    IContactAcceptApplicationResult,
    IContactFriendApplication,
    IContactFriendRelation,
    IContactSingleConversation,
    IContactUser,
} from '@modules/contact/interfaces/contact.interface';
import { Injectable } from '@nestjs/common';
import {
    EnumConversationMemberRole,
    EnumConversationMemberStatus,
    EnumConversationStatus,
    EnumConversationType,
    EnumFriendApplicationStatus,
    EnumFriendStatus,
    Prisma,
} from '@generated/prisma-client';

@Injectable()
export class ContactRepository {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly databaseUtil: DatabaseUtil
    ) {}

    async findUserByIdentifier(
        identifier: string
    ): Promise<IContactUser | null> {
        const where = this.createUserIdentifierWhere(identifier);
        if (!where) {
            return null;
        }

        return this.databaseService.user.findFirst({
            where: {
                ...where,
                deletedAt: null,
            },
            select: this.userSelect(),
        });
    }

    async findUserByPhone(phone: string): Promise<IContactUser | null> {
        return this.databaseService.user.findFirst({
            where: {
                deletedAt: null,
                mobileNumbers: {
                    some: {
                        number: phone,
                    },
                },
            },
            select: this.userSelect(),
        });
    }

    async findFriendRelation(
        userId: string,
        friendId: string
    ): Promise<IContactFriendRelation | null> {
        return this.databaseService.friend.findUnique({
            where: {
                userId_friendId: {
                    userId,
                    friendId,
                },
            },
            select: {
                status: true,
            },
        });
    }

    async findCommonSingleConversation(
        userId: string,
        friendId: string
    ): Promise<IContactSingleConversation | null> {
        return this.databaseService.conversation.findFirst({
            where: {
                type: EnumConversationType.single,
                status: EnumConversationStatus.normal,
                AND: [
                    {
                        members: {
                            some: {
                                userId,
                                status: EnumConversationMemberStatus.normal,
                            },
                        },
                    },
                    {
                        members: {
                            some: {
                                userId: friendId,
                                status: EnumConversationMemberStatus.normal,
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
            },
        });
    }

    async findExistingApplication(
        senderId: string,
        receiverId: string,
        now: Date
    ): Promise<{ id: bigint; status: EnumFriendApplicationStatus } | null> {
        return this.databaseService.friendApplication.findFirst({
            where: {
                senderId,
                receiverId,
                status: {
                    in: [
                        EnumFriendApplicationStatus.unread,
                        EnumFriendApplicationStatus.read,
                    ],
                },
                OR: [
                    {
                        expiredAt: null,
                    },
                    {
                        expiredAt: {
                            gt: now,
                        },
                    },
                ],
            },
            select: {
                id: true,
                status: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async createApplication(
        senderId: string,
        receiverId: string,
        message: string | null,
        expiredAt: Date
    ): Promise<bigint> {
        const application = await this.databaseService.friendApplication.create({
            data: {
                senderId,
                receiverId,
                message,
                status: EnumFriendApplicationStatus.unread,
                expiredAt,
            },
            select: {
                id: true,
            },
        });

        return application.id;
    }

    async countUnreadApplications(
        receiverId: string,
        now: Date
    ): Promise<number> {
        return this.databaseService.friendApplication.count({
            where: {
                receiverId,
                status: EnumFriendApplicationStatus.unread,
                OR: [
                    {
                        expiredAt: null,
                    },
                    {
                        expiredAt: {
                            gt: now,
                        },
                    },
                ],
            },
        });
    }

    async findApplications(
        userId: string,
        page: number,
        perPage: number,
        key: string | null
    ): Promise<{ data: IContactFriendApplication[]; total: number }> {
        const where: Prisma.FriendApplicationWhereInput = {
            OR: [{ senderId: userId }, { receiverId: userId }],
            ...(key
                ? {
                      message: {
                          contains: key,
                          mode: Prisma.QueryMode.insensitive,
                      },
                  }
                : {}),
        };
        const [total, data] = await this.databaseService.$transaction([
            this.databaseService.friendApplication.count({ where }),
            this.databaseService.friendApplication.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * perPage,
                take: perPage,
                include: {
                    sender: {
                        select: this.userSelect(),
                    },
                    receiver: {
                        select: this.userSelect(),
                    },
                },
            }),
        ]);

        return { data, total };
    }

    async expireApplicationsForUser(userId: string, now: Date): Promise<void> {
        await this.databaseService.friendApplication.updateMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
                status: {
                    in: [
                        EnumFriendApplicationStatus.unread,
                        EnumFriendApplicationStatus.read,
                    ],
                },
                expiredAt: {
                    lte: now,
                },
            },
            data: {
                status: EnumFriendApplicationStatus.expired,
            },
        });
    }

    async markApplicationsRead(
        receiverId: string,
        senderIds: string[],
        now: Date
    ): Promise<void> {
        await this.databaseService.friendApplication.updateMany({
            where: {
                receiverId,
                senderId: {
                    in: senderIds,
                },
                status: EnumFriendApplicationStatus.unread,
                OR: [
                    {
                        expiredAt: null,
                    },
                    {
                        expiredAt: {
                            gt: now,
                        },
                    },
                ],
            },
            data: {
                status: EnumFriendApplicationStatus.read,
            },
        });
    }

    async acceptApplication(
        receiverId: string,
        senderId: string,
        now: Date
    ): Promise<IContactAcceptApplicationResult | null> {
        return this.databaseUtil.retrySerializableTransaction(() =>
            this.databaseService.$transaction(
                async tx => {
                    const application = await tx.friendApplication.findFirst({
                        where: {
                            receiverId,
                            senderId,
                            status: {
                                in: [
                                    EnumFriendApplicationStatus.unread,
                                    EnumFriendApplicationStatus.read,
                                ],
                            },
                            OR: [
                                {
                                    expiredAt: null,
                                },
                                {
                                    expiredAt: {
                                        gt: now,
                                    },
                                },
                            ],
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                        select: {
                            id: true,
                        },
                    });
                    if (!application) {
                        return null;
                    }

                    const applicant = await tx.user.findUnique({
                        where: {
                            id: senderId,
                            deletedAt: null,
                        },
                        select: this.userSelect(),
                    });
                    if (!applicant) {
                        return null;
                    }

                    await tx.friendApplication.update({
                        where: {
                            id: application.id,
                        },
                        data: {
                            status: EnumFriendApplicationStatus.accepted,
                        },
                    });
                    await tx.friend.upsert({
                        where: {
                            userId_friendId: {
                                userId: receiverId,
                                friendId: senderId,
                            },
                        },
                        create: {
                            userId: receiverId,
                            friendId: senderId,
                            status: EnumFriendStatus.normal,
                        },
                        update: {
                            status: EnumFriendStatus.normal,
                        },
                    });
                    await tx.friend.upsert({
                        where: {
                            userId_friendId: {
                                userId: senderId,
                                friendId: receiverId,
                            },
                        },
                        create: {
                            userId: senderId,
                            friendId: receiverId,
                            status: EnumFriendStatus.normal,
                        },
                        update: {
                            status: EnumFriendStatus.normal,
                        },
                    });

                    const existingConversation =
                        await this.findCommonSingleConversationTx(
                            tx,
                            receiverId,
                            senderId
                        );
                    if (existingConversation) {
                        return {
                            applicant,
                            conversationId: existingConversation.id,
                        };
                    }

                    const conversation = await tx.conversation.create({
                        data: {
                            name: '',
                            type: EnumConversationType.single,
                            status: EnumConversationStatus.normal,
                            members: {
                                createMany: {
                                    data: [
                                        {
                                            userId: receiverId,
                                            role: EnumConversationMemberRole.member,
                                            status: EnumConversationMemberStatus.normal,
                                        },
                                        {
                                            userId: senderId,
                                            role: EnumConversationMemberRole.member,
                                            status: EnumConversationMemberStatus.normal,
                                        },
                                    ],
                                },
                            },
                        },
                        select: {
                            id: true,
                        },
                    });

                    return {
                        applicant,
                        conversationId: conversation.id,
                    };
                },
                {
                    isolationLevel:
                        Prisma.TransactionIsolationLevel.Serializable,
                }
            )
        );
    }

    async deleteFriend(userId: string, friendId: string): Promise<void> {
        await this.databaseUtil.retrySerializableTransaction(() =>
            this.databaseService.$transaction(
                async tx => {
                    await tx.friend.updateMany({
                        where: {
                            OR: [
                                { userId, friendId },
                                { userId: friendId, friendId: userId },
                            ],
                        },
                        data: {
                            status: EnumFriendStatus.deleted,
                        },
                    });
                    const conversations = await tx.conversation.findMany({
                        where: {
                            type: EnumConversationType.single,
                            status: EnumConversationStatus.normal,
                            AND: [
                                {
                                    members: {
                                        some: {
                                            userId,
                                            status: EnumConversationMemberStatus.normal,
                                        },
                                    },
                                },
                                {
                                    members: {
                                        some: {
                                            userId: friendId,
                                            status: EnumConversationMemberStatus.normal,
                                        },
                                    },
                                },
                            ],
                        },
                        select: {
                            id: true,
                        },
                    });
                    const conversationIds = conversations.map(({ id }) => id);
                    if (conversationIds.length === 0) {
                        return;
                    }

                    await tx.conversationMember.updateMany({
                        where: {
                            conversationId: {
                                in: conversationIds,
                            },
                        },
                        data: {
                            status: EnumConversationMemberStatus.deleted,
                        },
                    });
                    await tx.conversation.updateMany({
                        where: {
                            id: {
                                in: conversationIds,
                            },
                        },
                        data: {
                            status: EnumConversationStatus.deleted,
                        },
                    });
                },
                {
                    isolationLevel:
                        Prisma.TransactionIsolationLevel.Serializable,
                }
            )
        );
    }

    async blockFriend(userId: string, friendId: string): Promise<number> {
        const result = await this.databaseService.friend.updateMany({
            where: {
                userId,
                friendId,
                status: {
                    not: EnumFriendStatus.deleted,
                },
            },
            data: {
                status: EnumFriendStatus.blocked,
            },
        });

        return result.count;
    }

    private async findCommonSingleConversationTx(
        tx: Prisma.TransactionClient,
        userId: string,
        friendId: string
    ): Promise<IContactSingleConversation | null> {
        return tx.conversation.findFirst({
            where: {
                type: EnumConversationType.single,
                status: EnumConversationStatus.normal,
                AND: [
                    {
                        members: {
                            some: {
                                userId,
                                status: EnumConversationMemberStatus.normal,
                            },
                        },
                    },
                    {
                        members: {
                            some: {
                                userId: friendId,
                                status: EnumConversationMemberStatus.normal,
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
            },
        });
    }

    private createUserIdentifierWhere(
        identifier: string
    ): Prisma.UserWhereInput | null {
        if (/^\d+$/.test(identifier)) {
            return {
                legacyId: BigInt(identifier),
            };
        }

        if (
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                identifier
            )
        ) {
            return {
                id: identifier,
            };
        }

        return null;
    }

    private userSelect(): Prisma.UserSelect {
        return {
            id: true,
            legacyId: true,
            name: true,
            username: true,
            email: true,
            avatar: true,
            photo: true,
            signature: true,
            gender: true,
            status: true,
            mobileNumbers: {
                take: 1,
                select: {
                    number: true,
                },
            },
        };
    }
}
