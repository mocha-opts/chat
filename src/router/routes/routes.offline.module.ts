import { OfflineMessageLegacyController } from '@modules/offline-message/controllers/offline-message.legacy.controller';
import { OfflineMessageModule } from '@modules/offline-message/offline-message.module';
import { Module } from '@nestjs/common';

@Module({
    controllers: [OfflineMessageLegacyController],
    providers: [],
    exports: [],
    imports: [OfflineMessageModule],
})
export class RoutesOfflineModule {}
