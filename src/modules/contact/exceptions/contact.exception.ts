import { AppModuleException } from '@app/exceptions/app.module.exception';
import { IAppBaseExceptionOptions } from '@app/interfaces/app.interface';
import { EnumContactStatusCodeError } from '@modules/contact/enums/contact.status-code.enum';
import { HttpStatus } from '@nestjs/common';

const ContactExceptionHttpStatus = {
    userNotFound: HttpStatus.NOT_FOUND,
    userInactive: HttpStatus.FORBIDDEN,
    selfOperationInvalid: HttpStatus.BAD_REQUEST,
    applicationNotFound: HttpStatus.NOT_FOUND,
    applicationStatusInvalid: HttpStatus.BAD_REQUEST,
    alreadyFriend: HttpStatus.CONFLICT,
    friendNotFound: HttpStatus.NOT_FOUND,
    forbidden: HttpStatus.FORBIDDEN,
} satisfies Record<keyof typeof EnumContactStatusCodeError, HttpStatus>;

export class ContactException extends AppModuleException {
    constructor(
        statusCode: EnumContactStatusCodeError,
        options?: IAppBaseExceptionOptions
    ) {
        const statusCodeKey = EnumContactStatusCodeError[
            statusCode
        ] as keyof typeof EnumContactStatusCodeError;

        super({
            module: 'contact',
            statusCode,
            statusCodeKey,
            httpStatus: ContactExceptionHttpStatus[statusCodeKey],
            messagePath: `contact.error.${statusCodeKey}`,
            options,
        });
    }
}
