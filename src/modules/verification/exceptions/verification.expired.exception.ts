import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumVerificationStatusCodeError } from '@modules/verification/enums/verification.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class VerificationExpiredException extends AppBaseException {
    readonly module = 'verification';
    readonly statusCode = EnumVerificationStatusCodeError.expired;
    readonly statusCodeKey =
        EnumVerificationStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.BAD_REQUEST;

    constructor() {
        super('verification.error.expired');
    }
}
