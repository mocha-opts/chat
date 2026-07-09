import {
    Doc,
    DocAuth,
    DocRequest,
    DocResponse,
} from '@common/doc/decorators/doc.decorator';
import { EnumDocRequestBodyType } from '@common/doc/enums/doc.enum';
import { MessagingSendMessageRequestDto } from '@modules/messaging/dtos/request/messaging.send-message.request.dto';
import { MessagingSendMessageResponseDto } from '@modules/messaging/dtos/response/messaging.send-message.response.dto';
import { applyDecorators } from '@nestjs/common';

export function MessagingLegacySendMessageDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy send chat message',
        }),
        DocAuth({
            jwtAccessToken: true,
        }),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: MessagingSendMessageRequestDto,
        }),
        DocResponse('messaging.sendMessage', {
            dto: MessagingSendMessageResponseDto,
        })
    );
}
