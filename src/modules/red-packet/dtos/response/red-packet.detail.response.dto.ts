import {
    EnumRedPacketLegacyStatus,
    EnumRedPacketLegacyType,
} from '@modules/red-packet/enums/red-packet.legacy.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class RedPacketUserResponseDto {
    @ApiProperty({
        required: true,
        nullable: true,
    })
    @Expose()
    userName: string | null;

    @ApiProperty({
        required: true,
        nullable: true,
    })
    @Expose()
    avatar: string | null;

    @ApiProperty({
        required: true,
        example: '2026-07-09 12:00:00',
    })
    @Expose()
    receivedAt: string;

    @ApiProperty({
        required: true,
        example: '1.00',
    })
    @Expose()
    amount: string;
}

export class RedPacketDetailResponseDto {
    @ApiProperty({
        required: true,
        type: [RedPacketUserResponseDto],
    })
    @Expose()
    @Type(() => RedPacketUserResponseDto)
    list: RedPacketUserResponseDto[];

    @ApiProperty({
        required: true,
        nullable: true,
    })
    @Expose()
    senderName: string | null;

    @ApiProperty({
        required: true,
        nullable: true,
    })
    @Expose()
    senderAvatar: string | null;

    @ApiProperty({
        required: true,
    })
    @Expose()
    redPacketWrapperText: string;

    @ApiProperty({
        required: true,
        enum: EnumRedPacketLegacyType,
    })
    @Expose()
    redPacketType: EnumRedPacketLegacyType;

    @ApiProperty({
        required: true,
        example: '10.00',
    })
    @Expose()
    totalAmount: string;

    @ApiProperty({
        required: true,
    })
    @Expose()
    totalCount: number;

    @ApiProperty({
        required: true,
        example: '5.00',
    })
    @Expose()
    remainingAmount: string;

    @ApiProperty({
        required: true,
    })
    @Expose()
    remainingCount: number;

    @ApiProperty({
        required: true,
        enum: EnumRedPacketLegacyStatus,
    })
    @Expose()
    status: EnumRedPacketLegacyStatus;
}
