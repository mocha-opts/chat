import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumContactStatusCodeError } from '@modules/contact/enums/contact.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class ContactForbiddenException extends AppBaseException {
    readonly module = 'contact';
    readonly statusCode = EnumContactStatusCodeError.forbidden;
    readonly statusCodeKey = EnumContactStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.FORBIDDEN;

    constructor() {
        super('contact.error.forbidden');
    }
}
