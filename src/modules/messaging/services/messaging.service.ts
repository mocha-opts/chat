import { DatabaseUtil } from '@common/database/utils/database.util';
import { HelperService } from '@common/helper/services/helper.service';
import { KafkaTopics } from '@common/kafka/constants/kafka.topic.constant';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import {
    EnumConversationType,
    EnumMessageType,
    EnumUserStatus,
    Prisma,
} from '@generated/prisma-client';
import {
    MessagingDateFormat,
    MessagingDefaultGroupAvatar,
    MessagingSnowflakeEpochInMs,
} from '@modules/messaging/constants/messaging.constant';
import { MessagingSendMessageRequestDto } from '@modules/messaging/dtos/request/messaging.send-message.request.dto';
import { MessagingSendMessageResponseDto } from '@modules/messaging/dtos/response/messaging.send-message.response.dto';
import {
    EnumMessagingLegacyConversationType,
    EnumMessagingLegacyMessageType,
} from '@modules/messaging/enums/messaging.legacy.enum';
import { MessagingConversationNotFoundException } from '@modules/messaging/exceptions/messaging.conversation-not-found.exception';
import { MessagingForbiddenException } from '@modules/messaging/exceptions/messaging.forbidden.exception';
import { MessagingFriendNotFoundException } from '@modules/messaging/exceptions/messaging.friend-not-found.exception';
import { MessagingMemberNotFoundException } from '@modules/messaging/exceptions/messaging.member-not-found.exception';
import { MessagingReceiverInvalidException } from '@modules/messaging/exceptions/messaging.receiver-invalid.exception';
import { MessagingTypeInvalidException } from '@modules/messaging/exceptions/messaging.type-invalid.exception';
import { MessagingUserInactiveException } from '@modules/messaging/exceptions/messaging.user-inactive.exception';
import { MessagingUserNotFoundException } from '@modules/messaging/exceptions/messaging.user-not-found.exception';
import {
    IMessagingMessagePersistPayload,
    IMessagingRealtimeMessage,
    IMessagingResolvedSend,
    IMessagingUser,
} from '@modules/messaging/interfaces/messaging.interface';
import { IMessagingService } from '@modules/messaging/interfaces/messaging.service.interface';
import { MessagingRepository } from '@modules/messaging/repositories/messaging.repository';
import { MessagingOutboxService } from '@modules/messaging/services/messaging.outbox.service';
import { RealtimeService } from '@modules/realtime/services/realtime.service';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DateTime } from 'luxon';

@Injectable()
export class MessagingService implements IMessagingService {
    private lastMessageTimestamp = 0n;
    private messageSequence = 0n;

    constructor(
        private readonly messagingRepository: MessagingRepository,
        private readonly messagingOutboxService: MessagingOutboxService,
        private readonly realtimeService: RealtimeService,
        private readonly databaseUtil: DatabaseUtil,
        private readonly helperService: HelperService
    ) {}

    async sendMessage(
        authUserId: string,
        body: MessagingSendMessageRequestDto
    ): Promise<IResponseReturn<MessagingSendMessageResponseDto>> {
        const resolved = await this.resolveSend(authUserId, body);
        const messageId = this.createMessageId();
        const createdAt = this.helperService.dateCreate();
        const messageType = this.toMessageType(body.type);
        const conversationType = this.toConversationType(body.sessionType);
        const messageBody = this.databaseUtil.toPlainObject<
            Record<string, unknown>,
            Prisma.InputJsonObject
        >(body.body);
        const content = this.resolveContent(body.type, body.body);
        const replyId = this.resolveReplyId(body.body);
        const eventPayload = this.createPersistPayload(
            messageId,
            resolved.sender.id,
            resolved.conversation.id,
            conversationType,
            messageType,
            body.sessionType,
            body.type,
            content,
            body.body,
            replyId,
            createdAt
        );
        const event = {
            eventId: randomUUID(),
            eventType: KafkaTopics.imMessagePersist,
            occurredAt: this.helperService.dateFormatToIso(createdAt),
            aggregateId: resolved.conversation.id.toString(),
            causationId: null,
            correlationId: null,
            payload: eventPayload,
        };
        const result = await this.messagingRepository.createMessageWithOutbox({
            messageId,
            senderId: resolved.sender.id,
            conversationId: resolved.conversation.id,
            conversationType,
            messageType,
            content,
            body: messageBody,
            replyId,
            event,
        });

        await this.messagingOutboxService.publish(result.outbox);
        await this.pushRealtime(resolved, eventPayload);

        return {
            data: {
                sessionId: body.sessionId,
                sessionType: body.sessionType,
                type: body.type,
                messageId: messageId.toString(),
                body: body.body,
                createdAt: this.formatLegacyDate(createdAt),
            },
        };
    }

