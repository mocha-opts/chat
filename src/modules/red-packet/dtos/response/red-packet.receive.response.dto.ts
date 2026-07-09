import { EnumRedPacketLegacyStatus } from '@modules/red-packet/enums/red-packet.legacy.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RedPacketReceiveResponseDto {
    @ApiProperty({
        required: true,
        nullable: true,
        example: '1.00',
    })
    @Expose()
    receivedAmount: string | null;

    @ApiProperty({
        required: true,
        enum: EnumRedPacketLegacyStatus,
    })
    @Expose()
    status: EnumRedPacketLegacyStatus;
}
