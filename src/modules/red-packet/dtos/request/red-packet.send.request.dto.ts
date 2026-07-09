import {
    EnumMessagingLegacyConversationType,
    EnumMessagingLegacyMessageType,
} from '@modules/messaging/enums/messaging.legacy.enum';
import { EnumRedPacketLegacyType } from '@modules/red-packet/enums/red-packet.legacy.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
    IsDecimal,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';

export class RedPacketSendBodyRequestDto {
    @ApiProperty({
        required: true,
        enum: EnumRedPacketLegacyType,
        example: EnumRedPacketLegacyType.random,
    })
    @Expose()
    @IsIn(Object.values(EnumRedPacketLegacyType))
    @Transform(({ value }) => Number(value))
    redPacketType: EnumRedPacketLegacyType;

    @ApiProperty({
        required: true,
        example: '10.00',
    })
    @Expose()
    @IsString()
    @IsNotEmpty()
    @IsDecimal({
        decimal_digits: '0,2',
        force_decimal: false,
    })
    @Transform(({ value }) => String(value).trim())
    totalAmount: string;

    @ApiProperty({
        required: true,
        example: 5,
        minimum: 1,
    })
    @Expose()
    @IsInt()
    @Min(1)
    @Transform(({ value }) => Number(value))
    totalCount: number;

    @ApiPropertyOptional({
        example: '恭喜发财，大吉大利',
        maxLength: 100,
    })
    @Expose()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    @Transform(({ value }) =>
        value === undefined ? undefined : String(value).trim()
    )
    redPacketWrapperText?: string;
}

export class RedPacketSendRequestDto {
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

    @ApiPropertyOptional({
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
        enum: EnumMessagingLegacyMessageType,
        example: EnumMessagingLegacyMessageType.redPacket,
    })
    @Expose()
    @IsIn(Object.values(EnumMessagingLegacyMessageType))
    @Transform(({ value }) => Number(value))
    type: EnumMessagingLegacyMessageType;

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
        type: RedPacketSendBodyRequestDto,
    })
    @Expose()
    @ValidateNested()
    @Type(() => RedPacketSendBodyRequestDto)
    body: RedPacketSendBodyRequestDto;
}
