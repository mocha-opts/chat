import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumMessagingStatusCodeError } from '@modules/messaging/enums/messaging.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class MessagingTypeInvalidException extends AppBaseException {
    readonly module = 'messaging';
    readonly statusCode = EnumMessagingStatusCodeError.typeInvalid;
    readonly statusCodeKey = EnumMessagingStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.BAD_REQUEST;

    constructor() {
        super('messaging.error.typeInvalid');
    }
}
