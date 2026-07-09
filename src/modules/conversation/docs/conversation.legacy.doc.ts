import {
    Doc,
    DocAuth,
    DocRequest,
    DocResponse,
} from '@common/doc/decorators/doc.decorator';
import { EnumDocRequestBodyType } from '@common/doc/enums/doc.enum';
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
import { applyDecorators } from '@nestjs/common';

function ConversationLegacyAuthDoc(): MethodDecorator {
    return DocAuth({
        jwtAccessToken: true,
    });
}

export function ConversationLegacyCreateGroupDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy create group conversation',
        }),
        ConversationLegacyAuthDoc(),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: ConversationCreateGroupRequestDto,
        }),
        DocResponse('conversation.createGroup', {
            dto: ConversationCreateGroupResponseDto,
        })
    );
}

export function ConversationLegacyInviteGroupDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy invite group members',
        }),
        ConversationLegacyAuthDoc(),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: ConversationInviteGroupRequestDto,
        }),
        DocResponse('conversation.inviteGroup', {
            dto: ConversationInviteGroupResponseDto,
        })
    );
}

export function ConversationLegacyKickGroupDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy kick group members',
        }),
        ConversationLegacyAuthDoc(),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: ConversationKickGroupRequestDto,
        }),
        DocResponse('conversation.kickGroup', {
            dto: ConversationKickGroupResponseDto,
        })
    );
}

export function ConversationLegacyExitGroupDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy exit group conversation',
        }),
        ConversationLegacyAuthDoc(),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: ConversationExitGroupRequestDto,
        }),
        DocResponse('conversation.exitGroup', {
            dto: ConversationExitGroupResponseDto,
        })
    );
}

export function ConversationLegacyGroupMembersDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy group members',
        }),
        ConversationLegacyAuthDoc(),
        DocRequest({
            params: [
                {
                    name: 'conversationId',
                    required: true,
                    type: 'string',
                },
            ],
        }),
        DocResponse('conversation.groupMembers', {
            dto: ConversationGroupMembersResponseDto,
        })
    );
}

export function ConversationLegacySetAdminDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy set group admin',
        }),
        ConversationLegacyAuthDoc(),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: ConversationSetAdminRequestDto,
        }),
        DocResponse('conversation.setAdmin', {
            dto: ConversationSetAdminResponseDto,
        })
    );
}
