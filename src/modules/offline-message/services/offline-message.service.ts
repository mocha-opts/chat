import { IResponseReturn } from '@common/response/interfaces/response.interface';
import { EnumConversationType, EnumUserStatus } from '@generated/prisma-client';
import {
    MessagingDateFormat,
    MessagingDefaultGroupAvatar,
} from '@modules/messaging/constants/messaging.constant';
import {
    EnumMessagingLegacyConversationType,
    EnumMessagingLegacyMessageType,
} from '@modules/messaging/enums/messaging.legacy.enum';
import { EnumMessagingStatusCodeError } from '@modules/messaging/enums/messaging.status-code.enum';
import { MessagingException } from '@modules/messaging/exceptions/messaging.exception';
import { OfflineMessageListRequestDto } from '@modules/offline-message/dtos/request/offline-message.list.request.dto';
import {
    OfflineMessageBodyResponseDto,
    OfflineMessageDetailResponseDto,
    OfflineMessageListResponseDto,
    OfflineMessageResponseDto,
} from '@modules/offline-message/dtos/response/offline-message.list.response.dto';
import {
    IOfflineMessageConversation,
    IOfflineMessageEntity,
    IOfflineMessageSender,
} from '@modules/offline-message/interfaces/offline-message.interface';
import { IOfflineMessageService } from '@modules/offline-message/interfaces/offline-message.service.interface';
import { OfflineMessageRepository } from '@modules/offline-message/repositories/offline-message.repository';
import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

@Injectable()
export class OfflineMessageService implements IOfflineMessageService {
    constructor(
        private readonly offlineMessageRepository: OfflineMessageRepository
    ) {}

    async list(
        authUserId: string,
        query: OfflineMessageListRequestDto
    ): Promise<IResponseReturn<OfflineMessageListResponseDto>> {
        const user = await this.offlineMessageRepository.findUserByIdentifier(
            query.userId
        );
        if (!user) {
            throw new MessagingException(
                EnumMessagingStatusCodeError.userNotFound
            );
        }
        if (user.id !== authUserId) {
            throw new MessagingException(EnumMessagingStatusCodeError.forbidden);
        }
        if (user.status !== EnumUserStatus.active) {
            throw new MessagingException(
                EnumMessagingStatusCodeError.userInactive
            );
        }

        const since = this.parseLegacyTime(query.time);
        const limit = query.limit ?? (query.cursor ? 200 : null);
        const result =
            await this.offlineMessageRepository.findConversationsWithMessages(
                user.id,
                since,
                limit,
                query.cursor ?? null
            );

        return {
            data: {
                nextCursor: result.nextCursor,
                offlineMsg: result.conversations.map(conversation =>
                    this.mapConversation(conversation)
                ),
            },
        };
    }

    private parseLegacyTime(time: string): Date {
        const parsed = DateTime.fromFormat(time, MessagingDateFormat);
        if (!parsed.isValid) {
            throw new MessagingException(
                EnumMessagingStatusCodeError.typeInvalid
            );
        }

        return parsed.toJSDate();
    }

    private mapConversation(
        item: IOfflineMessageConversation
    ): OfflineMessageResponseDto {
        const isGroup = item.conversation.type === EnumConversationType.group;
        const details = item.conversation.messages.map(message =>
            this.mapMessage(message)
        );

        return {
            total: details.length,
            sessionId: item.conversation.id.toString(),
            sessionName: isGroup ? item.conversation.name : null,
            sessionAvatar: isGroup ? MessagingDefaultGroupAvatar : null,
            sessionType: isGroup
                ? EnumMessagingLegacyConversationType.group
                : EnumMessagingLegacyConversationType.single,
            offlineMsgDetails: details,
        };
    }

    private mapMessage(
        message: IOfflineMessageEntity
    ): OfflineMessageDetailResponseDto {
        return {
            avatar: message.sender.avatar,
            offlineMsgBody: this.mapBody(message),
            type: this.toLegacyMessageType(message.type),
            userName: this.displayUsername(message.sender),
            sendUserId: this.displayUserId(message.sender),
            messageId: message.id.toString(),
        };
    }

    private mapBody(
        message: IOfflineMessageEntity
    ): OfflineMessageBodyResponseDto {
        const body = this.toRecord(message.body);

        return {
            content: message.content,
            createdAt: DateTime.fromJSDate(message.createdAt).toFormat(
                MessagingDateFormat
            ),
            replyId: message.replyId?.toString() ?? null,
            redPacketWrapperText: this.extractString(
                body,
                'redPacketWrapperText'
            ),
        };
    }

    private toLegacyMessageType(type: IOfflineMessageEntity['type']): number {
        switch (type) {
            case 'text':
                return EnumMessagingLegacyMessageType.text;
            case 'picture':
                return EnumMessagingLegacyMessageType.picture;
            case 'file':
                return EnumMessagingLegacyMessageType.file;
            case 'video':
                return EnumMessagingLegacyMessageType.video;
            case 'redPacket':
                return EnumMessagingLegacyMessageType.redPacket;
            case 'emoticon':
                return EnumMessagingLegacyMessageType.emoticon;
        }
    }

    private toRecord(value: unknown): Record<string, unknown> {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return value as Record<string, unknown>;
        }

        return {};
    }

    private extractString(
        body: Record<string, unknown>,
        field: string
    ): string | null {
        const value = body[field];
        return typeof value === 'string' && value.trim() ? value : null;
    }

    private displayUsername(user: IOfflineMessageSender): string {
        return user.name ?? user.username;
    }

    private displayUserId(
        user: Pick<IOfflineMessageSender, 'id' | 'legacyId'>
    ): string {
        return user.legacyId?.toString() ?? user.id;
    }
}
