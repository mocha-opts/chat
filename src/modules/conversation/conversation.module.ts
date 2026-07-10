import { ConversationRepository } from '@modules/conversation/repositories/conversation.repository';
import { ConversationService } from '@modules/conversation/services/conversation.service';
import { RealtimeModule } from '@modules/realtime/realtime.module';
import { Module } from '@nestjs/common';

@Module({
    imports: [RealtimeModule],
    exports: [ConversationService, ConversationRepository],
    providers: [ConversationService, ConversationRepository],
    controllers: [],
})
export class ConversationModule {}
