import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumConversationStatusCodeError } from '@modules/conversation/enums/conversation.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class ConversationNotFoundException extends AppBaseException {
    readonly module = 'conversation';
    readonly statusCode = EnumConversationStatusCodeError.conversationNotFound;
    readonly statusCodeKey = EnumConversationStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.NOT_FOUND;

    constructor() {
        super('conversation.error.conversationNotFound');
    }
}
