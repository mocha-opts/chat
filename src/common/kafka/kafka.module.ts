import { KafkaClientToken } from '@common/kafka/constants/kafka.constant';
import { KafkaProducerService } from '@common/kafka/services/kafka.producer.service';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({})
export class KafkaModule {
    static forRoot(): DynamicModule {
        return {
            module: KafkaModule,
            global: true,
            imports: [
                ClientsModule.registerAsync([
                    {
                        name: KafkaClientToken,
                        imports: [ConfigModule],
                        inject: [ConfigService],
                        useFactory: (configService: ConfigService) => ({
                            transport: Transport.KAFKA,
                            options: {
                                client: {
                                    clientId:
                                        configService.getOrThrow<string>(
                                            'kafka.clientId'
                                        ),
                                    brokers:
                                        configService.getOrThrow<string[]>(
                                            'kafka.brokers'
                                        ),
                                },
                                consumer: {
                                    groupId:
                                        configService.getOrThrow<string>(
                                            'kafka.groupId'
                                        ),
                                },
                                producerOnlyMode: true,
                            },
                        }),
                    },
                ]),
            ],
            providers: [KafkaProducerService],
            exports: [KafkaProducerService],
            controllers: [],
        };
    }
}
