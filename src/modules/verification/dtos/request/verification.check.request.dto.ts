import { IsCustomEmail } from '@common/request/validations/request.custom-email.validation';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, MaxLength } from 'class-validator';

export class VerificationCheckRequestDto {
    @ApiProperty({
        required: true,
        example: 'user@example.com',
        maxLength: 100,
    })
    @Expose()
    @IsCustomEmail()
    @IsNotEmpty()
    @MaxLength(100)
    @Transform(({ value }) => value.toLowerCase().trim())
    email: Lowercase<string>;

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
