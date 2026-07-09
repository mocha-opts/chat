import { RedisClientCachedProvider } from '@common/redis/constants/redis.constant';
import { DatabaseService } from '@common/database/services/database.service';
import {
    EnumBalanceLogType,
    EnumConversationStatus,
    EnumRedPacketStatus,
    Prisma,
} from '@generated/prisma-client';
import {
    RedPacketAmountKeyPrefix,
    RedPacketClaimLuaScript,
    RedPacketCompensateLuaScript,
    RedPacketExpireInMs,
    RedPacketExpireMarkerKeyPrefix,
    RedPacketUserKeyPrefix,
} from '@modules/red-packet/constants/red-packet.constant';
import {
    IRedPacketClaimResult,
    IRedPacketConversation,
    IRedPacketCreatePayload,
    IRedPacketDetail,
    IRedPacketReceivePersistResult,
    IRedPacketReceiveRecord,
    IRedPacketRecord,
    IRedPacketUser,
} from '@modules/red-packet/interfaces/red-packet.interface';
import KeyvRedis from '@keyv/redis';
import { Inject, Injectable } from '@nestjs/common';
import { Keyv } from 'keyv';
import { validate as uuidValidate } from 'uuid';

interface IRedPacketRedisCommandClient {
    sendCommand<T = unknown>(args: readonly string[]): Promise<T>;
}

@Injectable()
export class RedPacketRepository {
    constructor(
        private readonly databaseService: DatabaseService,
        @Inject(RedisClientCachedProvider)
        private readonly redisKeyv: Keyv<unknown>
    ) {}

    async findUserByIdentifier(
        identifier: string
    ): Promise<IRedPacketUser | null> {
        const where = this.createUserIdentifierWhere(identifier);
        if (!where) {
            return null;
        }

        return this.databaseService.user.findFirst({
            where: {
                ...where,
                deletedAt: null,
            },
            select: this.userSelect(),
        });
    }

    async findConversation(
        conversationId: bigint
    ): Promise<IRedPacketConversation | null> {
        return this.databaseService.conversation.findFirst({
            where: {
                id: conversationId,
                status: EnumConversationStatus.normal,
            },
            select: {
                id: true,
                status: true,
            },
        });
    }

    async findRedPacket(redPacketId: bigint): Promise<IRedPacketRecord | null> {
        return this.databaseService.redPacket.findUnique({
            where: {
                id: redPacketId,
            },
            select: this.redPacketSelect(),
        });
    }

    async findReceive(
        redPacketId: bigint,
        receiverId: string
    ): Promise<IRedPacketReceiveRecord | null> {
        return this.databaseService.redPacketReceive.findUnique({
            where: {
                redPacketId_receiverId: {
                    redPacketId,
                    receiverId,
                },
            },
            select: {
                amount: true,
            },
        });
    }

    async createRedPacketWithBalance(
        payload: IRedPacketCreatePayload
    ): Promise<IRedPacketRecord | null> {
        return this.databaseService.$transaction(async tx => {
            const deducted = await tx.userBalance.updateMany({
                where: {
                    userId: payload.senderId,
                    balance: {
                        gte: payload.totalAmount,
                    },
                },
                data: {
                    balance: {
                        decrement: payload.totalAmount,
                    },
                },
            });
            if (deducted.count !== 1) {
                return null;
            }

            const redPacket = await tx.redPacket.create({
                data: {
                    id: payload.id,
                    senderId: payload.senderId,
                    conversationId: payload.conversationId,
                    wrapperText: payload.wrapperText,
                    type: payload.type,
                    totalAmount: payload.totalAmount,
                    totalCount: payload.totalCount,
                    remainingAmount: payload.totalAmount,
                    remainingCount: payload.totalCount,
                    status: EnumRedPacketStatus.unclaimed,
                    expireAt: payload.expireAt,
                },
                select: this.redPacketSelect(),
            });

            await tx.balanceLog.create({
                data: {
                    userId: payload.senderId,
                    amount: new Prisma.Decimal(0).minus(payload.totalAmount),
                    type: EnumBalanceLogType.sendRedPacket,
                    relatedId: payload.id,
                },
            });

            return redPacket;
        });
    }

    async initializeRedis(
        redPacketId: bigint,
        amounts: string[],
        totalCount: number
    ): Promise<void> {
        const client = await this.getRedisClient();
        const keys = this.redisKeys(redPacketId);
        const ttl = RedPacketExpireInMs.toString();

        await client.sendCommand(['DEL', keys.amount, keys.user, keys.marker]);
        await client.sendCommand(['RPUSH', keys.amount, ...amounts]);
        await Promise.all([
            client.sendCommand(['SET', keys.marker, totalCount.toString(), 'PX', ttl]),
            client.sendCommand(['PEXPIRE', keys.amount, ttl]),
        ]);
    }

