import { EnumUserGender, EnumUserStatus } from '@generated/prisma-client';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserLegacyRegisterResponseDto {
    @ApiProperty({
        required: true,
        example: '13800138000',
    })
    @Expose()
    phone: string;
}

export class UserLegacyAuthResponseDto {
    @ApiProperty({
        required: true,
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @Expose()
    userId: string;

    @ApiProperty({
        required: true,
        example: 'user-abcd12',
    })
    @Expose()
    userName: string;

    @ApiProperty({
        required: false,
        nullable: true,
        example: 'https://example.com/avatar.png',
    })
    @Expose()
    avatar: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        example: 'hello',
    })
    @Expose()
    signature: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        enum: EnumUserGender,
    })
    @Expose()
    gender: EnumUserGender | null;

    @ApiProperty({
        required: true,
        enum: EnumUserStatus,
        example: EnumUserStatus.active,
    })
    @Expose()
    status: EnumUserStatus;

    @ApiProperty({
        required: true,
    })
    @Expose()
    token: string;
}
