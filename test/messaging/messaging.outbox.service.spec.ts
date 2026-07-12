import { KafkaTopics } from '@common/kafka/constants/kafka.topic.constant';
import type {
    IKafkaEventEnvelope,
    IKafkaProducerService,
} from '@common/kafka/interfaces/kafka.interface';
import { KafkaProducerService } from '@common/kafka/services/kafka.producer.service';
import { MessagingOutboxMaxRetryCount } from '@modules/messaging/constants/messaging.constant';
import type {
    IMessagingDeadLetterPayload,
    IMessagingOutbox,
} from '@modules/messaging/interfaces/messaging.interface';
import { MessagingRepository } from '@modules/messaging/repositories/messaging.repository';
import { MessagingOutboxService } from '@modules/messaging/services/messaging.outbox.service';
import { Logger } from '@nestjs/common';

interface IMessagingOutboxTestContext {
    service: MessagingOutboxService;
    repository: jest.Mocked<
        Pick<
            MessagingRepository,
            | 'markOutboxPending'
            | 'markOutboxSent'
            | 'markOutboxFailed'
            | 'claimRetryableOutboxes'
        >
    >;
    kafkaProducerService: jest.Mocked<IKafkaProducerService>;
}

const createOutbox = (retryCount: number): IMessagingOutbox => ({
    id: 100n,
    messageId: 200n,
    topic: KafkaTopics.imMessagePersist,
    messageKey: '300',
    payload: {
        eventId: 'event-1',
    },
    status: 'failed' as IMessagingOutbox['status'],
    retryCount,
});

const createContext = (
    pendingOutbox: IMessagingOutbox
): IMessagingOutboxTestContext => {
    const repository = {
        markOutboxPending: jest.fn().mockResolvedValue(pendingOutbox),
        markOutboxSent: jest.fn().mockResolvedValue(undefined),
        markOutboxFailed: jest.fn().mockResolvedValue(undefined),
        claimRetryableOutboxes: jest.fn().mockResolvedValue([]),
    };
    const kafkaProducerService = {
        emit: jest.fn().mockResolvedValue(undefined),
    };
    const service = new MessagingOutboxService(
        repository as unknown as MessagingRepository,
        kafkaProducerService as unknown as KafkaProducerService
    );

    return {
        service,
        repository,
        kafkaProducerService,
    };
};

describe(MessagingOutboxService.name, () => {
    beforeEach(() => {
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    });

    it('publishes a dead-letter event when the final Kafka outbox attempt fails', async () => {
        const context = createContext(
            createOutbox(MessagingOutboxMaxRetryCount)
        );
        context.kafkaProducerService.emit
            .mockRejectedValueOnce(new Error('broker unavailable'))
            .mockResolvedValueOnce(undefined);

        await context.service.publish(createOutbox(0));

        expect(context.repository.markOutboxFailed).toHaveBeenCalledWith(
            100n,
            'broker unavailable'
        );
        expect(context.kafkaProducerService.emit).toHaveBeenCalledTimes(2);

        const [topic, envelope] = context.kafkaProducerService.emit.mock
            .calls[1] as [
            typeof KafkaTopics.imDeadLetter,
            IKafkaEventEnvelope<IMessagingDeadLetterPayload>,
        ];

        expect(topic).toBe(KafkaTopics.imDeadLetter);
        expect(envelope.eventType).toBe(KafkaTopics.imDeadLetter);
        expect(envelope.payload).toMatchObject({
            outboxId: '100',
            messageId: '200',
            failedTopic: KafkaTopics.imMessagePersist,
            messageKey: '300',
            retryCount: MessagingOutboxMaxRetryCount,
            error: 'broker unavailable',
        });
        expect(envelope.payload).not.toHaveProperty('payload');
    });

    it('does not publish dead-letter events before the retry limit is reached', async () => {
        const context = createContext(
            createOutbox(MessagingOutboxMaxRetryCount - 1)
        );
        context.kafkaProducerService.emit.mockRejectedValueOnce(
            new Error('temporary broker failure')
        );

        await context.service.publish(createOutbox(0));

        expect(context.repository.markOutboxFailed).toHaveBeenCalledWith(
            100n,
            'temporary broker failure'
        );
        expect(context.kafkaProducerService.emit).toHaveBeenCalledTimes(1);
    });

    it('publishes claimed retry outboxes without marking them pending again', async () => {
        const context = createContext(createOutbox(1));
        context.repository.claimRetryableOutboxes.mockResolvedValueOnce([
            createOutbox(1),
        ]);

        await context.service.retryUnsent();

        expect(context.repository.markOutboxPending).not.toHaveBeenCalled();
        expect(context.kafkaProducerService.emit).toHaveBeenCalledTimes(1);
        expect(context.repository.markOutboxSent).toHaveBeenCalledWith(100n);
    });
});
