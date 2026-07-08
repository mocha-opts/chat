import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ConversationInviteGroupRequestDto {
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
    inviterId: string;

    @ApiProperty({
        required: true,
        isArray: true,
        example: ['550e8400-e29b-41d4-a716-446655440001'],
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
    inviteeIds: string[];
}
