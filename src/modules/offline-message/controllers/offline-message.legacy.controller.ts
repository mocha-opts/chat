import { Response } from '@common/response/decorators/response.decorator';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { OfflineMessageListRequestDto } from '@modules/offline-message/dtos/request/offline-message.list.request.dto';
import { OfflineMessageListResponseDto } from '@modules/offline-message/dtos/response/offline-message.list.response.dto';
import { OfflineMessageLegacyListDoc } from '@modules/offline-message/docs/offline-message.legacy.doc';
import { OfflineMessageService } from '@modules/offline-message/services/offline-message.service';
import { UserProtected } from '@modules/user/decorators/user.decorator';
import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('modules.offline-message.legacy')
@Controller({
    version: '1',
    path: '/',
})
export class OfflineMessageLegacyController {
    constructor(private readonly offlineMessageService: OfflineMessageService) {}

    @OfflineMessageLegacyListDoc()
    @Response('offlineMessage.list')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Get('/message')
    async list(
        @AuthJwtPayload('userId') authUserId: string,
        @Query() query: OfflineMessageListRequestDto
    ): Promise<IResponseReturn<OfflineMessageListResponseDto>> {
        return this.offlineMessageService.list(authUserId, query);
    }
}
