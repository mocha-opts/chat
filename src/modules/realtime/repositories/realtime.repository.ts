import { CacheMainProvider } from '@common/cache/constants/cache.constant';
import { DatabaseService } from '@common/database/services/database.service';
import { RedisClientCachedProvider } from '@common/redis/constants/redis.constant';
import {
    RealtimeAckScanLimit,
    RealtimePendingAckDueKey,
    RealtimePendingAckKeyPrefix,
    RealtimePendingAckTtlInMs,
    RealtimePendingAckUserKeyPrefix,
    RealtimeRouteKeyPrefix,
    RealtimeRouteTtlInMs,
} from '@modules/realtime/constants/realtime.constant';
import {
    IRealtimePendingAck,
    IRealtimeRouteCache,
} from '@modules/realtime/interfaces/realtime.interface';
import KeyvRedis from '@keyv/redis';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@generated/prisma-client';
import { Cache } from 'cache-manager';
import { Keyv } from 'keyv';

interface IRealtimeRedisCommandClient {
    sendCommand<T = unknown>(args: readonly string[]): Promise<T>;
}

@Injectable()
export class RealtimeRepository {
    constructor(
        private readonly databaseService: DatabaseService,
        @Inject(CacheMainProvider) private readonly cacheManager: Cache,
        @Inject(RedisClientCachedProvider)
        private readonly redisKeyv: Keyv<unknown>
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

    async savePendingAck(pending: IRealtimePendingAck): Promise<void> {
        const client = await this.getRedisClient();
        const ttl = RealtimePendingAckTtlInMs.toString();
        const dueAt = new Date(pending.dueAt).getTime().toString();

        await client.sendCommand([
            'SET',
            this.buildPendingAckKey(pending.ackId),
            JSON.stringify(pending),
            'PX',
            ttl,
        ]);
        await client.sendCommand([
            'ZADD',
            RealtimePendingAckDueKey,
            dueAt,
            pending.ackId,
        ]);
        await client.sendCommand([
            'SADD',
            this.buildPendingAckUserKey(pending.userId),
            pending.ackId,
        ]);
        await client.sendCommand([
            'PEXPIRE',
            this.buildPendingAckUserKey(pending.userId),
            ttl,
        ]);
    }

    async findDuePendingAcks(now: Date): Promise<IRealtimePendingAck[]> {
        const client = await this.getRedisClient();
        const ackIds = await client.sendCommand<unknown[]>([
            'ZRANGEBYSCORE',
            RealtimePendingAckDueKey,
            '-inf',
            now.getTime().toString(),
            'LIMIT',
            '0',
            RealtimeAckScanLimit.toString(),
        ]);
        const pending: IRealtimePendingAck[] = [];

        for (const value of ackIds) {
            const ackId = this.redisValueToString(value);
            const item = await this.getPendingAck(ackId);
            if (item) {
                pending.push(item);
            } else {
                await client.sendCommand([
                    'ZREM',
                    RealtimePendingAckDueKey,
                    ackId,
                ]);
            }
        }

        return pending;
    }

    async deletePendingAck(ackId: string): Promise<void> {
        const client = await this.getRedisClient();
        const pending = await this.getPendingAck(ackId);

        await client.sendCommand(['DEL', this.buildPendingAckKey(ackId)]);
        await client.sendCommand(['ZREM', RealtimePendingAckDueKey, ackId]);
        if (pending) {
            await client.sendCommand([
                'SREM',
                this.buildPendingAckUserKey(pending.userId),
                ackId,
            ]);
        }
    }

    async deletePendingAcksByUser(userId: string): Promise<void> {
        const client = await this.getRedisClient();
        const userKey = this.buildPendingAckUserKey(userId);
        const ackIds = await client.sendCommand<unknown[]>(['SMEMBERS', userKey]);

        for (const value of ackIds) {
            await this.deletePendingAck(this.redisValueToString(value));
        }

        await client.sendCommand(['DEL', userKey]);
    }

    private buildRouteKey(userId: string): string {
        return `${RealtimeRouteKeyPrefix}:${userId}`;
    }

    private async getPendingAck(
        ackId: string
    ): Promise<IRealtimePendingAck | null> {
        const client = await this.getRedisClient();
        const value = await client.sendCommand<unknown>([
            'GET',
            this.buildPendingAckKey(ackId),
        ]);
        if (value === null || value === undefined) {
            return null;
        }

        return JSON.parse(this.redisValueToString(value)) as IRealtimePendingAck;
    }

    private buildPendingAckKey(ackId: string): string {
        return `${RealtimePendingAckKeyPrefix}:${ackId}`;
    }

    private buildPendingAckUserKey(userId: string): string {
        return `${RealtimePendingAckUserKeyPrefix}:${userId}`;
    }

    private async getRedisClient(): Promise<IRealtimeRedisCommandClient> {
        const store = this.redisKeyv.store as KeyvRedis<unknown>;
        const client = await store.getClient();

        return client as unknown as IRealtimeRedisCommandClient;
    }

    private redisValueToString(value: unknown): string {
        if (typeof value === 'string') {
            return value;
        }

        if (typeof value === 'number') {
            return value.toString();
        }

        if (Buffer.isBuffer(value)) {
            return value.toString();
        }

        throw new Error('Redis command returned an unsupported value');
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
