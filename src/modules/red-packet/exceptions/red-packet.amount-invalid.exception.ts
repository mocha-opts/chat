import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumRedPacketStatusCodeError } from '@modules/red-packet/enums/red-packet.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class RedPacketAmountInvalidException extends AppBaseException {
    readonly module = 'redPacket';
    readonly statusCode = EnumRedPacketStatusCodeError.amountInvalid;
    readonly statusCodeKey = EnumRedPacketStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.BAD_REQUEST;

    constructor() {
        super('redPacket.error.amountInvalid');
    }
}
