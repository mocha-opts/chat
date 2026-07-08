import { ContactRepository } from '@modules/contact/repositories/contact.repository';
import { ContactService } from '@modules/contact/services/contact.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [],
    exports: [ContactService, ContactRepository],
    providers: [ContactService, ContactRepository],
    controllers: [],
})
export class ContactModule {}
