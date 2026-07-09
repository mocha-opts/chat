import { KafkaTopics } from '@common/kafka/constants/kafka.topic.constant';
import { IKafkaEventEnvelope } from '@common/kafka/interfaces/kafka.interface';
import { IMessagingMessagePersistPayload } from '@modules/messaging/interfaces/messaging.interface';
import { MessagingService } from '@modules/messaging/services/messaging.service';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class MessagingKafkaController {
    constructor(private readonly messagingService: MessagingService) {}

    @EventPattern(KafkaTopics.imMessagePersist)
    async persistMessage(
        @Payload()
        event: IKafkaEventEnvelope<IMessagingMessagePersistPayload>
    ): Promise<void> {
        await this.messagingService.persistFromKafka(event.payload);
    }
}
