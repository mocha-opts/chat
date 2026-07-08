import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UserLegacyLoginRequestDto {
    @ApiProperty({
        required: true,
        example: '13800138000',
        minLength: 5,
        maxLength: 20,
    })
    @Expose()
    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    @MaxLength(20)
    @Transform(({ value }) => value.trim())
    phone: string;

    @ApiProperty({
        required: true,
        example: 'aaAA@12345',
    })
    @Expose()
    @IsString()
    @IsNotEmpty()
    password: string;
}
