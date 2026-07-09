import { RealtimeModule } from '@modules/realtime/realtime.module';
import { MessagingKafkaController } from '@modules/messaging/controllers/messaging.kafka.controller';
import { MessagingOutboxProcessor } from '@modules/messaging/processors/messaging.outbox.processor';
import { MessagingRepository } from '@modules/messaging/repositories/messaging.repository';
import { MessagingOutboxService } from '@modules/messaging/services/messaging.outbox.service';
import { MessagingService } from '@modules/messaging/services/messaging.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [RealtimeModule],
    exports: [MessagingService, MessagingOutboxService],
    providers: [
        MessagingRepository,
        MessagingService,
        MessagingOutboxService,
        MessagingOutboxProcessor,
    ],
    controllers: [MessagingKafkaController],
})
export class MessagingModule {}
