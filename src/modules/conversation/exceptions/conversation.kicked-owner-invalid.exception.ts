import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumConversationStatusCodeError } from '@modules/conversation/enums/conversation.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class ConversationKickedOwnerInvalidException extends AppBaseException {
    readonly module = 'conversation';
    readonly statusCode = EnumConversationStatusCodeError.kickedOwnerInvalid;
    readonly statusCodeKey = EnumConversationStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.BAD_REQUEST;

    constructor() {
        super('conversation.error.kickedOwnerInvalid');
    }
}
