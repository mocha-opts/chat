import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class MomentUserRequestDto {
    @ApiProperty({
        required: true,
        example: '1000000000000000001',
    })
    @Expose()
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    @Transform(({ value }) => String(value).trim())
    userId: string;
}
