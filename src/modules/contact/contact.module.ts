import { ContactRepository } from '@modules/contact/repositories/contact.repository';
import { ContactService } from '@modules/contact/services/contact.service';
import { RealtimeModule } from '@modules/realtime/realtime.module';
import { Module } from '@nestjs/common';

@Module({
    imports: [RealtimeModule],
    exports: [ContactService, ContactRepository],
    providers: [ContactService, ContactRepository],
    controllers: [],
})
export class ContactModule {}
