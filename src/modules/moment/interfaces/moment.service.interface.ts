import { IResponseReturn } from '@common/response/interfaces/response.interface';
import { MomentCreateCommentRequestDto } from '@modules/moment/dtos/request/moment.create-comment.request.dto';
import { MomentCreateRequestDto } from '@modules/moment/dtos/request/moment.create.request.dto';
import { MomentDeleteCommentRequestDto } from '@modules/moment/dtos/request/moment.delete-comment.request.dto';
import { MomentDeleteLikeRequestDto } from '@modules/moment/dtos/request/moment.delete-like.request.dto';
import { MomentListRequestDto } from '@modules/moment/dtos/request/moment.list.request.dto';
import { MomentUserRequestDto } from '@modules/moment/dtos/request/moment.user.request.dto';
import {
    MomentCreateCommentResponseDto,
    MomentCreateLikeResponseDto,
    MomentCreateResponseDto,
    MomentListResponseDto,
    MomentMessageResponseDto,
} from '@modules/moment/dtos/response/moment.legacy.response.dto';

export interface IMomentService {
    createMoment(
        authUserId: string,
        body: MomentCreateRequestDto
    ): Promise<IResponseReturn<MomentCreateResponseDto>>;
    deleteMoment(
        authUserId: string,
        momentId: string,
        query: MomentUserRequestDto
    ): Promise<IResponseReturn<MomentMessageResponseDto>>;
    likeMoment(
        authUserId: string,
        momentId: string,
        body: MomentUserRequestDto
    ): Promise<IResponseReturn<MomentCreateLikeResponseDto>>;
    deleteLikeMoment(
        authUserId: string,
        momentId: string,
        query: MomentDeleteLikeRequestDto
    ): Promise<IResponseReturn<MomentMessageResponseDto>>;
    createComment(
        authUserId: string,
        momentId: string,
        body: MomentCreateCommentRequestDto
    ): Promise<IResponseReturn<MomentCreateCommentResponseDto>>;
    deleteComment(
        authUserId: string,
        momentId: string,
        query: MomentDeleteCommentRequestDto
    ): Promise<IResponseReturn<MomentMessageResponseDto>>;
    getMomentList(
        authUserId: string,
        userIdentifier: string,
        query: MomentListRequestDto
    ): Promise<IResponseReturn<MomentListResponseDto>>;
}
