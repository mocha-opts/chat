import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsNumberString, IsString, MaxLength } from 'class-validator';

export class RedPacketReceiveRequestDto {
    @ApiProperty({
        required: true,
        example: '1000000000000000001',
    })
    @Expose()
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    @Transform(({ value }) => String(value).trim())
    userId: string;

    @ApiProperty({
        required: true,
        example: '1000000000000000002',
    })
    @Expose()
    @IsNumberString()
    @IsNotEmpty()
    @Transform(({ value }) => String(value).trim())
    redPacketId: string;
}
