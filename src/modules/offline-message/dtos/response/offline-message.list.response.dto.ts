import { EnumMessagingLegacyConversationType } from '@modules/messaging/enums/messaging.legacy.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class OfflineMessageBodyResponseDto {
    @ApiProperty({
        required: false,
        nullable: true,
    })
    @Expose()
    content: string | null;

    @ApiProperty({
        required: true,
        example: '2026-07-09 12:00:00',
    })
    @Expose()
    createdAt: string;

    @ApiProperty({
        required: false,
        nullable: true,
    })
    @Expose()
    replyId: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
    })
    @Expose()
    redPacketWrapperText: string | null;
}

export class OfflineMessageDetailResponseDto {
    @ApiProperty({
        required: false,
        nullable: true,
    })
    @Expose()
    avatar: string | null;

    @ApiProperty({
        required: true,
        type: OfflineMessageBodyResponseDto,
    })
    @Expose()
    @Type(() => OfflineMessageBodyResponseDto)
    offlineMsgBody: OfflineMessageBodyResponseDto;

    @ApiProperty({
        required: true,
    })
    @Expose()
    type: number;

    @ApiProperty({
        required: true,
    })
    @Expose()
    userName: string;

    @ApiProperty({
        required: true,
    })
    @Expose()
    sendUserId: string;

    @ApiProperty({
        required: true,
    })
    @Expose()
    messageId: string;
}

export class OfflineMessageResponseDto {
    @ApiProperty({
        required: true,
    })
    @Expose()
    total: number;

    @ApiProperty({
        required: true,
    })
    @Expose()
    sessionId: string;

    @ApiProperty({
        required: false,
        nullable: true,
    })
    @Expose()
    sessionName: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
    })
    @Expose()
    sessionAvatar: string | null;

    @ApiProperty({
        required: true,
        enum: EnumMessagingLegacyConversationType,
    })
    @Expose()
    sessionType: EnumMessagingLegacyConversationType;

    @ApiProperty({
        required: true,
        type: [OfflineMessageDetailResponseDto],
    })
    @Expose()
    @Type(() => OfflineMessageDetailResponseDto)
    offlineMsgDetails: OfflineMessageDetailResponseDto[];
}

export class OfflineMessageListResponseDto {
    @ApiProperty({
        required: true,
        type: [OfflineMessageResponseDto],
    })
    @Expose()
    @Type(() => OfflineMessageResponseDto)
    offlineMsg: OfflineMessageResponseDto[];
}
