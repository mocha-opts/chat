import {
    Doc,
    DocAuth,
    DocRequest,
    DocResponse,
} from '@common/doc/decorators/doc.decorator';
import { EnumDocRequestBodyType } from '@common/doc/enums/doc.enum';
import { UserLegacyAvatarRequestDto } from '@modules/user/dtos/request/user.legacy.avatar.request.dto';
import { UserLegacyLoginCodeRequestDto } from '@modules/user/dtos/request/user.legacy.login-code.request.dto';
import { UserLegacyLoginRequestDto } from '@modules/user/dtos/request/user.legacy.login.request.dto';
import { UserLegacyRegisterRequestDto } from '@modules/user/dtos/request/user.legacy.register.request.dto';
import {
    UserLegacyAuthResponseDto,
    UserLegacyRegisterResponseDto,
} from '@modules/user/dtos/response/user.legacy.response.dto';
import { applyDecorators } from '@nestjs/common';

export function UserLegacyRegisterDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy user register',
        }),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: UserLegacyRegisterRequestDto,
        }),
        DocResponse('user.legacy.register', {
            dto: UserLegacyRegisterResponseDto,
        })
    );
}

export function UserLegacyLoginDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy user password login',
        }),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: UserLegacyLoginRequestDto,
        }),
        DocResponse('user.legacy.login', {
            dto: UserLegacyAuthResponseDto,
        })
    );
}

export function UserLegacyLoginCodeDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy user verification-code login',
        }),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: UserLegacyLoginCodeRequestDto,
        }),
        DocResponse('user.legacy.loginCode', {
            dto: UserLegacyAuthResponseDto,
        })
    );
}

export function UserLegacyAvatarDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy user avatar update',
        }),
        DocAuth({
            jwtAccessToken: true,
        }),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: UserLegacyAvatarRequestDto,
        }),
        DocResponse('user.legacy.avatar', {
            dto: UserLegacyAuthResponseDto,
        })
    );
}
