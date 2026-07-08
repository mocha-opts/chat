import {
    EnumVerificationCodeChannel,
    EnumVerificationCodePurpose,
} from '@generated/prisma-client';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import { VerificationStatusResponseDto } from '@modules/verification/dtos/response/verification.status.response.dto';

export interface IVerificationService {
    sendEmailCode(
        email: string,
        targets: string[],
        purpose: EnumVerificationCodePurpose
    ): Promise<IResponseReturn<VerificationStatusResponseDto>>;
    consume(
        target: string,
        code: string,
        purpose: EnumVerificationCodePurpose | null,
        channel: EnumVerificationCodeChannel
    ): Promise<void>;
}
