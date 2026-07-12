import { DatabaseUtil } from '@common/database/utils/database.util';
import { DatabaseService } from '@common/database/services/database.service';
import { KafkaTopics } from '@common/kafka/constants/kafka.topic.constant';
import {
    EnumConversationMemberStatus,
    EnumConversationStatus,
    EnumConversationType,
    EnumFriendStatus,
    EnumMessageOutboxStatus,
    Prisma,
} from '@generated/prisma-client';
import {
    MessagingOutboxMaxRetryCount,
    MessagingOutboxPendingTimeoutInMs,
    MessagingOutboxRetryBatchSize,
    MessagingOutboxRetryDelayInMs,
} from '@modules/messaging/constants/messaging.constant';
import {
    IMessagingConversation,
    IMessagingConversationMember,
    IMessagingCreateMessagePayload,
    IMessagingCreateMessageResult,
    IMessagingCreatedMessage,
    IMessagingOutbox,
    IMessagingUser,
} from '@modules/messaging/interfaces/messaging.interface';
import { createMessagingUserIdentifierWhere } from '@modules/messaging/utils/messaging.identifier.util';
import { Injectable } from '@nestjs/common';

interface IMessagingOutboxRow {
    id: bigint;
    message_id: bigint;
    topic: string;
    message_key: string;
    payload: Prisma.JsonValue;
    status: EnumMessageOutboxStatus;
    retry_count: number;
}

