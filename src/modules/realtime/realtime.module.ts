import { RealtimeGateway } from '@modules/realtime/gateways/realtime.gateway';
import { RealtimeRepository } from '@modules/realtime/repositories/realtime.repository';
import { RealtimeKafkaConsumerService } from '@modules/realtime/services/realtime.kafka-consumer.service';
import { RealtimeService } from '@modules/realtime/services/realtime.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [],
    exports: [RealtimeService],
    providers: [
        RealtimeGateway,
        RealtimeKafkaConsumerService,
        RealtimeRepository,
        RealtimeService,
    ],
    controllers: [],
})
export class RealtimeModule {}
