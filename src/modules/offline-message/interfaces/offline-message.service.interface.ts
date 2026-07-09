import { IResponseReturn } from '@common/response/interfaces/response.interface';
import { OfflineMessageListRequestDto } from '@modules/offline-message/dtos/request/offline-message.list.request.dto';
import { OfflineMessageListResponseDto } from '@modules/offline-message/dtos/response/offline-message.list.response.dto';

export interface IOfflineMessageService {
    list(
        authUserId: string,
        query: OfflineMessageListRequestDto
    ): Promise<IResponseReturn<OfflineMessageListResponseDto>>;
}