    async clearRedis(redPacketId: bigint): Promise<void> {
        const client = await this.getRedisClient();
        const keys = this.redisKeys(redPacketId);

        await client.sendCommand(['DEL', keys.amount, keys.user, keys.marker]);
    }

    async claimAmount(
        redPacketId: bigint,
        receiverId: string
    ): Promise<IRedPacketClaimResult> {
        const client = await this.getRedisClient();
        const keys = this.redisKeys(redPacketId);
        const result = await client.sendCommand([
            'EVAL',
            RedPacketClaimLuaScript,
            '2',
            keys.amount,
            keys.user,
            receiverId,
            RedPacketExpireInMs.toString(),
        ]);
        const value = this.redisValueToString(result);

        if (value === '-1') {
            return {
                code: 'received',
                amount: null,
            };
        }

        if (value === '0') {
            return {
                code: 'empty',
                amount: null,
            };
        }

        return {
            code: 'success',
            amount: new Prisma.Decimal(value),
        };
    }

    async compensateClaim(
        redPacketId: bigint,
        receiverId: string,
        amount: Prisma.Decimal
    ): Promise<void> {
        const client = await this.getRedisClient();
        const keys = this.redisKeys(redPacketId);

        await client.sendCommand([
            'EVAL',
            RedPacketCompensateLuaScript,
            '2',
            keys.amount,
            keys.user,
            receiverId,
            amount.toFixed(2),
            RedPacketExpireInMs.toString(),
        ]);
    }

    async persistReceive(
        redPacketId: bigint,
        receiverId: string,
        amount: Prisma.Decimal
    ): Promise<IRedPacketReceivePersistResult> {
        return this.databaseService.$transaction(async tx => {
            const redPacket = await tx.redPacket.findUnique({
                where: {
                    id: redPacketId,
                },
                select: this.redPacketSelect(),
            });
            if (!redPacket || redPacket.status !== EnumRedPacketStatus.unclaimed) {
                return {
                    ok: false,
                    claimed: false,
                };
            }

            const now = new Date();
            if (
                redPacket.expireAt <= now ||
                redPacket.remainingCount <= 0 ||
                redPacket.remainingAmount.comparedTo(amount) < 0
            ) {
                return {
                    ok: false,
                    claimed: false,
                };
            }

            const nextRemainingCount = redPacket.remainingCount - 1;
            const updated = await tx.redPacket.updateMany({
                where: {
                    id: redPacketId,
                    status: EnumRedPacketStatus.unclaimed,
                    remainingCount: redPacket.remainingCount,
                    remainingAmount: {
                        gte: amount,
                    },
                },
                data: {
                    remainingAmount: {
                        decrement: amount,
                    },
                    remainingCount: {
                        decrement: 1,
                    },
                    ...(nextRemainingCount === 0
                        ? {
                              status: EnumRedPacketStatus.claimed,
                          }
                        : {}),
                },
            });
            if (updated.count !== 1) {
                return {
                    ok: false,
                    claimed: false,
                };
            }

            await tx.redPacketReceive.create({
                data: {
                    redPacketId,
                    receiverId,
                    amount,
                },
            });
            await tx.userBalance.upsert({
                where: {
                    userId: receiverId,
                },
                create: {
                    userId: receiverId,
                    balance: amount,
                },
                update: {
                    balance: {
                        increment: amount,
                    },
                },
            });
            await tx.balanceLog.create({
                data: {
                    userId: receiverId,
                    amount,
                    type: EnumBalanceLogType.receiveRedPacket,
                    relatedId: redPacketId,
                },
            });

            return {
                ok: true,
                claimed: nextRemainingCount === 0,
            };
        });
    }

