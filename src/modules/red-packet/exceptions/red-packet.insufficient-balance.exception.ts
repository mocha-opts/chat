import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumRedPacketStatusCodeError } from '@modules/red-packet/enums/red-packet.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class RedPacketInsufficientBalanceException extends AppBaseException {
    readonly module = 'redPacket';
    readonly statusCode = EnumRedPacketStatusCodeError.insufficientBalance;
    readonly statusCodeKey = EnumRedPacketStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.CONFLICT;

    constructor() {
        super('redPacket.error.insufficientBalance');
    }
}
