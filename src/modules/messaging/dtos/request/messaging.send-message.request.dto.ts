import {
    EnumMessagingLegacyConversationType,
    EnumMessagingLegacyMessageType,
} from '@modules/messaging/enums/messaging.legacy.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
    IsIn,
    IsNotEmpty,
    IsNotEmptyObject,
    IsNumberString,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class MessagingSendMessageRequestDto {
    @ApiProperty({
        required: true,
        example: '1000000000000000001',
    })
    @Expose()
    @IsNumberString()
    @IsNotEmpty()
    @Transform(({ value }) => String(value).trim())
    sessionId: string;

    @ApiProperty({
        required: true,
        example: '1000000000000000002',
    })
    @Expose()
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    @Transform(({ value }) => String(value).trim())
    sendUserId: string;

    @ApiProperty({
        required: true,
        enum: EnumMessagingLegacyConversationType,
        example: EnumMessagingLegacyConversationType.single,
    })
    @Expose()
    @IsIn(Object.values(EnumMessagingLegacyConversationType))
    @Transform(({ value }) => Number(value))
    sessionType: EnumMessagingLegacyConversationType;

    @ApiProperty({
        required: true,
        enum: EnumMessagingLegacyMessageType,
        example: EnumMessagingLegacyMessageType.text,
    })
    @Expose()
    @IsIn(Object.values(EnumMessagingLegacyMessageType))
    @Transform(({ value }) => Number(value))
    type: EnumMessagingLegacyMessageType;

    @ApiProperty({
        required: false,
        example: '1000000000000000003',
    })
    @Expose()
    @IsOptional()
    @IsString()
    @MaxLength(64)
    @Transform(({ value }) =>
        value === undefined ? undefined : String(value).trim()
    )
    receiveUserId?: string;

    @ApiProperty({
        required: true,
        example: {
            content: 'hello',
        },
    })
    @Expose()
    @IsObject()
    @IsNotEmptyObject()
    body: Record<string, unknown>;
}
