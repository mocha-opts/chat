import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class StorageUploadUrlRequestDto {
    @ApiProperty({
        required: true,
        example: 'avatar.png',
        maxLength: 255,
    })
    @Expose()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    @Transform(({ value }) => value.trim())
    fileName: string;
}
