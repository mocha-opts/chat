import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumMomentStatusCodeError } from '@modules/moment/enums/moment.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class MomentContentInvalidException extends AppBaseException {
    readonly module = 'moment';
    readonly statusCode = EnumMomentStatusCodeError.contentInvalid;
    readonly statusCodeKey = EnumMomentStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.BAD_REQUEST;

    constructor() {
        super('moment.error.contentInvalid');
    }
}
