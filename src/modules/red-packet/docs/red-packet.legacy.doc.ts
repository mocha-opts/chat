import {
    Doc,
    DocAuth,
    DocRequest,
    DocResponse,
} from '@common/doc/decorators/doc.decorator';
import { EnumDocRequestBodyType } from '@common/doc/enums/doc.enum';
import { RedPacketReceiveRequestDto } from '@modules/red-packet/dtos/request/red-packet.receive.request.dto';
import { RedPacketSendRequestDto } from '@modules/red-packet/dtos/request/red-packet.send.request.dto';
import { RedPacketDetailResponseDto } from '@modules/red-packet/dtos/response/red-packet.detail.response.dto';
import { RedPacketReceiveResponseDto } from '@modules/red-packet/dtos/response/red-packet.receive.response.dto';
import { RedPacketSendResponseDto } from '@modules/red-packet/dtos/response/red-packet.send.response.dto';
import { applyDecorators } from '@nestjs/common';

function RedPacketLegacyAuthDoc(): MethodDecorator {
    return DocAuth({
        jwtAccessToken: true,
    });
}

export function RedPacketLegacySendDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy send red packet',
        }),
        RedPacketLegacyAuthDoc(),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: RedPacketSendRequestDto,
        }),
        DocResponse('redPacket.send', {
            dto: RedPacketSendResponseDto,
        })
    );
}

export function RedPacketLegacyReceiveDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy receive red packet',
        }),
        RedPacketLegacyAuthDoc(),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: RedPacketReceiveRequestDto,
        }),
        DocResponse('redPacket.receive', {
            dto: RedPacketReceiveResponseDto,
        })
    );
}

export function RedPacketLegacyDetailDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy red packet detail',
        }),
        RedPacketLegacyAuthDoc(),
        DocRequest({
            params: [
                {
                    name: 'redPacketId',
                    required: true,
                    type: 'string',
                },
            ],
            queries: [
                {
                    name: 'userId',
                    required: true,
                    type: 'string',
                },
            ],
        }),
        DocResponse('redPacket.detail', {
            dto: RedPacketDetailResponseDto,
        })
    );
}
