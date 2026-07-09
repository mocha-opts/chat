import { Response } from '@common/response/decorators/response.decorator';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { MessagingSendMessageRequestDto } from '@modules/messaging/dtos/request/messaging.send-message.request.dto';
import { MessagingSendMessageResponseDto } from '@modules/messaging/dtos/response/messaging.send-message.response.dto';
import { MessagingService } from '@modules/messaging/services/messaging.service';
import { UserProtected } from '@modules/user/decorators/user.decorator';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('modules.messaging.legacy')
@Controller({
    version: '1',
    path: '/',
})
export class MessagingLegacyController {
    constructor(private readonly messagingService: MessagingService) {}

    @Response('messaging.sendMessage')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Post('/session')
    async sendMessage(
        @AuthJwtPayload('userId') authUserId: string,
        @Body() body: MessagingSendMessageRequestDto
    ): Promise<IResponseReturn<MessagingSendMessageResponseDto>> {
        return this.messagingService.sendMessage(authUserId, body);
    }
}
