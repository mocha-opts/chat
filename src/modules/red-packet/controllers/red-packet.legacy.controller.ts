import { Response } from '@common/response/decorators/response.decorator';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { RedPacketDetailRequestDto } from '@modules/red-packet/dtos/request/red-packet.detail.request.dto';
import { RedPacketReceiveRequestDto } from '@modules/red-packet/dtos/request/red-packet.receive.request.dto';
import { RedPacketSendRequestDto } from '@modules/red-packet/dtos/request/red-packet.send.request.dto';
import { RedPacketDetailResponseDto } from '@modules/red-packet/dtos/response/red-packet.detail.response.dto';
import { RedPacketReceiveResponseDto } from '@modules/red-packet/dtos/response/red-packet.receive.response.dto';
import { RedPacketSendResponseDto } from '@modules/red-packet/dtos/response/red-packet.send.response.dto';
import { RedPacketService } from '@modules/red-packet/services/red-packet.service';
import { UserProtected } from '@modules/user/decorators/user.decorator';
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('modules.redPacket.legacy')
@Controller({
    version: '1',
    path: '/redPacket',
})
export class RedPacketLegacyController {
    constructor(private readonly redPacketService: RedPacketService) {}

    @Response('redPacket.send')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Post('/send')
    async sendRedPacket(
        @AuthJwtPayload('userId') authUserId: string,
        @Body() body: RedPacketSendRequestDto
    ): Promise<IResponseReturn<RedPacketSendResponseDto>> {
        return this.redPacketService.sendRedPacket(authUserId, body);
    }

    @Response('redPacket.receive')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Post('/receive')
    async receiveRedPacket(
        @AuthJwtPayload('userId') authUserId: string,
        @Body() body: RedPacketReceiveRequestDto
    ): Promise<IResponseReturn<RedPacketReceiveResponseDto>> {
        return this.redPacketService.receiveRedPacket(authUserId, body);
    }

    @Response('redPacket.detail')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Get('/:redPacketId')
    async getRedPacket(
        @Param('redPacketId') redPacketId: string,
        @Query() query: RedPacketDetailRequestDto
    ): Promise<IResponseReturn<RedPacketDetailResponseDto>> {
        return this.redPacketService.getRedPacket(redPacketId, query);
    }
}
