import { AppModuleException } from '@app/exceptions/app.module.exception';
import { IAppBaseExceptionOptions } from '@app/interfaces/app.interface';
import { EnumMessagingStatusCodeError } from '@modules/messaging/enums/messaging.status-code.enum';
import { HttpStatus } from '@nestjs/common';

const MessagingExceptionHttpStatus = {
    userNotFound: HttpStatus.NOT_FOUND,
    userInactive: HttpStatus.FORBIDDEN,
    forbidden: HttpStatus.FORBIDDEN,
    conversationNotFound: HttpStatus.NOT_FOUND,
    memberNotFound: HttpStatus.FORBIDDEN,
    friendNotFound: HttpStatus.FORBIDDEN,
    receiverInvalid: HttpStatus.BAD_REQUEST,
    typeInvalid: HttpStatus.BAD_REQUEST,
} satisfies Record<keyof typeof EnumMessagingStatusCodeError, HttpStatus>;

export class MessagingException extends AppModuleException {
    constructor(
        statusCode: EnumMessagingStatusCodeError,
        options?: IAppBaseExceptionOptions
    ) {
        const statusCodeKey = EnumMessagingStatusCodeError[
            statusCode
        ] as keyof typeof EnumMessagingStatusCodeError;

        super({
            module: 'messaging',
            statusCode,
            statusCodeKey,
            httpStatus: MessagingExceptionHttpStatus[statusCodeKey],
            messagePath: `messaging.error.${statusCodeKey}`,
            options,
        });
    }
}
