import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';

export class ConversationSetAdminRequestDto {
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

    @ApiProperty({
        required: true,
        example: '550e8400-e29b-41d4-a716-446655440001',
    })
    @Expose()
    @IsString()
    @Transform(({ value }) => String(value).trim())
    targetId: string;

    @ApiProperty({
        required: true,
        example: true,
    })
    @Expose()
    @Type(() => Boolean)
    @IsBoolean()
    isAdmin: boolean;
}
