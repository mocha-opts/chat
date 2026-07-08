import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UserLegacyAvatarRequestDto {
    @ApiProperty({
        required: true,
        example: 'https://example.com/avatar.png',
        maxLength: 2048,
    })
    @Expose()
    @IsString()
    @IsNotEmpty()
    @MaxLength(2048)
    @Transform(({ value }) => value.trim())
    avatarUrl: string;
}
