import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumMessagingStatusCodeError } from '@modules/messaging/enums/messaging.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class MessagingUserInactiveException extends AppBaseException {
    readonly module = 'messaging';
    readonly statusCode = EnumMessagingStatusCodeError.userInactive;
    readonly statusCodeKey = EnumMessagingStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.FORBIDDEN;

    constructor() {
        super('messaging.error.userInactive');
    }
}
