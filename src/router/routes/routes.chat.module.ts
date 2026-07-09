import { MessagingLegacyController } from '@modules/messaging/controllers/messaging.legacy.controller';
import { MessagingModule } from '@modules/messaging/messaging.module';
import { RedPacketLegacyController } from '@modules/red-packet/controllers/red-packet.legacy.controller';
import { RedPacketModule } from '@modules/red-packet/red-packet.module';
import { Module } from '@nestjs/common';

@Module({
    controllers: [MessagingLegacyController, RedPacketLegacyController],
    providers: [],
    exports: [],
    imports: [MessagingModule, RedPacketModule],
})
export class RoutesChatModule {}
