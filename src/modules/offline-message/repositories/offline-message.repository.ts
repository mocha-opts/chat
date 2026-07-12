import { DatabaseService } from '@common/database/services/database.service';
import {
    EnumConversationMemberStatus,
    EnumConversationStatus,
    Prisma,
} from '@generated/prisma-client';
import {
    IOfflineMessageConversation,
    IOfflineMessageEntityWithConversation,
    IOfflineMessageListResult,
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
        since: Date,
        limit: number | null,
        cursor: string | null
    ): Promise<IOfflineMessageListResult> {
        const take = limit ? limit + 1 : undefined;
        const rows = await this.databaseService.message.findMany({
            where: {
                conversation: {
                    status: EnumConversationStatus.normal,
                    members: {
                        some: {
                            userId,
                            status: EnumConversationMemberStatus.normal,
                        },
                    },
                },
                createdAt: {
                    gte: since,
                },
                ...(cursor
                    ? {
                          id: {
                              gt: BigInt(cursor),
                          },
                      }
                    : {}),
            },
            orderBy: [
                {
                    id: 'asc',
                },
            ],
            take,
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
                conversation: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
        });
        const includedRows = limit ? rows.slice(0, limit) : rows;
        const nextCursor =
            limit && rows.length > limit
                ? includedRows[includedRows.length - 1]?.id.toString() ?? null
                : null;

        return {
            conversations: this.groupMessages(includedRows),
            nextCursor,
        };
    }

    private groupMessages(
        rows: IOfflineMessageEntityWithConversation[]
    ): IOfflineMessageConversation[] {
        const grouped = new Map<bigint, IOfflineMessageConversation>();

        for (const row of rows) {
            const existing = grouped.get(row.conversation.id);
            const message = {
                id: row.id,
                senderId: row.senderId,
                conversationId: row.conversationId,
                conversationType: row.conversationType,
                type: row.type,
                content: row.content,
                body: row.body,
                replyId: row.replyId,
                createdAt: row.createdAt,
                sender: row.sender,
            };
            if (existing) {
                existing.conversation.messages.push(message);
                continue;
            }

            grouped.set(row.conversation.id, {
                conversation: {
                    id: row.conversation.id,
                    name: row.conversation.name,
                    type: row.conversation.type,
                    messages: [message],
                },
            });
        }

        return [...grouped.values()];
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
