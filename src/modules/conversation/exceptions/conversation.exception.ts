import { AppModuleException } from '@app/exceptions/app.module.exception';
import { IAppBaseExceptionOptions } from '@app/interfaces/app.interface';
import { EnumConversationStatusCodeError } from '@modules/conversation/enums/conversation.status-code.enum';
import { HttpStatus } from '@nestjs/common';

const ConversationExceptionHttpStatus = {
    userNotFound: HttpStatus.NOT_FOUND,
    userInactive: HttpStatus.FORBIDDEN,
    conversationNotFound: HttpStatus.NOT_FOUND,
    memberNotFound: HttpStatus.NOT_FOUND,
    permissionDenied: HttpStatus.FORBIDDEN,
    kickedOwnerInvalid: HttpStatus.BAD_REQUEST,
    kickedAdminInvalid: HttpStatus.BAD_REQUEST,
} satisfies Record<keyof typeof EnumConversationStatusCodeError, HttpStatus>;

export class ConversationException extends AppModuleException {
    constructor(
        statusCode: EnumConversationStatusCodeError,
        options?: IAppBaseExceptionOptions
    ) {
        const statusCodeKey = EnumConversationStatusCodeError[
            statusCode
        ] as keyof typeof EnumConversationStatusCodeError;

        super({
            module: 'conversation',
            statusCode,
            statusCodeKey,
            httpStatus: ConversationExceptionHttpStatus[statusCodeKey],
            messagePath: `conversation.error.${statusCodeKey}`,
            options,
        });
    }
}
