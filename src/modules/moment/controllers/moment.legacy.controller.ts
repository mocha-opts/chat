import { Response } from '@common/response/decorators/response.decorator';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
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
import { MomentService } from '@modules/moment/services/moment.service';
import { UserProtected } from '@modules/user/decorators/user.decorator';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('modules.moment.legacy')
@Controller({
    version: '1',
    path: '/',
})
export class MomentLegacyController {
    constructor(private readonly momentService: MomentService) {}

    @Response('moment.createMoment')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Post('/')
    async createMoment(
        @AuthJwtPayload('userId') authUserId: string,
        @Body() body: MomentCreateRequestDto
    ): Promise<IResponseReturn<MomentCreateResponseDto>> {
        return this.momentService.createMoment(authUserId, body);
    }

    @Response('moment.deleteMoment')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Delete('/:momentId')
    async deleteMoment(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('momentId') momentId: string,
        @Query() query: MomentUserRequestDto
    ): Promise<IResponseReturn<MomentMessageResponseDto>> {
        return this.momentService.deleteMoment(authUserId, momentId, query);
    }

    @Response('moment.likeMoment')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Post('/like/:momentId')
    async likeMoment(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('momentId') momentId: string,
        @Body() body: MomentUserRequestDto
    ): Promise<IResponseReturn<MomentCreateLikeResponseDto>> {
        return this.momentService.likeMoment(authUserId, momentId, body);
    }

    @Response('moment.deleteLike')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Delete('/like/:momentId')
    async deleteLikeMoment(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('momentId') momentId: string,
        @Query() query: MomentDeleteLikeRequestDto
    ): Promise<IResponseReturn<MomentMessageResponseDto>> {
        return this.momentService.deleteLikeMoment(
            authUserId,
            momentId,
            query
        );
    }

    @Response('moment.createComment')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Post('/comment/:momentId')
    async createComment(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('momentId') momentId: string,
        @Body() body: MomentCreateCommentRequestDto
    ): Promise<IResponseReturn<MomentCreateCommentResponseDto>> {
        return this.momentService.createComment(authUserId, momentId, body);
    }

    @Response('moment.deleteComment')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Delete('/comment/:momentId')
    async deleteComment(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('momentId') momentId: string,
        @Query() query: MomentDeleteCommentRequestDto
    ): Promise<IResponseReturn<MomentMessageResponseDto>> {
        return this.momentService.deleteComment(authUserId, momentId, query);
    }

    @Response('moment.list')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Get('/list/:userId')
    async getMomentList(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('userId') userId: string,
        @Query() query: MomentListRequestDto
    ): Promise<IResponseReturn<MomentListResponseDto>> {
        return this.momentService.getMomentList(authUserId, userId, query);
    }
}
