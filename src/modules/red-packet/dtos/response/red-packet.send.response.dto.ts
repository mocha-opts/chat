import {
    EnumMessagingLegacyConversationType,
    EnumMessagingLegacyMessageType,
} from '@modules/messaging/enums/messaging.legacy.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RedPacketSendResponseDto {
    @ApiProperty({
        required: true,
        example: '1000000000000000001',
    })
    @Expose()
    sessionId: string;

    @ApiProperty({
        required: true,
        enum: EnumMessagingLegacyConversationType,
    })
    @Expose()
    sessionType: EnumMessagingLegacyConversationType;

    @ApiProperty({
        required: true,
        enum: EnumMessagingLegacyMessageType,
    })
    @Expose()
    type: EnumMessagingLegacyMessageType;

    @ApiProperty({
        required: true,
        example: '1000000000000000004',
    })
    @Expose()
    messageId: string;

    @ApiProperty({
        required: true,
    })
    @Expose()
    body: Record<string, unknown>;

    @ApiProperty({
        required: true,
        example: '2026-07-09 12:00:00',
    })
    @Expose()
    createdAt: string;
}