    async persistFromKafka(
        payload: IMessagingMessagePersistPayload
    ): Promise<void> {
        const messageId = BigInt(payload.messageId);
        const existing = await this.messagingRepository.findMessageById(
            messageId
        );
        if (existing) {
            return;
        }

        const createdAt = this.helperService.dateCreateFromIso(
            payload.createdAt
        );
        const event = {
            eventId: randomUUID(),
            eventType: KafkaTopics.imMessagePersist,
            occurredAt: this.helperService.dateFormatToIso(createdAt),
            aggregateId: payload.conversationId,
            causationId: null,
            correlationId: null,
            payload,
        };

        await this.messagingRepository.createMessageFromPersistPayload({
            messageId,
            senderId: payload.senderId,
            conversationId: BigInt(payload.conversationId),
            conversationType: payload.conversationType,
            messageType: payload.type,
            content: payload.content,
            body: payload.body as Prisma.InputJsonValue,
            replyId: payload.replyId ? BigInt(payload.replyId) : null,
            event,
        });
    }

    private async resolveSend(
        authUserId: string,
        body: MessagingSendMessageRequestDto
    ): Promise<IMessagingResolvedSend> {
        const sender = await this.messagingRepository.findUserByIdentifier(
            body.sendUserId
        );
        if (!sender) {
            throw new MessagingUserNotFoundException();
        }
        this.assertActiveUser(sender);
        if (sender.id !== authUserId) {
            throw new MessagingForbiddenException();
        }

        const conversationId = BigInt(body.sessionId);
        const conversation = await this.messagingRepository.findConversation(
            conversationId
        );
        if (!conversation) {
            throw new MessagingConversationNotFoundException();
        }

        if (
            body.sessionType === EnumMessagingLegacyConversationType.single &&
            conversation.type === EnumConversationType.single
        ) {
            return this.resolveSingleSend(sender, conversationId, body);
        }

        if (
            body.sessionType === EnumMessagingLegacyConversationType.group &&
            conversation.type === EnumConversationType.group
        ) {
            return this.resolveGroupSend(sender, conversationId, conversation);
        }

        throw new MessagingConversationNotFoundException();
    }

    private async resolveSingleSend(
        sender: IMessagingUser,
        conversationId: bigint,
        body: MessagingSendMessageRequestDto
    ): Promise<IMessagingResolvedSend> {
        if (!body.receiveUserId) {
            throw new MessagingReceiverInvalidException();
        }

        const receiver = await this.messagingRepository.findUserByIdentifier(
            body.receiveUserId
        );
        if (!receiver) {
            throw new MessagingUserNotFoundException();
        }
        this.assertActiveUser(receiver);

        const friend = await this.messagingRepository.findNormalFriend(
            sender.id,
            receiver.id
        );
        if (!friend) {
            throw new MessagingFriendNotFoundException();
        }

        const conversation =
            await this.messagingRepository.findSingleConversation(
                conversationId,
                sender.id,
                receiver.id
            );
        if (!conversation) {
            throw new MessagingConversationNotFoundException();
        }

        return {
            sender,
            conversation,
            receiverUsers: [receiver],
        };
    }

    private async resolveGroupSend(
        sender: IMessagingUser,
        conversationId: bigint,
        conversation: IMessagingResolvedSend['conversation']
    ): Promise<IMessagingResolvedSend> {
        const senderMember = await this.messagingRepository.findMember(
            conversationId,
            sender.id
        );
        if (!senderMember) {
            throw new MessagingMemberNotFoundException();
        }

        const members =
            await this.messagingRepository.findConversationMembers(
                conversationId
            );
        const receiverUsers = members
            .filter(member => member.userId !== sender.id)
            .map(member => member.user);
        if (receiverUsers.length === 0) {
            throw new MessagingReceiverInvalidException();
        }

        return {
            sender,
            conversation,
            receiverUsers,
        };
    }

    private assertActiveUser(user: IMessagingUser): void {
        if (user.status !== EnumUserStatus.active) {
            throw new MessagingUserInactiveException();
        }
    }

    private toConversationType(
        type: EnumMessagingLegacyConversationType
    ): EnumConversationType {
        switch (type) {
            case EnumMessagingLegacyConversationType.single:
                return EnumConversationType.single;
            case EnumMessagingLegacyConversationType.group:
                return EnumConversationType.group;
        }
    }

    private toMessageType(type: EnumMessagingLegacyMessageType): EnumMessageType {
        switch (type) {
            case EnumMessagingLegacyMessageType.text:
                return EnumMessageType.text;
            case EnumMessagingLegacyMessageType.picture:
                return EnumMessageType.picture;
            case EnumMessagingLegacyMessageType.file:
                return EnumMessageType.file;
            case EnumMessagingLegacyMessageType.video:
                return EnumMessageType.video;
            case EnumMessagingLegacyMessageType.redPacket:
                return EnumMessageType.redPacket;
            case EnumMessagingLegacyMessageType.emoticon:
                return EnumMessageType.emoticon;
        }
    }

