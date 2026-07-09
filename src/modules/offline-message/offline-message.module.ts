import { OfflineMessageRepository } from '@modules/offline-message/repositories/offline-message.repository';
import { OfflineMessageService } from '@modules/offline-message/services/offline-message.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [],
    exports: [OfflineMessageService],
    providers: [OfflineMessageRepository, OfflineMessageService],
    controllers: [],
})
export class OfflineMessageModule {}
