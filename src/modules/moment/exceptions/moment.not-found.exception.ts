import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumMomentStatusCodeError } from '@modules/moment/enums/moment.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class MomentNotFoundException extends AppBaseException {
    readonly module = 'moment';
    readonly statusCode = EnumMomentStatusCodeError.notFound;
    readonly statusCodeKey = EnumMomentStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.NOT_FOUND;

    constructor() {
        super('moment.error.notFound');
    }
}
