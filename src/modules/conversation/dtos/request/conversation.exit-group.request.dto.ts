import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class ConversationExitGroupRequestDto {
    @ApiProperty({
        required: true,
        example: '1',
    })
    @Expose()
    @IsString()
    @Transform(({ value }) => String(value).trim())
    sessionId: string;

    @ApiProperty({
        required: true,
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @Expose()
    @IsString()
    @Transform(({ value }) => String(value).trim())
    userId: string;
}