@Injectable()
export class MessagingRepository {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly databaseUtil: DatabaseUtil
    ) {}

    async findUserByIdentifier(
        identifier: string
    ): Promise<IMessagingUser | null> {
        const where = createMessagingUserIdentifierWhere(identifier);
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

    async findConversation(
        conversationId: bigint
    ): Promise<IMessagingConversation | null> {
        return this.databaseService.conversation.findFirst({
            where: {
                id: conversationId,
                status: EnumConversationStatus.normal,
            },
            select: {
                id: true,
                name: true,
                type: true,
            },
        });
    }

    async findMember(
        conversationId: bigint,
        userId: string
    ): Promise<IMessagingConversationMember | null> {
        return this.databaseService.conversationMember.findFirst({
            where: {
                conversationId,
                userId,
                status: EnumConversationMemberStatus.normal,
            },
            select: {
                userId: true,
                user: {
                    select: this.userSelect(),
                },
            },
        });
    }

    async findNormalFriend(
        userId: string,
        friendId: string
    ): Promise<{ friendId: string } | null> {
        return this.databaseService.friend.findFirst({
            where: {
                userId,
                friendId,
                status: EnumFriendStatus.normal,
            },
            select: {
                friendId: true,
            },
        });
    }

    async findConversationMembers(
        conversationId: bigint
    ): Promise<IMessagingConversationMember[]> {
        return this.databaseService.conversationMember.findMany({
            where: {
                conversationId,
                status: EnumConversationMemberStatus.normal,
            },
            orderBy: {
                createdAt: 'asc',
            },
            select: {
                userId: true,
                user: {
                    select: this.userSelect(),
                },
            },
        });
    }

    async findSingleConversation(
        conversationId: bigint,
        senderId: string,
        receiverId: string
    ): Promise<IMessagingConversation | null> {
        return this.databaseService.conversation.findFirst({
            where: {
                id: conversationId,
                type: EnumConversationType.single,
                status: EnumConversationStatus.normal,
                AND: [
                    {
                        members: {
                            some: {
                                userId: senderId,
                                status: EnumConversationMemberStatus.normal,
                            },
                        },
                    },
                    {
                        members: {
                            some: {
                                userId: receiverId,
                                status: EnumConversationMemberStatus.normal,
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                type: true,
            },
        });
    }

    async createMessageWithOutbox(
        payload: IMessagingCreateMessagePayload
    ): Promise<IMessagingCreateMessageResult> {
        return this.databaseUtil.retrySerializableTransaction(() =>
            this.databaseService.$transaction(
                async tx => {
                    const message = await tx.message.create({
                        data: {
                            id: payload.messageId,
                            senderId: payload.senderId,
                            conversationId: payload.conversationId,
                            conversationType: payload.conversationType,
                            type: payload.messageType,
                            content: payload.content,
                            body: payload.body,
                            replyId: payload.replyId,
                            createdAt: new Date(payload.event.payload.createdAt),
                        },
                        select: this.messageSelect(),
                    });

                    const outbox = await tx.messageOutbox.create({
                        data: {
                            messageId: message.id,
                            topic: KafkaTopics.imMessagePersist,
                            messageKey: message.conversationId.toString(),
                            payload: payload.event as unknown as Prisma.InputJsonValue,
                            status: EnumMessageOutboxStatus.init,
                            retryCount: 0,
                            nextRetryAt: new Date(),
                        },
                        select: this.outboxSelect(),
                    });

                    return { message, outbox };
                },
                {
                    isolationLevel:
                        Prisma.TransactionIsolationLevel.Serializable,
                }
            )
        );
    }

    async createMessageFromPersistPayload(
        payload: IMessagingCreateMessagePayload
    ): Promise<void> {
        await this.databaseUtil.retrySerializableTransaction(() =>
            this.databaseService.$transaction(
                async tx => {
                    const existing = await tx.message.findUnique({
                        where: {
                            id: payload.messageId,
                        },
                        select: {
                            id: true,
                        },
                    });
                    if (existing) {
                        return;
                    }

                    await tx.message.create({
                        data: {
                            id: payload.messageId,
                            senderId: payload.senderId,
                            conversationId: payload.conversationId,
                            conversationType: payload.conversationType,
                            type: payload.messageType,
                            content: payload.content,
                            body: payload.body,
                            replyId: payload.replyId,
                            createdAt: new Date(payload.event.payload.createdAt),
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

    async markOutboxPending(outbox: IMessagingOutbox): Promise<IMessagingOutbox> {
        return this.databaseService.messageOutbox.update({
            where: {
                id: outbox.id,
            },
            data: {
                status: EnumMessageOutboxStatus.pending,
                retryCount: {
                    increment: 1,
                },
                nextRetryAt: new Date(
                    Date.now() + MessagingOutboxPendingTimeoutInMs
                ),
                lastError: null,
            },
            select: this.outboxSelect(),
        });
    }

    async markOutboxSent(outboxId: bigint): Promise<void> {
        await this.databaseService.messageOutbox.update({
            where: {
                id: outboxId,
            },
            data: {
                status: EnumMessageOutboxStatus.sent,
                lastError: null,
            },
        });
    }

    async markOutboxFailed(outboxId: bigint, error: string): Promise<void> {
        await this.databaseService.messageOutbox.update({
            where: {
                id: outboxId,
            },
            data: {
                status: EnumMessageOutboxStatus.failed,
                nextRetryAt: new Date(Date.now() + MessagingOutboxRetryDelayInMs),
                lastError: error.slice(0, 500),
            },
        });
    }

    async claimRetryableOutboxes(): Promise<IMessagingOutbox[]> {
        const pendingExpiredAt = new Date(
            Date.now() - MessagingOutboxPendingTimeoutInMs
        );
        const now = new Date();
        const nextRetryAt = new Date(
            now.getTime() + MessagingOutboxPendingTimeoutInMs
        );
        const rows = await this.databaseService.$queryRaw<IMessagingOutboxRow[]>`
            WITH candidates AS (
                SELECT id
                FROM message_outboxes
                WHERE status IN (
                    'init'::"EnumMessageOutboxStatus",
                    'failed'::"EnumMessageOutboxStatus",
                    'pending'::"EnumMessageOutboxStatus"
                )
                    AND retry_count < ${MessagingOutboxMaxRetryCount}
                    AND (
                        next_retry_at <= ${now}
                        OR (
                            status = 'pending'::"EnumMessageOutboxStatus"
                            AND updated_at <= ${pendingExpiredAt}
                        )
                    )
                ORDER BY created_at ASC
                LIMIT ${MessagingOutboxRetryBatchSize}
                FOR UPDATE SKIP LOCKED
            )
            UPDATE message_outboxes AS outbox
            SET status = 'pending'::"EnumMessageOutboxStatus",
                retry_count = outbox.retry_count + 1,
                next_retry_at = ${nextRetryAt},
                last_error = NULL,
                updated_at = ${now}
            FROM candidates
            WHERE outbox.id = candidates.id
            RETURNING
                outbox.id,
                outbox.message_id,
                outbox.topic,
                outbox.message_key,
                outbox.payload,
                outbox.status,
                outbox.retry_count
        `;

        return rows.map(row => ({
            id: row.id,
            messageId: row.message_id,
            topic: row.topic,
            messageKey: row.message_key,
            payload: row.payload,
            status: row.status,
            retryCount: row.retry_count,
        }));
    }

    async findMessageById(
        messageId: bigint
    ): Promise<IMessagingCreatedMessage | null> {
        return this.databaseService.message.findUnique({
            where: {
                id: messageId,
            },
            select: this.messageSelect(),
        });
    }

    private userSelect(): Prisma.UserSelect {
        return {
            id: true,
            legacyId: true,
            username: true,
            name: true,
            avatar: true,
            photo: true,
            status: true,
        };
    }

    private messageSelect(): Prisma.MessageSelect {
        return {
            id: true,
            senderId: true,
            conversationId: true,
            conversationType: true,
            type: true,
            content: true,
            body: true,
            replyId: true,
            createdAt: true,
        };
    }

    private outboxSelect(): Prisma.MessageOutboxSelect {
        return {
            id: true,
            messageId: true,
            topic: true,
            messageKey: true,
            payload: true,
            status: true,
            retryCount: true,
        };
    }
}
