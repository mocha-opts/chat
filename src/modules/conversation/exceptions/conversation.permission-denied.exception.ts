import { AppBaseException } from '@app/exceptions/app.base.exception';
import { EnumConversationStatusCodeError } from '@modules/conversation/enums/conversation.status-code.enum';
import { HttpStatus } from '@nestjs/common';

export class ConversationPermissionDeniedException extends AppBaseException {
    readonly module = 'conversation';
    readonly statusCode = EnumConversationStatusCodeError.permissionDenied;
    readonly statusCodeKey = EnumConversationStatusCodeError[this.statusCode];
    readonly httpStatus = HttpStatus.FORBIDDEN;

    constructor() {
        super('conversation.error.permissionDenied');
    }
}
