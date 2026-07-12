import { AppModuleException } from '@app/exceptions/app.module.exception';
import { IAppBaseExceptionOptions } from '@app/interfaces/app.interface';
import { EnumRedPacketStatusCodeError } from '@modules/red-packet/enums/red-packet.status-code.enum';
import { HttpStatus } from '@nestjs/common';

const RedPacketExceptionHttpStatus = {
    userNotFound: HttpStatus.NOT_FOUND,
    userInactive: HttpStatus.FORBIDDEN,
    forbidden: HttpStatus.FORBIDDEN,
    conversationNotFound: HttpStatus.NOT_FOUND,
    notFound: HttpStatus.NOT_FOUND,
    amountInvalid: HttpStatus.BAD_REQUEST,
    typeInvalid: HttpStatus.BAD_REQUEST,
    insufficientBalance: HttpStatus.CONFLICT,
    claimFailed: HttpStatus.CONFLICT,
} satisfies Record<keyof typeof EnumRedPacketStatusCodeError, HttpStatus>;

export class RedPacketException extends AppModuleException {
    constructor(
        statusCode: EnumRedPacketStatusCodeError,
        options?: IAppBaseExceptionOptions
    ) {
        const statusCodeKey = EnumRedPacketStatusCodeError[
            statusCode
        ] as keyof typeof EnumRedPacketStatusCodeError;

        super({
            module: 'redPacket',
            statusCode,
            statusCodeKey,
            httpStatus: RedPacketExceptionHttpStatus[statusCodeKey],
            messagePath: `redPacket.error.${statusCodeKey}`,
            options,
        });
    }
}