    async findDetail(
        redPacketId: bigint,
        page: number,
        perPage: number
    ): Promise<IRedPacketDetail | null> {
        return this.databaseService.redPacket.findUnique({
            where: {
                id: redPacketId,
            },
            select: {
                id: true,
                sender: {
                    select: {
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
                wrapperText: true,
                type: true,
                totalAmount: true,
                totalCount: true,
                remainingAmount: true,
                remainingCount: true,
                status: true,
                receives: {
                    orderBy: {
                        receivedAt: 'asc',
                    },
                    skip: (page - 1) * perPage,
                    take: perPage,
                    select: {
                        receiver: {
                            select: {
                                username: true,
                                name: true,
                                avatar: true,
                            },
                        },
                        amount: true,
                        receivedAt: true,
                    },
                },
            },
        });
    }

    async findExpiredUnclaimed(limit: number): Promise<{ id: bigint }[]> {
        return this.databaseService.redPacket.findMany({
            where: {
                status: EnumRedPacketStatus.unclaimed,
                expireAt: {
                    lte: new Date(),
                },
            },
            orderBy: {
                expireAt: 'asc',
            },
            take: limit,
            select: {
                id: true,
            },
        });
    }

    async expireRedPacket(redPacketId: bigint): Promise<boolean> {
        return this.databaseService.$transaction(async tx => {
            const locked = await tx.redPacket.updateMany({
                where: {
                    id: redPacketId,
                    status: EnumRedPacketStatus.unclaimed,
                    expireAt: {
                        lte: new Date(),
                    },
                },
                data: {
                    status: EnumRedPacketStatus.refunding,
                },
            });
            if (locked.count !== 1) {
                return false;
            }

            const redPacket = await tx.redPacket.findUnique({
                where: {
                    id: redPacketId,
                },
                select: this.redPacketSelect(),
            });
            if (!redPacket) {
                return false;
            }

            await this.refundRemaining(tx, redPacket);
            await tx.redPacket.update({
                where: {
                    id: redPacketId,
                },
                data: {
                    status: EnumRedPacketStatus.expired,
                    remainingAmount: new Prisma.Decimal(0),
                    remainingCount: 0,
                },
            });

            return true;
        });
    }

    async compensateCreatedRedPacket(redPacketId: bigint): Promise<boolean> {
        return this.databaseService.$transaction(async tx => {
            const locked = await tx.redPacket.updateMany({
                where: {
                    id: redPacketId,
                    status: EnumRedPacketStatus.unclaimed,
                },
                data: {
                    status: EnumRedPacketStatus.refunding,
                },
            });
            if (locked.count !== 1) {
                return false;
            }

            const redPacket = await tx.redPacket.findUnique({
                where: {
                    id: redPacketId,
                },
                select: this.redPacketSelect(),
            });
            if (!redPacket) {
                return false;
            }

            await this.refundRemaining(tx, redPacket);
            await tx.redPacket.update({
                where: {
                    id: redPacketId,
                },
                data: {
                    status: EnumRedPacketStatus.expired,
                    remainingAmount: new Prisma.Decimal(0),
                    remainingCount: 0,
                },
            });

            return true;
        });
    }

    private async refundRemaining(
        tx: Prisma.TransactionClient,
        redPacket: IRedPacketRecord
    ): Promise<void> {
        if (redPacket.remainingAmount.comparedTo(new Prisma.Decimal(0)) <= 0) {
            return;
        }

        await tx.userBalance.upsert({
            where: {
                userId: redPacket.senderId,
            },
            create: {
                userId: redPacket.senderId,
                balance: redPacket.remainingAmount,
            },
            update: {
                balance: {
                    increment: redPacket.remainingAmount,
                },
            },
        });
        await tx.balanceLog.create({
            data: {
                userId: redPacket.senderId,
                amount: redPacket.remainingAmount,
                type: EnumBalanceLogType.refundRedPacket,
                relatedId: redPacket.id,
            },
        });
    }

    private redisKeys(redPacketId: bigint): {
        amount: string;
        user: string;
        marker: string;
    } {
        const id = redPacketId.toString();

        return {
            amount: `${RedPacketAmountKeyPrefix}${id}`,
            user: `${RedPacketUserKeyPrefix}${id}`,
            marker: `${RedPacketExpireMarkerKeyPrefix}${id}`,
        };
    }

    private async getRedisClient(): Promise<IRedPacketRedisCommandClient> {
        const store = this.redisKeyv.store as KeyvRedis<unknown>;
        const client = await store.getClient();

        return client as unknown as IRedPacketRedisCommandClient;
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
        const or: Prisma.UserWhereInput[] = [
            {
                mobileNumbers: {
                    some: {
                        number: normalized,
                    },
                },
            },
        ];
        if (uuidValidate(normalized)) {
            or.push({
                id: normalized,
            });
        }
        if (legacyId) {
            or.push({
                legacyId,
            });
        }

        return {
            OR: or,
        };
    }

    private parseLegacyId(identifier: string): bigint | null {
        if (!/^\d+$/.test(identifier)) {
            return null;
        }

        return BigInt(identifier);
    }

    private userSelect(): Prisma.UserSelect {
        return {
            id: true,
            legacyId: true,
            username: true,
            name: true,
            avatar: true,
            status: true,
        };
    }

    private redPacketSelect(): Prisma.RedPacketSelect {
        return {
            id: true,
            senderId: true,
            conversationId: true,
            wrapperText: true,
            type: true,
            totalAmount: true,
            totalCount: true,
            remainingAmount: true,
            remainingCount: true,
            status: true,
            expireAt: true,
            createdAt: true,
        };
    }
}
