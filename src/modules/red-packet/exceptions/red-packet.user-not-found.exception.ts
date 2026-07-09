import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumRedPacketStatusCodeError } from '@modules/red-packet/enums/red-packet.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class RedPacketUserNotFoundException extends AppBaseException {
    readonly module = 'redPacket';
    readonly statusCode = EnumRedPacketStatusCodeError.userNotFound;
    readonly statusCodeKey = EnumRedPacketStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.NOT_FOUND;

    constructor() {
        super('redPacket.error.userNotFound');
    }
}
