import { IsPassword } from '@common/request/validations/request.is-password.validation';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
    IsNotEmpty,
    IsString,
    Length,
    MaxLength,
    MinLength,
} from 'class-validator';

export class UserLegacyRegisterRequestDto {
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
        minLength: 8,
        maxLength: 50,
    })
    @Expose()
    @IsNotEmpty()
    @IsPassword()
    @MinLength(8)
    @MaxLength(50)
    password: string;

    @ApiProperty({
        required: true,
        example: '123456',
        minLength: 6,
        maxLength: 6,
    })
    @Expose()
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    @Transform(({ value }) => value.trim())
    code: string;
}
