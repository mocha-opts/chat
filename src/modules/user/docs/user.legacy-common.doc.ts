import {
    Doc,
    DocRequest,
    DocResponse,
} from '@common/doc/decorators/doc.decorator';
import { EnumDocRequestBodyType } from '@common/doc/enums/doc.enum';
import { VerificationSendMailRequestDto } from '@modules/verification/dtos/request/verification.send-mail.request.dto';
import { VerificationStatusResponseDto } from '@modules/verification/dtos/response/verification.status.response.dto';
import { applyDecorators } from '@nestjs/common';

export function UserLegacySendMailDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy send verification mail',
        }),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: VerificationSendMailRequestDto,
        }),
        DocResponse('verification.sendMail', {
            dto: VerificationStatusResponseDto,
        })
    );
}

export function UserLegacyCheckVerificationDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy check verification code',
        }),
        DocRequest({
            queries: [
                {
                    name: 'email',
                    required: true,
                    type: 'string',
                },
                {
                    name: 'code',
                    required: true,
                    type: 'string',
                },
            ],
        }),
        DocResponse('verification.check', {
            dto: VerificationStatusResponseDto,
        })
    );
}
