import { DatabaseService } from '@common/database/services/database.service';
import {
    EnumConversationMemberStatus,
    EnumConversationStatus,
    Prisma,
} from '@generated/prisma-client';
import {
    IOfflineMessageConversation,
    IOfflineMessageUser,
} from '@modules/offline-message/interfaces/offline-message.interface';
import { createMessagingUserIdentifierWhere } from '@modules/messaging/utils/messaging.identifier.util';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OfflineMessageRepository {
    constructor(private readonly databaseService: DatabaseService) {}

    async findUserByIdentifier(
        identifier: string
    ): Promise<IOfflineMessageUser | null> {
        const where = createMessagingUserIdentifierWhere(identifier);
        if (!where) {
            return null;
        }

        return this.databaseService.user.findFirst({
            where: {
                ...where,
                deletedAt: null,
            },
            select: {
                id: true,
                legacyId: true,
                username: true,
                name: true,
                avatar: true,
                status: true,
            },
        });
    }

    async findConversationsWithMessages(
        userId: string,
        since: Date
    ): Promise<IOfflineMessageConversation[]> {
        return this.databaseService.conversationMember.findMany({
            where: {
                userId,
                status: EnumConversationMemberStatus.normal,
                conversation: {
                    status: EnumConversationStatus.normal,
                    messages: {
                        some: {
                            createdAt: {
                                gte: since,
                            },
                        },
                    },
                },
            },
            orderBy: {
                conversation: {
                    updatedAt: 'desc',
                },
            },
            select: {
                conversation: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        messages: {
                            where: {
                                createdAt: {
                                    gte: since,
                                },
                            },
                            orderBy: {
                                createdAt: 'asc',
                            },
                            select: {
                                id: true,
                                senderId: true,
                                conversationId: true,
                                conversationType: true,
                                type: true,
                                content: true,
                                body: true,
                                replyId: true,
                                createdAt: true,
                                sender: {
                                    select: this.senderSelect(),
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    private senderSelect(): Prisma.UserSelect {
        return {
            id: true,
            legacyId: true,
            username: true,
            name: true,
            avatar: true,
        };
    }
}
