import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class ConversationCreateGroupResponseDto {
    @ApiProperty({
        required: true,
        example: '1',
    })
    @Expose()
    sessionId: string;

    @ApiProperty({
        required: true,
        example: 'alice,bob',
    })
    @Expose()
    sessionName: string;

    @ApiProperty({
        required: true,
        example: 2,
    })
    @Expose()
    sessionType: number;

    @ApiPropertyOptional({
        nullable: true,
    })
    @Expose()
    avatar: string | null;

    @ApiProperty({
        required: true,
    })
    @Expose()
    creatorId: string;

    @ApiProperty({
        required: true,
        isArray: true,
    })
    @Expose()
    failedMemberIds: string[];
}

export class ConversationInviteGroupResponseDto {
    @ApiProperty({
        required: true,
        isArray: true,
    })
    @Expose()
    successIds: string[];

    @ApiProperty({
        required: true,
        isArray: true,
    })
    @Expose()
    failedIds: string[];
}

export class ConversationKickGroupResponseDto {
    @ApiProperty({
        required: true,
        isArray: true,
    })
    @Expose()
    successIds: string[];
}

export class ConversationExitGroupResponseDto {
    @ApiProperty({
        required: true,
        example: true,
    })
    @Expose()
    success: boolean;
}

export class ConversationGroupMemberResponseDto {
    @ApiProperty({
        required: true,
    })
    @Expose()
    userId: string;

    @ApiProperty({
        required: true,
    })
    @Expose()
    userName: string;

    @ApiPropertyOptional({
        nullable: true,
    })
    @Expose()
    avatar: string | null;
}

export class ConversationGroupMembersResponseDto {
    @ApiProperty({
        required: true,
        type: [ConversationGroupMemberResponseDto],
    })
    @Expose()
    @Type(() => ConversationGroupMemberResponseDto)
    groupMembers: ConversationGroupMemberResponseDto[];

    @ApiProperty({
        required: true,
        example: 2,
    })
    @Expose()
    total: number;
}

export class ConversationSetAdminResponseDto {
    @ApiProperty({
        required: true,
        example: true,
    })
    @Expose()
    success: boolean;

    @ApiProperty({
        required: true,
        example: 'Admin role updated.',
    })
    @Expose()
    message: string;
}
