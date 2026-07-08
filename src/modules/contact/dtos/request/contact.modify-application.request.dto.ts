import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ContactModifyApplicationRequestDto {
    @ApiProperty({
        required: true,
        isArray: true,
        example: ['550e8400-e29b-41d4-a716-446655440000'],
    })
    @Expose()
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    @Transform(({ value }) =>
        Array.isArray(value)
            ? value.map(item => String(item).trim())
            : value
    )
    receiveUserUuids: string[];
}
