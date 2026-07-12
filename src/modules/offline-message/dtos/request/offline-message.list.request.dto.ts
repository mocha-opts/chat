import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class OfflineMessageListRequestDto {
    @ApiProperty({
        required: true,
        example: '1000000000000000002',
    })
    @Expose()
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    @Transform(({ value }) => String(value).trim())
    userId: string;

    @ApiProperty({
        required: true,
        example: '2026-07-09 12:00:00',
    })
    @Expose()
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    time: string;

    @ApiProperty({
        required: false,
        minimum: 1,
        maximum: 500,
    })
    @Expose()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(500)
    limit?: number;

    @ApiProperty({
        required: false,
        example: '1000000000000000002',
    })
    @Expose()
    @IsOptional()
    @IsString()
    @MaxLength(64)
    @Matches(/^\d+$/)
    @Transform(({ value }) => (value === undefined ? undefined : String(value).trim()))
    cursor?: string;
}
