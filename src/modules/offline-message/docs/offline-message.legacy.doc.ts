import {
    Doc,
    DocAuth,
    DocRequest,
    DocResponse,
} from '@common/doc/decorators/doc.decorator';
import { OfflineMessageListResponseDto } from '@modules/offline-message/dtos/response/offline-message.list.response.dto';
import { applyDecorators } from '@nestjs/common';

export function OfflineMessageLegacyListDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy offline message list',
        }),
        DocAuth({
            jwtAccessToken: true,
        }),
        DocRequest({
            queries: [
                {
                    name: 'userId',
                    required: true,
                    type: 'string',
                },
                {
                    name: 'time',
                    required: true,
                    type: 'string',
                },
                {
                    name: 'limit',
                    required: false,
                    type: 'number',
                },
                {
                    name: 'cursor',
                    required: false,
                    type: 'string',
                },
            ],
        }),
        DocResponse('offlineMessage.list', {
            dto: OfflineMessageListResponseDto,
        })
    );
}
