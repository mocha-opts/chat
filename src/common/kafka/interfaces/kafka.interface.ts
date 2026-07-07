import { IKafkaTopic } from '@common/kafka/constants/kafka.topic.constant';

export interface IKafkaEventEnvelope<
    TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
    eventId: string;
    eventType: IKafkaTopic;
    occurredAt: string;
    aggregateId: string | null;
    causationId: string | null;
    correlationId: string | null;
    payload: TPayload;
}

export interface IKafkaProducerService {
    emit<TPayload extends Record<string, unknown>>(
        topic: IKafkaTopic,
        envelope: IKafkaEventEnvelope<TPayload>
    ): Promise<void>;
}
