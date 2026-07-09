import { KafkaTopics } from '@common/kafka/constants/kafka.topic.constant';
import type { IKafkaEventEnvelope } from '@common/kafka/interfaces/kafka.interface';
import { KafkaProducerService } from '@common/kafka/services/kafka.producer.service';
import { MessagingOutboxMaxRetryCount } from '@modules/messaging/constants/messaging.constant';
import type {
    IMessagingDeadLetterPayload,
    IMessagingOutbox,
} from '@modules/messaging/interfaces/messaging.interface';
import { MessagingRepository } from '@modules/messaging/repositories/messaging.repository';
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

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
            const errorMessage = this.resolveErrorMessage(err);

            await this.messagingRepository.markOutboxFailed(
                pending.id,
                errorMessage
            );

            if (this.isRetryLimitReached(pending)) {
                await this.publishDeadLetter(pending, errorMessage);
            }

            this.logger.error(
                {
                    err,
                    outboxId: pending.id.toString(),
                    topic: pending.topic,
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

    private isRetryLimitReached(outbox: IMessagingOutbox): boolean {
        return outbox.retryCount >= MessagingOutboxMaxRetryCount;
    }

    private async publishDeadLetter(
        outbox: IMessagingOutbox,
        errorMessage: string
    ): Promise<void> {
        const failedAt = new Date().toISOString();
        const payload: IMessagingDeadLetterPayload = {
            outboxId: outbox.id.toString(),
            messageId: outbox.messageId.toString(),
            failedTopic: outbox.topic,
            messageKey: outbox.messageKey,
            retryCount: outbox.retryCount,
            error: errorMessage,
            failedAt,
        };
        const envelope: IKafkaEventEnvelope<IMessagingDeadLetterPayload> = {
            eventId: randomUUID(),
            eventType: KafkaTopics.imDeadLetter,
            occurredAt: failedAt,
            aggregateId: outbox.messageId.toString(),
            causationId: outbox.id.toString(),
            correlationId: null,
            payload,
        };

        try {
            await this.kafkaProducerService.emit(KafkaTopics.imDeadLetter, envelope);
        } catch (err: unknown) {
            this.logger.error(
                {
                    err,
                    outboxId: outbox.id.toString(),
                    topic: outbox.topic,
                },
                'Kafka dead-letter publish failed'
            );
        }
    }

    private resolveErrorMessage(err: unknown): string {
        if (err instanceof Error && err.message) {
            return err.message;
        }

        return 'unknown kafka error';
    }
}
