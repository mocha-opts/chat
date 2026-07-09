import { MessagingModule } from '@modules/messaging/messaging.module';
import { RedPacketExpireProcessor } from '@modules/red-packet/processors/red-packet.expire.processor';
import { RedPacketRepository } from '@modules/red-packet/repositories/red-packet.repository';
import { RedPacketService } from '@modules/red-packet/services/red-packet.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [MessagingModule],
    exports: [RedPacketService],
    providers: [RedPacketRepository, RedPacketService, RedPacketExpireProcessor],
    controllers: [],
})
export class RedPacketModule {}
