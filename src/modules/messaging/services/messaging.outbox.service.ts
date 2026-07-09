import { KafkaTopics } from '@common/kafka/constants/kafka.topic.constant';
import { IKafkaEventEnvelope } from '@common/kafka/interfaces/kafka.interface';
import { KafkaProducerService } from '@common/kafka/services/kafka.producer.service';
import { IMessagingOutbox } from '@modules/messaging/interfaces/messaging.interface';
import { MessagingRepository } from '@modules/messaging/repositories/messaging.repository';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MessagingOutboxService {
    private readonly logger = new Logger(MessagingOutboxService.name);

    constructor(
        private readonly messagingRepository: MessagingRepository,
        private readonly kafkaProducerService: KafkaProducerService
    ) {}

    async publish(outbox: IMessagingOutbox): Promise<void> {
        const pending = await this.messagingRepository.markOutboxPending(outbox);

        try {
            if (!this.isKafkaTopic(pending.topic)) {
                throw new Error(`Unsupported Kafka topic ${pending.topic}`);
            }

            await this.kafkaProducerService.emit(
                pending.topic,
                pending.payload as unknown as IKafkaEventEnvelope
            );
            await this.messagingRepository.markOutboxSent(pending.id);
        } catch (err: unknown) {
            await this.messagingRepository.markOutboxFailed(
                pending.id,
                this.resolveErrorMessage(err)
            );
            this.logger.error(
                {
                    err,
                    outboxId: pending.id.toString(),
                },
                'Kafka outbox publish failed'
            );
        }
    }

    async retryUnsent(): Promise<void> {
        const outboxes = await this.messagingRepository.findRetryableOutboxes();
        for (const outbox of outboxes) {
            await this.publish(outbox);
        }
    }

    private isKafkaTopic(topic: string): topic is (typeof KafkaTopics)[keyof typeof KafkaTopics] {
        return Object.values(KafkaTopics).some(value => value === topic);
    }

    private resolveErrorMessage(err: unknown): string {
        if (err instanceof Error && err.message) {
            return err.message;
        }

        return 'unknown kafka error';
    }
}
