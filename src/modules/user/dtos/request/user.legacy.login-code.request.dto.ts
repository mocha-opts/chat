import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
    IsNotEmpty,
    IsString,
    Length,
    MaxLength,
    MinLength,
} from 'class-validator';

export class UserLegacyLoginCodeRequestDto {
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
