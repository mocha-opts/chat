import { MessagingLegacyController } from '@modules/messaging/controllers/messaging.legacy.controller';
import { MessagingModule } from '@modules/messaging/messaging.module';
import { Module } from '@nestjs/common';

@Module({
    controllers: [MessagingLegacyController],
    providers: [],
    exports: [],
    imports: [MessagingModule],
})
export class RoutesChatModule {}
