import { IResponseReturn } from '@common/response/interfaces/response.interface';
import { MessagingSendMessageRequestDto } from '@modules/messaging/dtos/request/messaging.send-message.request.dto';
import { MessagingSendMessageResponseDto } from '@modules/messaging/dtos/response/messaging.send-message.response.dto';
import { IMessagingMessagePersistPayload } from '@modules/messaging/interfaces/messaging.interface';

export interface IMessagingService {
    sendMessage(
        authUserId: string,
        body: MessagingSendMessageRequestDto
    ): Promise<IResponseReturn<MessagingSendMessageResponseDto>>;
    persistFromKafka(payload: IMessagingMessagePersistPayload): Promise<void>;
}
