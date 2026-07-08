import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ContactAddFriendRequestDto {
    @ApiPropertyOptional({
        example: 'I am Alice',
        maxLength: 200,
    })
    @Expose()
    @IsOptional()
    @IsString()
    @MaxLength(200)
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value
    )
    msg?: string;
}
