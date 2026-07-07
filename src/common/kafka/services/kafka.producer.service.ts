import { KafkaClientToken } from '@common/kafka/constants/kafka.constant';
import { IKafkaTopic } from '@common/kafka/constants/kafka.topic.constant';
import {
    IKafkaEventEnvelope,
    IKafkaProducerService,
} from '@common/kafka/interfaces/kafka.interface';
import {
    Inject,
    Injectable,
    Logger,
    OnApplicationShutdown,
    OnModuleInit,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class KafkaProducerService
    implements IKafkaProducerService, OnModuleInit, OnApplicationShutdown
{
    private readonly logger = new Logger(KafkaProducerService.name);

    private connected = false;

    constructor(
        @Inject(KafkaClientToken)
        private readonly kafkaClient: ClientKafka
    ) {}

    async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
        this.connected = true;

        this.logger.log('Kafka producer connected');
    }

    async onApplicationShutdown(): Promise<void> {
        if (!this.connected) {
            return;
        }

        await this.kafkaClient.close();
        this.connected = false;
    }

    async emit<TPayload extends Record<string, unknown>>(
        topic: IKafkaTopic,
        envelope: IKafkaEventEnvelope<TPayload>
    ): Promise<void> {
        await lastValueFrom(this.kafkaClient.emit(topic, envelope));
    }
}
