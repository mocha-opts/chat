import { CacheMainProvider } from '@common/cache/constants/cache.constant';
import { DatabaseService } from '@common/database/services/database.service';
import {
    RealtimeRouteKeyPrefix,
    RealtimeRouteTtlInMs,
} from '@modules/realtime/constants/realtime.constant';
import { IRealtimeRouteCache } from '@modules/realtime/interfaces/realtime.interface';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@generated/prisma-client';
import { Cache } from 'cache-manager';

@Injectable()
export class RealtimeRepository {
    constructor(
        private readonly databaseService: DatabaseService,
        @Inject(CacheMainProvider) private readonly cacheManager: Cache
    ) {}

    async findUserIdByIdentifier(identifier: string): Promise<string | null> {
        const where = this.createUserIdentifierWhere(identifier);
        if (!where) {
            return null;
        }

        const user = await this.databaseService.user.findFirst({
            where: {
                ...where,
                deletedAt: null,
            },
            select: {
                id: true,
            },
        });

        return user?.id ?? null;
    }

    async setRoute(userId: string, route: IRealtimeRouteCache): Promise<void> {
        await this.cacheManager.set(
            this.buildRouteKey(userId),
            route,
            RealtimeRouteTtlInMs
        );
    }

    async getRoute(userId: string): Promise<IRealtimeRouteCache | null> {
        return (
            (await this.cacheManager.get<IRealtimeRouteCache>(
                this.buildRouteKey(userId)
            )) ?? null
        );
    }

    async refreshRoute(userId: string, lastSeenAt: string): Promise<boolean> {
        const route = await this.getRoute(userId);
        if (!route) {
            return false;
        }

        await this.setRoute(userId, {
            ...route,
            lastSeenAt,
        });

        return true;
    }

    async deleteRoute(userId: string): Promise<void> {
        await this.cacheManager.del(this.buildRouteKey(userId));
    }

    private buildRouteKey(userId: string): string {
        return `${RealtimeRouteKeyPrefix}:${userId}`;
    }

    private createUserIdentifierWhere(
        identifier: string
    ): Prisma.UserWhereInput | null {
        const normalized = identifier.trim();
        if (!normalized) {
            return null;
        }

        const legacyId = this.parseLegacyId(normalized);

        return {
            OR: [
                { id: normalized },
                { mobileNumbers: { some: { number: normalized } } },
                ...(legacyId ? [{ legacyId }] : []),
            ],
        };
    }

    private parseLegacyId(identifier: string): bigint | null {
        if (!/^\d+$/.test(identifier)) {
            return null;
        }

        return BigInt(identifier);
    }
}
