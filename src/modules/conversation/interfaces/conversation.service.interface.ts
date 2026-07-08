import { IResponseReturn } from '@common/response/interfaces/response.interface';
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

export interface IConversationService {
    createGroup(
        authUserId: string,
        body: ConversationCreateGroupRequestDto
    ): Promise<IResponseReturn<ConversationCreateGroupResponseDto>>;

    inviteGroup(
        authUserId: string,
        body: ConversationInviteGroupRequestDto
    ): Promise<IResponseReturn<ConversationInviteGroupResponseDto>>;

    kickGroupMembers(
        authUserId: string,
        body: ConversationKickGroupRequestDto
    ): Promise<IResponseReturn<ConversationKickGroupResponseDto>>;

    exitGroup(
        authUserId: string,
        body: ConversationExitGroupRequestDto
    ): Promise<IResponseReturn<ConversationExitGroupResponseDto>>;

    getGroupMembers(
        authUserId: string,
        conversationId: string
    ): Promise<IResponseReturn<ConversationGroupMembersResponseDto>>;

    setGroupAdmin(
        authUserId: string,
        body: ConversationSetAdminRequestDto
    ): Promise<IResponseReturn<ConversationSetAdminResponseDto>>;
}
