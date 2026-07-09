import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RedPacketDetailRequestDto {
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
        example: 10,
        minimum: 1,
        maximum: 100,
    })
    @Expose()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    pageSize?: number = 10;
}
