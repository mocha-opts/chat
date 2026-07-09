import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumMomentStatusCodeError } from '@modules/moment/enums/moment.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class MomentUserInactiveException extends AppBaseException {
    readonly module = 'moment';
    readonly statusCode = EnumMomentStatusCodeError.userInactive;
    readonly statusCodeKey = EnumMomentStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.FORBIDDEN;

    constructor() {
        super('moment.error.userInactive');
    }
}
