import { ContactLegacyController } from '@modules/contact/controllers/contact.legacy.controller';
import { ContactModule } from '@modules/contact/contact.module';
import { ConversationLegacyController } from '@modules/conversation/controllers/conversation.legacy.controller';
import { ConversationModule } from '@modules/conversation/conversation.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';

@Module({
    controllers: [ContactLegacyController, ConversationLegacyController],
    providers: [],
    exports: [],
    imports: [ContactModule, ConversationModule, UserModule],
})
export class RoutesContactModule {}
