import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumRedPacketStatusCodeError } from '@modules/red-packet/enums/red-packet.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class RedPacketClaimFailedException extends AppBaseException {
    readonly module = 'redPacket';
    readonly statusCode = EnumRedPacketStatusCodeError.claimFailed;
    readonly statusCodeKey = EnumRedPacketStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.CONFLICT;

    constructor(rawError?: unknown) {
        super('redPacket.error.claimFailed', { rawError });
    }
}
