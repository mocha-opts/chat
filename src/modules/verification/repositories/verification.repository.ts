import { CacheMainProvider } from '@common/cache/constants/cache.constant';
import { DatabaseService } from '@common/database/services/database.service';
import { HelperService } from '@common/helper/services/helper.service';
import {
    IVerificationCodeCache,
    IVerificationCodeCreatePayload,
    IVerificationCodeFindPayload,
} from '@modules/verification/interfaces/verification.interface';
import { Inject, Injectable } from '@nestjs/common';
import {
    EnumVerificationCodePurpose,
    VerificationCode,
} from '@generated/prisma-client';
import { Cache } from 'cache-manager';

@Injectable()
export class VerificationRepository {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly helperService: HelperService,
        @Inject(CacheMainProvider) private readonly cacheManager: Cache
    ) {}

    buildKey({
        channel,
        purpose,
        target,
    }: IVerificationCodeFindPayload): string {
        return `verification:${purpose ?? 'any'}:${channel}:${target}`;
    }

    async create(
        { channel, codeHash, expiredAt, purpose, targets }: IVerificationCodeCreatePayload,
        ttlInMs: number
    ): Promise<void> {
        const cachePayload: IVerificationCodeCache = {
            codeHash,
            expiredAt: expiredAt.toISOString(),
        };

        await this.databaseService.verificationCode.createMany({
            data: targets.map(target => ({
                target,
                channel,
                codeHash,
                purpose,
                expiredAt,
            })),
        });

        await Promise.all(
            targets.map(target =>
                this.cacheManager.set(
                    this.buildKey({ channel, purpose, target }),
                    cachePayload,
                    ttlInMs
                )
            )
        );
    }

    async findCache(
        payload: IVerificationCodeFindPayload
    ): Promise<IVerificationCodeCache | null> {
        return (
            (await this.cacheManager.get<IVerificationCodeCache>(
                this.buildKey(payload)
            )) ?? null
        );
    }

    async findLatest(
        { channel, purpose, target }: IVerificationCodeFindPayload
    ): Promise<VerificationCode | null> {
        return this.databaseService.verificationCode.findFirst({
            where: {
                target,
                channel,
                ...(purpose ? { purpose } : {}),
                usedAt: null,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async markUsed(id: bigint): Promise<void> {
        await this.databaseService.verificationCode.update({
            where: { id },
            data: {
                usedAt: this.helperService.dateCreate(),
            },
        });
    }

    async deleteCache(payload: IVerificationCodeFindPayload): Promise<void> {
        if (payload.purpose) {
            await this.cacheManager.del(this.buildKey(payload));
            return;
        }

        await Promise.all([
            this.cacheManager.del(
                this.buildKey({
                    ...payload,
                    purpose: EnumVerificationCodePurpose.register,
                })
            ),
            this.cacheManager.del(
                this.buildKey({
                    ...payload,
                    purpose: EnumVerificationCodePurpose.login,
                })
            ),
            this.cacheManager.del(
                this.buildKey({
                    ...payload,
                    purpose: EnumVerificationCodePurpose.resetPassword,
                })
            ),
        ]);
    }
}
