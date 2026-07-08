import { IsCustomEmail } from '@common/request/validations/request.custom-email.validation';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class VerificationSendMailRequestDto {
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
}
