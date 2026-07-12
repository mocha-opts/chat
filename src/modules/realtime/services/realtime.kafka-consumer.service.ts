import { KafkaTopics } from '@common/kafka/constants/kafka.topic.constant';
import { IKafkaEventEnvelope } from '@common/kafka/interfaces/kafka.interface';
import { IRealtimePushPayload } from '@modules/realtime/interfaces/realtime.interface';
import { RealtimeService } from '@modules/realtime/services/realtime.service';
import {
    Injectable,
    Logger,
    OnApplicationShutdown,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka } from 'kafkajs';

@Injectable()
export class RealtimeKafkaConsumerService
    implements OnModuleInit, OnApplicationShutdown
{
    private readonly logger = new Logger(RealtimeKafkaConsumerService.name);
    private consumer: Consumer | null = null;

    constructor(
        private readonly configService: ConfigService,
        private readonly realtimeService: RealtimeService
    ) {}

    async onModuleInit(): Promise<void> {
        const nodeId = this.realtimeService.getNodeId();
        const safeNodeId = nodeId.replace(/[^a-zA-Z0-9._-]/g, '-');
        const kafka = new Kafka({
            clientId: `${this.configService.getOrThrow<string>(
                'kafka.clientId'
            )}-${safeNodeId}`,
            brokers: this.configService.getOrThrow<string[]>('kafka.brokers'),
        });
        this.consumer = kafka.consumer({
            groupId: `${this.configService.getOrThrow<string>(
                'kafka.groupId'
            )}-${safeNodeId}-realtime`,
        });

        await this.consumer.connect();
        await this.consumer.subscribe({
            topic: KafkaTopics.imRealtimePush,
            fromBeginning: false,
        });
        await this.consumer.run({
            eachMessage: async ({ message }) => {
                const envelope = this.parseEnvelope(message.value);
                if (!envelope || envelope.eventType !== KafkaTopics.imRealtimePush) {
                    return;
                }

                await this.realtimeService.pushFromKafka(envelope.payload);
            },
        });

        this.logger.log('Realtime Kafka consumer connected');
    }

    async onApplicationShutdown(): Promise<void> {
        if (!this.consumer) {
            return;
        }

        await this.consumer.disconnect();
        this.consumer = null;
    }

    private parseEnvelope(
        value: Buffer | null
    ): IKafkaEventEnvelope<IRealtimePushPayload> | null {
        if (!value) {
            return null;
        }

        try {
            const parsed = JSON.parse(value.toString()) as unknown;
            const data = this.unwrapNestKafkaPacket(parsed);
            if (!this.isRealtimeEnvelope(data)) {
                return null;
            }

            return data;
        } catch (err: unknown) {
            this.logger.warn(
                {
                    err,
                },
                'Realtime Kafka push payload ignored'
            );
            return null;
        }
    }

    private unwrapNestKafkaPacket(value: unknown): unknown {
        if (
            typeof value === 'object' &&
            value !== null &&
            'data' in value
        ) {
            return (value as { data?: unknown }).data;
        }

        return value;
    }

    private isRealtimeEnvelope(
        value: unknown
    ): value is IKafkaEventEnvelope<IRealtimePushPayload> {
        if (typeof value !== 'object' || value === null) {
            return false;
        }

        const envelope = value as IKafkaEventEnvelope<IRealtimePushPayload>;
        return (
            envelope.eventType === KafkaTopics.imRealtimePush &&
            typeof envelope.payload === 'object' &&
            envelope.payload !== null &&
            typeof envelope.payload.userId === 'string' &&
            typeof envelope.payload.targetNodeId === 'string' &&
            typeof envelope.payload.originNodeId === 'string' &&
            typeof envelope.payload.ackId === 'string'
        );
    }
}
