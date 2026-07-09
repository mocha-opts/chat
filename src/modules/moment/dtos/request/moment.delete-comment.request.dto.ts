import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsNumberString, IsString, MaxLength } from 'class-validator';

export class MomentDeleteCommentRequestDto {
    @ApiProperty({
        required: true,
        example: '1000000000000000003',
    })
    @Expose()
    @IsNumberString()
    @IsNotEmpty()
    @Transform(({ value }) => String(value).trim())
    commentId: string;

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
