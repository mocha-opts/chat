import { ConversationRepository } from '@modules/conversation/repositories/conversation.repository';
import { ConversationService } from '@modules/conversation/services/conversation.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [],
    exports: [ConversationService, ConversationRepository],
    providers: [ConversationService, ConversationRepository],
    controllers: [],
})
export class ConversationModule {}
