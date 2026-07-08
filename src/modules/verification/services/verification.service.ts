import { AppUnknownException } from '@app/exceptions/app.unknown.exception';
import { HelperService } from '@common/helper/services/helper.service';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import {
    EnumVerificationCodeChannel,
    EnumVerificationCodePurpose,
} from '@generated/prisma-client';
import { EnumNotificationProcess } from '@modules/notification/enums/notification.enum';
import {
    INotificationEmailWorkerPayload,
    INotificationVerificationCodePayload,
} from '@modules/notification/interfaces/notification.interface';
import { VerificationExpiredException } from '@modules/verification/exceptions/verification.expired.exception';
import { VerificationInvalidException } from '@modules/verification/exceptions/verification.invalid.exception';
import { VerificationStatusResponseDto } from '@modules/verification/dtos/response/verification.status.response.dto';
import { IVerificationService } from '@modules/verification/interfaces/verification.service.interface';
import { VerificationRepository } from '@modules/verification/repositories/verification.repository';
import { Duration } from 'luxon';
import { Queue } from 'bullmq';
import { EnumQueue, EnumQueuePriority } from '@queues/enums/queue.enum';

@Injectable()
export class VerificationService implements IVerificationService {
    private readonly expiredInMinutes: number;
    private readonly otpLength: number;

    constructor(
        private readonly verificationRepository: VerificationRepository,
        private readonly helperService: HelperService,
        private readonly configService: ConfigService,
        @InjectQueue(EnumQueue.notificationEmail)
        private readonly emailQueue: Queue
    ) {
        this.expiredInMinutes = this.configService.get<number>(
            'verification.expiredInMinutes'
        )!;
        this.otpLength = this.configService.get<number>(
            'verification.otpLength'
        )!;
    }

    async sendEmailCode(
        email: string,
        targets: string[],
        purpose: EnumVerificationCodePurpose
    ): Promise<IResponseReturn<VerificationStatusResponseDto>> {
        try {
            const code = this.helperService.randomDigits(this.otpLength);
            const codeHash = this.helperService.sha256Hash(code);
            const expiredAt = this.helperService.dateForward(
                this.helperService.dateCreate(),
                Duration.fromObject({ minutes: this.expiredInMinutes })
            );

            await this.verificationRepository.create(
                {
                    channel: EnumVerificationCodeChannel.email,
                    codeHash,
                    expiredAt,
                    purpose,
                    targets,
                },
                this.expiredInMinutes * 60 * 1000
            );

            const payload: INotificationEmailWorkerPayload<INotificationVerificationCodePayload> =
                {
                    send: {
                        email,
                        username: email,
                        userId: this.helperService.sha256Hash(
                            `${purpose}:${targets[0]}`
                        ),
                        notificationId: this.helperService.randomString(32),
                    },
                    data: {
                        code,
                        expiredInMinutes: this.expiredInMinutes,
                        purpose,
                        target: targets[0],
                    },
                };

            await this.emailQueue.add(
                EnumNotificationProcess.verificationCode,
                payload,
                {
                    deduplication: {
                        id: `${EnumNotificationProcess.verificationCode}-${purpose}-${targets[0]}`,
                        ttl: this.expiredInMinutes * 60 * 1000,
                    },
                    priority: EnumQueuePriority.high,
                },
            );

            return { data: { status: 'ok' } };
        } catch (err: unknown) {
            throw new AppUnknownException(err);
        }
    }

    async consume(
        target: string,
        code: string,
        purpose: EnumVerificationCodePurpose | null,
        channel: EnumVerificationCodeChannel
    ): Promise<void> {
        const payload = { target, codeHash: this.helperService.sha256Hash(code), purpose, channel };
        const cached = await this.verificationRepository.findCache(payload);
        const latest = await this.verificationRepository.findLatest(payload);
        if (!latest) {
            throw new VerificationInvalidException();
        }

        const expiredAt = cached
            ? this.helperService.dateCreateFromIso(cached.expiredAt)
            : latest.expiredAt;
        if (this.helperService.dateCreate() > expiredAt) {
            throw new VerificationExpiredException();
        }

        const codeHash = cached?.codeHash ?? latest.codeHash;
        if (!this.helperService.sha256Compare(payload.codeHash, codeHash)) {
            throw new VerificationInvalidException();
        }

        await Promise.all([
            this.verificationRepository.markUsed(latest.id),
            this.verificationRepository.deleteCache(payload),
        ]);
    }
}
