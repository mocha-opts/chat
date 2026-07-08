import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumContactStatusCodeError } from '@modules/contact/enums/contact.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class ContactUserNotFoundException extends AppBaseException {
    readonly module = 'contact';
    readonly statusCode = EnumContactStatusCodeError.userNotFound;
    readonly statusCodeKey = EnumContactStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.NOT_FOUND;

    constructor() {
        super('contact.error.userNotFound');
    }
}
