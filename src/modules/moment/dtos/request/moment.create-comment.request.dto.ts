import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class MomentCreateCommentRequestDto {
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
        example: 'great',
        maxLength: 1000,
    })
    @Expose()
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    @Transform(({ value }) => String(value).trim())
    comment: string;

    @ApiPropertyOptional({
        example: '1000000000000000003',
    })
    @Expose()
    @IsOptional()
    @IsNumberString()
    @Transform(({ value }) =>
        value === undefined ? undefined : String(value).trim()
    )
    parentCommentId?: string;
}
