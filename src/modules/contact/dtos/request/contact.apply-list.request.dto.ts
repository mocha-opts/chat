import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ContactApplyListRequestDto {
    @ApiPropertyOptional({
        example: 1,
        minimum: 1,
    })
    @Expose()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageNum?: number = 1;

    @ApiPropertyOptional({
        example: 20,
        minimum: 1,
        maximum: 100,
    })
    @Expose()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    pageSize?: number = 20;

    @ApiPropertyOptional({
        example: 'hello',
        maxLength: 100,
    })
    @Expose()
    @IsOptional()
    @IsString()
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value
    )
    key?: string;
}
