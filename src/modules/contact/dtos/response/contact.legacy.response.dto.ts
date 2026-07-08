import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class ContactUserResponseDto {
    @ApiProperty({
        required: true,
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @Expose()
    userUuid: string;

    @ApiProperty({
        required: true,
        example: 'alice',
    })
    @Expose()
    nickname: string;

    @ApiPropertyOptional({
        nullable: true,
        example: 'https://example.com/avatar.png',
    })
    @Expose()
    avatar: string | null;

    @ApiProperty({
        required: true,
        example: 'alice@example.com',
    })
    @Expose()
    email: string;

    @ApiPropertyOptional({
        nullable: true,
        example: '13800138000',
    })
    @Expose()
    phone: string | null;

    @ApiPropertyOptional({
        nullable: true,
        example: 'hello',
    })
    @Expose()
    signature: string | null;

    @ApiPropertyOptional({
        nullable: true,
        example: 'secret',
    })
    @Expose()
    gender: string | null;

    @ApiProperty({
        required: true,
        example: 1,
    })
    @Expose()
    status: number;

    @ApiPropertyOptional({
        nullable: true,
        example: '1',
    })
    @Expose()
    sessionId: string | null;
}

export class ContactApplyItemResponseDto {
    @ApiProperty({
        required: true,
    })
    @Expose()
    userUuid: string;

    @ApiProperty({
        required: true,
    })
    @Expose()
    nickname: string;

    @ApiPropertyOptional({
        nullable: true,
    })
    @Expose()
    avatar: string | null;

    @ApiPropertyOptional({
        nullable: true,
    })
    @Expose()
    msg: string | null;

    @ApiProperty({
        required: true,
        example: 0,
    })
    @Expose()
    status: number;

    @ApiProperty({
        required: true,
    })
    @Expose()
    time: Date;

    @ApiProperty({
        required: true,
        example: 1,
    })
    @Expose()
    isReceiver: number;
}

export class ContactApplyListResponseDto {
    @ApiProperty({
        required: true,
        example: 1,
    })
    @Expose()
    total: number;

    @ApiProperty({
        required: true,
        type: [ContactApplyItemResponseDto],
    })
    @Expose()
    @Type(() => ContactApplyItemResponseDto)
    data: ContactApplyItemResponseDto[];
}

export class ContactApplyCountResponseDto {
    @ApiProperty({
        required: true,
        example: 1,
    })
    @Expose()
    count: number;
}

export class ContactApplicationResponseDto {
    @ApiProperty({
        required: true,
    })
    @Expose()
    userId: string;

    @ApiProperty({
        required: true,
    })
    @Expose()
    sessionId: string;

    @ApiProperty({
        required: true,
        example: 1,
    })
    @Expose()
    sessionType: number;

    @ApiProperty({
        required: true,
    })
    @Expose()
    sessionName: string;

    @ApiPropertyOptional({
        nullable: true,
    })
    @Expose()
    avatar: string | null;
}

export class ContactMessageResponseDto {
    @ApiProperty({
        required: true,
    })
    @Expose()
    message: string;
}
