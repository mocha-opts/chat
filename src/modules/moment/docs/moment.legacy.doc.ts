import {
    Doc,
    DocAuth,
    DocRequest,
    DocResponse,
} from '@common/doc/decorators/doc.decorator';
import { EnumDocRequestBodyType } from '@common/doc/enums/doc.enum';
import { MomentCreateCommentRequestDto } from '@modules/moment/dtos/request/moment.create-comment.request.dto';
import { MomentCreateRequestDto } from '@modules/moment/dtos/request/moment.create.request.dto';
import { MomentUserRequestDto } from '@modules/moment/dtos/request/moment.user.request.dto';
import {
    MomentCreateCommentResponseDto,
    MomentCreateLikeResponseDto,
    MomentCreateResponseDto,
    MomentListResponseDto,
    MomentMessageResponseDto,
} from '@modules/moment/dtos/response/moment.legacy.response.dto';
import { applyDecorators } from '@nestjs/common';

function MomentLegacyAuthDoc(): MethodDecorator {
    return DocAuth({
        jwtAccessToken: true,
    });
}

export function MomentLegacyCreateDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy create moment',
        }),
        MomentLegacyAuthDoc(),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: MomentCreateRequestDto,
        }),
        DocResponse('moment.createMoment', {
            dto: MomentCreateResponseDto,
        })
    );
}

export function MomentLegacyDeleteDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy delete moment',
        }),
        MomentLegacyAuthDoc(),
        DocRequest({
            params: [
                {
                    name: 'momentId',
                    required: true,
                    type: 'string',
                },
            ],
            queries: [
                {
                    name: 'userId',
                    required: true,
                    type: 'string',
                },
            ],
        }),
        DocResponse('moment.deleteMoment', {
            dto: MomentMessageResponseDto,
        })
    );
}

export function MomentLegacyLikeDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy like moment',
        }),
        MomentLegacyAuthDoc(),
        DocRequest({
            params: [
                {
                    name: 'momentId',
                    required: true,
                    type: 'string',
                },
            ],
            bodyType: EnumDocRequestBodyType.json,
            dto: MomentUserRequestDto,
        }),
        DocResponse('moment.likeMoment', {
            dto: MomentCreateLikeResponseDto,
        })
    );
}

export function MomentLegacyDeleteLikeDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy delete moment like',
        }),
        MomentLegacyAuthDoc(),
        DocRequest({
            params: [
                {
                    name: 'momentId',
                    required: true,
                    type: 'string',
                },
            ],
            queries: [
                {
                    name: 'likeId',
                    required: true,
                    type: 'string',
                },
                {
                    name: 'userId',
                    required: true,
                    type: 'string',
                },
            ],
        }),
        DocResponse('moment.deleteLike', {
            dto: MomentMessageResponseDto,
        })
    );
}

export function MomentLegacyCreateCommentDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy create moment comment',
        }),
        MomentLegacyAuthDoc(),
        DocRequest({
            params: [
                {
                    name: 'momentId',
                    required: true,
                    type: 'string',
                },
            ],
            bodyType: EnumDocRequestBodyType.json,
            dto: MomentCreateCommentRequestDto,
        }),
        DocResponse('moment.createComment', {
            dto: MomentCreateCommentResponseDto,
        })
    );
}

export function MomentLegacyDeleteCommentDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy delete moment comment',
        }),
        MomentLegacyAuthDoc(),
        DocRequest({
            params: [
                {
                    name: 'momentId',
                    required: true,
                    type: 'string',
                },
            ],
            queries: [
                {
                    name: 'commentId',
                    required: true,
                    type: 'string',
                },
                {
                    name: 'userId',
                    required: true,
                    type: 'string',
                },
            ],
        }),
        DocResponse('moment.deleteComment', {
            dto: MomentMessageResponseDto,
        })
    );
}

export function MomentLegacyListDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy moment incremental list',
        }),
        MomentLegacyAuthDoc(),
        DocRequest({
            params: [
                {
                    name: 'userId',
                    required: true,
                    type: 'string',
                },
            ],
            queries: [
                {
                    name: 'time',
                    required: true,
                    type: 'string',
                },
            ],
        }),
        DocResponse('moment.list', {
            dto: MomentListResponseDto,
        })
    );
}
