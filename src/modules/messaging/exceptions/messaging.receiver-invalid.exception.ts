import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumMessagingStatusCodeError } from '@modules/messaging/enums/messaging.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class MessagingReceiverInvalidException extends AppBaseException {
    readonly module = 'messaging';
    readonly statusCode = EnumMessagingStatusCodeError.receiverInvalid;
    readonly statusCodeKey = EnumMessagingStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.BAD_REQUEST;

    constructor() {
        super('messaging.error.receiverInvalid');
    }
}
