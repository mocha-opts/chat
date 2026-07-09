import {
    Doc,
    DocAuth,
    DocRequest,
    DocResponse,
} from '@common/doc/decorators/doc.decorator';
import { EnumDocRequestBodyType } from '@common/doc/enums/doc.enum';
import { ContactAddFriendRequestDto } from '@modules/contact/dtos/request/contact.add-friend.request.dto';
import { ContactModifyApplicationRequestDto } from '@modules/contact/dtos/request/contact.modify-application.request.dto';
import {
    ContactApplicationResponseDto,
    ContactApplyCountResponseDto,
    ContactApplyListResponseDto,
    ContactMessageResponseDto,
    ContactUserResponseDto,
} from '@modules/contact/dtos/response/contact.legacy.response.dto';
import { applyDecorators } from '@nestjs/common';

export function ContactLegacySearchUserDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy contact user search',
        }),
        DocAuth({
            jwtAccessToken: true,
        }),
        DocRequest({
            params: [
                {
                    name: 'userUuid',
                    required: true,
                    type: 'string',
                },
            ],
            queries: [
                {
                    name: 'phone',
                    required: true,
                    type: 'string',
                },
            ],
        }),
        DocResponse('contact.searchUser', {
            dto: ContactUserResponseDto,
        })
    );
}

export function ContactLegacyAddFriendDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy add friend application',
        }),
        DocAuth({
            jwtAccessToken: true,
        }),
        DocRequest({
            params: [
                {
                    name: 'userUuid',
                    required: true,
                    type: 'string',
                },
                {
                    name: 'receiverUuid',
                    required: true,
                    type: 'string',
                },
            ],
            bodyType: EnumDocRequestBodyType.json,
            dto: ContactAddFriendRequestDto,
        }),
        DocResponse('contact.addFriend')
    );
}

export function ContactLegacyFriendDetailDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy friend detail',
        }),
        DocAuth({
            jwtAccessToken: true,
        }),
        DocRequest({
            params: [
                {
                    name: 'userUuid',
                    required: true,
                    type: 'string',
                },
                {
                    name: 'friendUuid',
                    required: true,
                    type: 'string',
                },
            ],
        }),
        DocResponse('contact.friendDetail', {
            dto: ContactUserResponseDto,
        })
    );
}

export function ContactLegacyApplyCountDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy unread friend application count',
        }),
        DocAuth({
            jwtAccessToken: true,
        }),
        DocRequest({
            params: [
                {
                    name: 'userUuid',
                    required: true,
                    type: 'string',
                },
            ],
        }),
        DocResponse('contact.applyCount', {
            dto: ContactApplyCountResponseDto,
        })
    );
}

export function ContactLegacyApplyListDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy friend application list',
        }),
        DocAuth({
            jwtAccessToken: true,
        }),
        DocRequest({
            params: [
                {
                    name: 'userUuid',
                    required: true,
                    type: 'string',
                },
            ],
            queries: [
                {
                    name: 'pageNum',
                    required: false,
                    type: 'number',
                },
                {
                    name: 'pageSize',
                    required: false,
                    type: 'number',
                },
                {
                    name: 'key',
                    required: false,
                    type: 'string',
                },
            ],
        }),
        DocResponse('contact.applyList', {
            dto: ContactApplyListResponseDto,
        })
    );
}

export function ContactLegacyModifyApplicationDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy friend application status update',
        }),
        DocAuth({
            jwtAccessToken: true,
        }),
        DocRequest({
            params: [
                {
                    name: 'userUuid',
                    required: true,
                    type: 'string',
                },
                {
                    name: 'status',
                    required: true,
                    type: 'string',
                },
            ],
            bodyType: EnumDocRequestBodyType.json,
            dto: ContactModifyApplicationRequestDto,
        }),
        DocResponse('contact.modifyApplication', {
            dto: ContactApplicationResponseDto,
        })
    );
}

export function ContactLegacyDeleteFriendDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy delete friend',
        }),
        DocAuth({
            jwtAccessToken: true,
        }),
        DocRequest({
            params: [
                {
                    name: 'userUuid',
                    required: true,
                    type: 'string',
                },
                {
                    name: 'receiverUuid',
                    required: true,
                    type: 'string',
                },
            ],
        }),
        DocResponse('contact.deleteFriend', {
            dto: ContactMessageResponseDto,
        })
    );
}

export function ContactLegacyBlockFriendDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy block friend',
        }),
        DocAuth({
            jwtAccessToken: true,
        }),
        DocRequest({
            params: [
                {
                    name: 'userUuid',
                    required: true,
                    type: 'string',
                },
                {
                    name: 'receiverUuid',
                    required: true,
                    type: 'string',
                },
            ],
        }),
        DocResponse('contact.blockFriend', {
            dto: ContactMessageResponseDto,
        })
    );
}
