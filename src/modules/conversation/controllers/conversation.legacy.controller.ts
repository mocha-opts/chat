import { Response } from '@common/response/decorators/response.decorator';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { ConversationCreateGroupRequestDto } from '@modules/conversation/dtos/request/conversation.create-group.request.dto';
import { ConversationExitGroupRequestDto } from '@modules/conversation/dtos/request/conversation.exit-group.request.dto';
import { ConversationInviteGroupRequestDto } from '@modules/conversation/dtos/request/conversation.invite-group.request.dto';
import { ConversationKickGroupRequestDto } from '@modules/conversation/dtos/request/conversation.kick-group.request.dto';
import { ConversationSetAdminRequestDto } from '@modules/conversation/dtos/request/conversation.set-admin.request.dto';
import {
    ConversationCreateGroupResponseDto,
    ConversationExitGroupResponseDto,
    ConversationGroupMembersResponseDto,
    ConversationInviteGroupResponseDto,
    ConversationKickGroupResponseDto,
    ConversationSetAdminResponseDto,
} from '@modules/conversation/dtos/response/conversation.legacy.response.dto';
import { ConversationService } from '@modules/conversation/services/conversation.service';
import { UserProtected } from '@modules/user/decorators/user.decorator';
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('modules.conversation.legacy')
@Controller({
    version: '1',
    path: '/',
})
export class ConversationLegacyController {
    constructor(private readonly conversationService: ConversationService) {}

    @Response('conversation.createGroup')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Post('/groups')
    async createGroup(
        @AuthJwtPayload('userId') authUserId: string,
        @Body() body: ConversationCreateGroupRequestDto
    ): Promise<IResponseReturn<ConversationCreateGroupResponseDto>> {
        return this.conversationService.createGroup(authUserId, body);
    }

    @Response('conversation.inviteGroup')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Post('/group/invite')
    async inviteGroup(
        @AuthJwtPayload('userId') authUserId: string,
        @Body() body: ConversationInviteGroupRequestDto
    ): Promise<IResponseReturn<ConversationInviteGroupResponseDto>> {
        return this.conversationService.inviteGroup(authUserId, body);
    }

    @Response('conversation.kickGroup')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Post('/group/kick')
    async kickGroupMembers(
        @AuthJwtPayload('userId') authUserId: string,
        @Body() body: ConversationKickGroupRequestDto
    ): Promise<IResponseReturn<ConversationKickGroupResponseDto>> {
        return this.conversationService.kickGroupMembers(authUserId, body);
    }

    @Response('conversation.exitGroup')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Post('/group/exit')
    async exitGroup(
        @AuthJwtPayload('userId') authUserId: string,
        @Body() body: ConversationExitGroupRequestDto
    ): Promise<IResponseReturn<ConversationExitGroupResponseDto>> {
        return this.conversationService.exitGroup(authUserId, body);
    }

    @Response('conversation.groupMembers')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Get('/group/:conversationId/members')
    async getGroupMembers(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('conversationId') conversationId: string
    ): Promise<IResponseReturn<ConversationGroupMembersResponseDto>> {
        return this.conversationService.getGroupMembers(
            authUserId,
            conversationId
        );
    }

    @Response('conversation.setAdmin')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Post('/group/setAdmin')
    async setGroupAdmin(
        @AuthJwtPayload('userId') authUserId: string,
        @Body() body: ConversationSetAdminRequestDto
    ): Promise<IResponseReturn<ConversationSetAdminResponseDto>> {
        return this.conversationService.setGroupAdmin(authUserId, body);
    }
}
