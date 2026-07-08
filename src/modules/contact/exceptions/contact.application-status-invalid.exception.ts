import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumContactStatusCodeError } from '@modules/contact/enums/contact.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class ContactApplicationStatusInvalidException extends AppBaseException {
    readonly module = 'contact';
    readonly statusCode = EnumContactStatusCodeError.applicationStatusInvalid;
    readonly statusCodeKey = EnumContactStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.BAD_REQUEST;

    constructor() {
        super('contact.error.applicationStatusInvalid');
    }
}
