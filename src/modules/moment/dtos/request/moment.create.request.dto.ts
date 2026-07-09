import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class MomentCreateRequestDto {
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

    @ApiPropertyOptional({
        nullable: true,
        example: 'hello',
        maxLength: 2000,
    })
    @Expose()
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    @Transform(({ value }) =>
        value === undefined || value === null ? value : String(value).trim()
    )
    text?: string;

    @ApiPropertyOptional({
        type: [String],
        example: ['https://example.com/a.png'],
    })
    @Expose()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @MaxLength(2048, { each: true })
    mediaUrls?: string[];
}
