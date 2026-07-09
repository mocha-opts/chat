import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class MomentListRequestDto {
    @ApiProperty({
        required: true,
        example: '2026-07-09 12:00:00',
    })
    @Expose()
    @IsString()
    @IsNotEmpty()
    @MaxLength(32)
    @Transform(({ value }) => String(value).trim())
    time: string;
}
