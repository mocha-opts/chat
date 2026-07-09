import { Response } from '@common/response/decorators/response.decorator';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { UserProtected } from '@modules/user/decorators/user.decorator';
import { UserLegacyAvatarRequestDto } from '@modules/user/dtos/request/user.legacy.avatar.request.dto';
import { UserLegacyLoginCodeRequestDto } from '@modules/user/dtos/request/user.legacy.login-code.request.dto';
import { UserLegacyLoginRequestDto } from '@modules/user/dtos/request/user.legacy.login.request.dto';
import { UserLegacyRegisterRequestDto } from '@modules/user/dtos/request/user.legacy.register.request.dto';
import {
    UserLegacyAuthResponseDto,
    UserLegacyRegisterResponseDto,
} from '@modules/user/dtos/response/user.legacy.response.dto';
import {
    UserLegacyAvatarDoc,
    UserLegacyLoginCodeDoc,
    UserLegacyLoginDoc,
    UserLegacyRegisterDoc,
} from '@modules/user/docs/user.legacy.doc';
import { UserService } from '@modules/user/services/user.service';
import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('modules.user.legacy')
@Controller({
    version: '1',
    path: '/',
})
export class UserLegacyController {
    constructor(private readonly userService: UserService) {}

    @UserLegacyRegisterDoc()
    @Response('user.legacy.register')
    @HttpCode(HttpStatus.OK)
    @Post('/register')
    async register(
        @Body() body: UserLegacyRegisterRequestDto
    ): Promise<IResponseReturn<UserLegacyRegisterResponseDto>> {
        return this.userService.legacyRegister(body);
    }

    @UserLegacyLoginDoc()
    @Response('user.legacy.login')
    @HttpCode(HttpStatus.OK)
    @Post('/login')
    async login(
        @Body() body: UserLegacyLoginRequestDto
    ): Promise<IResponseReturn<UserLegacyAuthResponseDto>> {
        return this.userService.legacyLogin(body);
    }

    @UserLegacyLoginCodeDoc()
    @Response('user.legacy.loginCode')
    @HttpCode(HttpStatus.OK)
    @Post('/loginCode')
    async loginCode(
        @Body() body: UserLegacyLoginCodeRequestDto
    ): Promise<IResponseReturn<UserLegacyAuthResponseDto>> {
        return this.userService.legacyLoginCode(body);
    }

    @UserLegacyAvatarDoc()
    @Response('user.legacy.avatar')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Patch('/avatar')
    async avatar(
        @AuthJwtPayload('userId') userId: string,
        @Body() body: UserLegacyAvatarRequestDto
    ): Promise<IResponseReturn<UserLegacyAuthResponseDto>> {
        return this.userService.legacyUpdateAvatar(userId, body);
    }
}
