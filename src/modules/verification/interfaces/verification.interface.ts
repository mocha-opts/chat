import {
    EnumVerificationCodeChannel,
    EnumVerificationCodePurpose,
} from '@generated/prisma-client';

export interface IVerificationCodeCache {
    codeHash: string;
    expiredAt: string;
}

export interface IVerificationCodeCreatePayload {
    channel: EnumVerificationCodeChannel;
    codeHash: string;
    expiredAt: Date;
    purpose: EnumVerificationCodePurpose;
    targets: string[];
}

export interface IVerificationCodeFindPayload {
    channel: EnumVerificationCodeChannel;
    purpose: EnumVerificationCodePurpose | null;
    target: string;
}