    private toLegacyConversationType(
        type: EnumConversationType
    ): EnumMessagingLegacyConversationType {
        switch (type) {
            case EnumConversationType.single:
                return EnumMessagingLegacyConversationType.single;
            case EnumConversationType.group:
                return EnumMessagingLegacyConversationType.group;
        }
    }

    private toLegacyMessageType(
        type: EnumMessageType
    ): EnumMessagingLegacyMessageType {
        switch (type) {
            case EnumMessageType.text:
                return EnumMessagingLegacyMessageType.text;
            case EnumMessageType.picture:
                return EnumMessagingLegacyMessageType.picture;
            case EnumMessageType.file:
                return EnumMessagingLegacyMessageType.file;
            case EnumMessageType.video:
                return EnumMessagingLegacyMessageType.video;
            case EnumMessageType.redPacket:
                return EnumMessagingLegacyMessageType.redPacket;
            case EnumMessageType.emoticon:
                return EnumMessagingLegacyMessageType.emoticon;
        }
    }

    private resolveContent(
        type: EnumMessagingLegacyMessageType,
        body: Record<string, unknown>
    ): string | null {
        const content = this.extractString(body, 'content');
        if (content) {
            return content;
        }

        if (type === EnumMessagingLegacyMessageType.redPacket) {
            return this.extractString(body, 'redPacketId');
        }

        return null;
    }

    private resolveReplyId(body: Record<string, unknown>): bigint | null {
        const replyId = this.extractString(body, 'replyId');
        if (!replyId) {
            return null;
        }

        if (!/^\d+$/.test(replyId)) {
            throw new MessagingTypeInvalidException();
        }

        return BigInt(replyId);
    }

    private createPersistPayload(
        messageId: bigint,
        senderId: string,
        conversationId: bigint,
        conversationType: EnumConversationType,
        type: EnumMessageType,
        legacySessionType: EnumMessagingLegacyConversationType,
        legacyType: EnumMessagingLegacyMessageType,
        content: string | null,
        body: Record<string, unknown>,
        replyId: bigint | null,
        createdAt: Date
    ): IMessagingMessagePersistPayload {
        return {
            messageId: messageId.toString(),
            senderId,
            conversationId: conversationId.toString(),
            conversationType,
            type,
            legacySessionType,
            legacyType,
            content,
            body,
            replyId: replyId?.toString() ?? null,
            createdAt: this.helperService.dateFormatToIso(createdAt),
        };
    }

    private async pushRealtime(
        resolved: IMessagingResolvedSend,
        payload: IMessagingMessagePersistPayload
    ): Promise<void> {
        const data: IMessagingRealtimeMessage = {
            sessionId: payload.conversationId,
            receiveUserIds: resolved.receiverUsers.map(user =>
                this.displayUserId(user)
            ),
            sendUserId: this.displayUserId(resolved.sender),
            userName: resolved.sender.name ?? resolved.sender.username,
            avatar: resolved.sender.avatar,
            type: this.toLegacyMessageType(payload.type),
            messageId: payload.messageId,
            sessionType: this.toLegacyConversationType(payload.conversationType),
            seesionName:
                resolved.conversation.type === EnumConversationType.group
                    ? resolved.conversation.name
                    : null,
            sessionAvatr:
                resolved.conversation.type === EnumConversationType.group
                    ? MessagingDefaultGroupAvatar
                    : null,
            created: this.formatLegacyDate(
                this.helperService.dateCreateFromIso(payload.createdAt)
            ),
            body: payload.body,
        };

        await Promise.all(
            resolved.receiverUsers.map(receiver =>
                this.realtimeService.pushMessage(
                    receiver.id,
                    data,
                    payload.messageId
                )
            )
        );
    }

    private createMessageId(): bigint {
        const timestamp = BigInt(Date.now()) - MessagingSnowflakeEpochInMs;
        if (timestamp === this.lastMessageTimestamp) {
            this.messageSequence = (this.messageSequence + 1n) & 4095n;
        } else {
            this.lastMessageTimestamp = timestamp;
            this.messageSequence = 0n;
        }

        return (
            (timestamp << 22n) |
            (BigInt(process.pid % 1024) << 12n) |
            this.messageSequence
        );
    }

    private extractString(
        body: Record<string, unknown>,
        field: string
    ): string | null {
        const value = body[field];
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }

        if (typeof value === 'number' && Number.isFinite(value)) {
            return value.toString();
        }

        return null;
    }

    private formatLegacyDate(date: Date): string {
        return DateTime.fromJSDate(date).toFormat(MessagingDateFormat);
    }

    private displayUserId(user: Pick<IMessagingUser, 'id' | 'legacyId'>): string {
        return user.legacyId?.toString() ?? user.id;
    }
}
