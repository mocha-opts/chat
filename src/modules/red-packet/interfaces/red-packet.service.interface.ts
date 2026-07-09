import { IResponseReturn } from '@common/response/interfaces/response.interface';
import { RedPacketDetailRequestDto } from '@modules/red-packet/dtos/request/red-packet.detail.request.dto';
import { RedPacketReceiveRequestDto } from '@modules/red-packet/dtos/request/red-packet.receive.request.dto';
import { RedPacketSendRequestDto } from '@modules/red-packet/dtos/request/red-packet.send.request.dto';
import { RedPacketDetailResponseDto } from '@modules/red-packet/dtos/response/red-packet.detail.response.dto';
import { RedPacketReceiveResponseDto } from '@modules/red-packet/dtos/response/red-packet.receive.response.dto';
import { RedPacketSendResponseDto } from '@modules/red-packet/dtos/response/red-packet.send.response.dto';

export interface IRedPacketService {
    sendRedPacket(
        authUserId: string,
        body: RedPacketSendRequestDto
    ): Promise<IResponseReturn<RedPacketSendResponseDto>>;

    receiveRedPacket(
        authUserId: string,
        body: RedPacketReceiveRequestDto
    ): Promise<IResponseReturn<RedPacketReceiveResponseDto>>;

    getRedPacket(
        redPacketId: string,
        query: RedPacketDetailRequestDto
    ): Promise<IResponseReturn<RedPacketDetailResponseDto>>;

    expireRedPackets(): Promise<void>;
}
