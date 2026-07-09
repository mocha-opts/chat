import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class MomentCreateResponseDto {
    @ApiProperty({
        required: true,
        example: '1000000000000000001',
    })
    @Expose()
    userId: string;

    @ApiPropertyOptional({
        nullable: true,
    })
    @Expose()
    text: string | null;

    @ApiProperty({
        required: true,
        type: [String],
    })
    @Expose()
    mediaUrls: string[];

    @ApiProperty({
        required: true,
        example: '1000000000000000002',
    })
    @Expose()
    momentId: string;
}

export class MomentMessageResponseDto {
    @ApiProperty({
        required: true,
    })
    @Expose()
    message: string;
}

export class MomentCreateLikeResponseDto {
    @ApiProperty({
        required: true,
        example: '1000000000000000003',
    })
    @Expose()
    likeId: string;
}

export class MomentCreateCommentResponseDto {
    @ApiPropertyOptional({
        nullable: true,
        example: '1000000000000000004',
    })
    @Expose()
    parentCommentId: string | null;

    @ApiPropertyOptional({
        nullable: true,
        example: 'bob',
    })
    @Expose()
    parentUserName: string | null;

    @ApiProperty({
        required: true,
        example: '1000000000000000005',
    })
    @Expose()
    commentId: string;

    @ApiProperty({
        required: true,
        example: 'alice',
    })
    @Expose()
    userName: string;

    @ApiProperty({
        required: true,
        example: 'great',
    })
    @Expose()
    comment: string;
}

export class MomentLikeResponseDto {
    @ApiProperty({
        required: true,
    })
    @Expose()
    likeId: string;

    @ApiProperty({
        required: true,
    })
    @Expose()
    momentId: string;

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
    userAvatar: string | null;
}

export class MomentCommentResponseDto {
    @ApiProperty({
        required: true,
    })
    @Expose()
    momentId: string;

    @ApiProperty({
        required: true,
    })
    @Expose()
    commentId: string;

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
    parentCommentId: string | null;

    @ApiProperty({
        required: true,
    })
    @Expose()
    comment: string;

    @ApiProperty({
        required: true,
    })
    @Expose()
    createTime: Date;

    @ApiProperty({
        required: true,
    })
    @Expose()
    updateTime: Date;
}

export class MomentTimelineItemResponseDto {
    @ApiProperty({
        required: true,
    })
    @Expose()
    momentId: string;

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

    @ApiPropertyOptional({
        nullable: true,
    })
    @Expose()
    text: string | null;

    @ApiProperty({
        required: true,
        type: [String],
    })
    @Expose()
    mediaUrls: string[];

    @ApiProperty({
        required: true,
        type: [MomentLikeResponseDto],
    })
    @Expose()
    @Type(() => MomentLikeResponseDto)
    likes: MomentLikeResponseDto[];

    @ApiProperty({
        required: true,
        type: [MomentCommentResponseDto],
    })
    @Expose()
    @Type(() => MomentCommentResponseDto)
    comments: MomentCommentResponseDto[];

    @ApiProperty({
        required: true,
    })
    @Expose()
    createTime: Date;

    @ApiProperty({
        required: true,
    })
    @Expose()
    updateTime: Date;

    @ApiPropertyOptional({
        nullable: true,
    })
    @Expose()
    deleteTime: Date | null;
}

export class MomentListResponseDto {
    @ApiProperty({
        required: true,
        type: [String],
    })
    @Expose()
    deleteLike: string[];

    @ApiProperty({
        required: true,
        type: [String],
    })
    @Expose()
    deleteComment: string[];

    @ApiProperty({
        required: true,
        type: [String],
    })
    @Expose()
    deleteMoment: string[];

    @ApiProperty({
        required: true,
        type: [MomentLikeResponseDto],
    })
    @Expose()
    @Type(() => MomentLikeResponseDto)
    createLike: MomentLikeResponseDto[];

    @ApiProperty({
        required: true,
        type: [MomentCommentResponseDto],
    })
    @Expose()
    @Type(() => MomentCommentResponseDto)
    createComment: MomentCommentResponseDto[];

    @ApiProperty({
        required: true,
        type: [MomentTimelineItemResponseDto],
    })
    @Expose()
    @Type(() => MomentTimelineItemResponseDto)
    createMoment: MomentTimelineItemResponseDto[];
}
