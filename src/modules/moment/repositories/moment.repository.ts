import { DatabaseService } from '@common/database/services/database.service';
import { EnumFriendStatus, Prisma } from '@generated/prisma-client';
import {
    IMomentComment,
    IMomentLike,
    IMomentMoment,
    IMomentParentComment,
    IMomentTimelineSnapshot,
    IMomentUser,
} from '@modules/moment/interfaces/moment.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MomentRepository {
    constructor(private readonly databaseService: DatabaseService) {}

    async findUserByIdentifier(
        identifier: string
    ): Promise<IMomentUser | null> {
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

    async findVisibleUserIds(userId: string): Promise<string[]> {
        const friends = await this.databaseService.friend.findMany({
            where: {
                userId,
                status: EnumFriendStatus.normal,
            },
            select: {
                friendId: true,
            },
        });

        return [userId, ...friends.map(friend => friend.friendId)];
    }

    async createMoment(
        id: bigint,
        userId: string,
        text: string | null,
        mediaUrls: Prisma.InputJsonArray
    ): Promise<IMomentMoment> {
        return this.databaseService.moment.create({
            data: {
                id,
                userId,
                text,
                mediaUrls,
            },
            select: this.momentSelect(),
        });
    }

    async findMomentById(momentId: bigint): Promise<IMomentMoment | null> {
        return this.databaseService.moment.findUnique({
            where: {
                id: momentId,
            },
            select: this.momentSelect(),
        });
    }

    async softDeleteMomentWithRelations(
        momentId: bigint,
        userId: string,
        deletedAt: Date
    ): Promise<boolean> {
        return this.databaseService.$transaction(async tx => {
            const result = await tx.moment.updateMany({
                where: {
                    id: momentId,
                    userId,
                    deletedAt: null,
                },
                data: {
                    deletedAt,
                },
            });
            if (result.count === 0) {
                return false;
            }

            await tx.momentLike.updateMany({
                where: {
                    momentId,
                    isDeleted: false,
                },
                data: {
                    isDeleted: true,
                },
            });
            await tx.momentComment.updateMany({
                where: {
                    momentId,
                    isDeleted: false,
                },
                data: {
                    isDeleted: true,
                },
            });

            return true;
        });
    }

    async upsertLike(
        momentId: bigint,
        userId: string
    ): Promise<IMomentLike> {
        return this.databaseService.momentLike.upsert({
            where: {
                momentId_userId: {
                    momentId,
                    userId,
                },
            },
            create: {
                momentId,
                userId,
                isDeleted: false,
            },
            update: {
                isDeleted: false,
            },
            select: this.likeSelect(),
        });
    }

    async softDeleteLike(
        momentId: bigint,
        likeId: bigint,
        userId: string
    ): Promise<boolean> {
        const result = await this.databaseService.momentLike.updateMany({
            where: {
                id: likeId,
                momentId,
                userId,
                isDeleted: false,
            },
            data: {
                isDeleted: true,
            },
        });

        return result.count > 0;
    }

    async findParentComment(
        momentId: bigint,
        parentCommentId: bigint
    ): Promise<IMomentParentComment | null> {
        return this.databaseService.momentComment.findFirst({
            where: {
                id: parentCommentId,
                momentId,
                isDeleted: false,
            },
            select: {
                id: true,
                userId: true,
                user: {
                    select: this.userSelect(),
                },
            },
        });
    }

    async createComment(
        momentId: bigint,
        userId: string,
        content: string,
        parentCommentId: bigint | null
    ): Promise<IMomentComment> {
        return this.databaseService.momentComment.create({
            data: {
                momentId,
                userId,
                content,
                parentCommentId,
            },
            select: this.commentSelect(),
        });
    }

    async softDeleteCommentWithChildren(
        momentId: bigint,
        commentId: bigint,
        userId: string
    ): Promise<boolean> {
        return this.databaseService.$transaction(async tx => {
            const result = await tx.momentComment.updateMany({
                where: {
                    id: commentId,
                    momentId,
                    userId,
                    isDeleted: false,
                },
                data: {
                    isDeleted: true,
                },
            });
            if (result.count === 0) {
                return false;
            }

            await tx.momentComment.updateMany({
                where: {
                    momentId,
                    parentCommentId: commentId,
                    isDeleted: false,
                },
                data: {
                    isDeleted: true,
                },
            });

            return true;
        });
    }

    async findTimelineSnapshot(
        visibleUserIds: string[],
        since: Date
    ): Promise<IMomentTimelineSnapshot> {
        if (visibleUserIds.length === 0) {
            return {
                moments: [],
                likes: [],
                comments: [],
            };
        }

        const [moments, likes, comments] =
            await this.databaseService.$transaction([
                this.databaseService.moment.findMany({
                    where: {
                        userId: {
                            in: visibleUserIds,
                        },
                        updatedAt: {
                            gte: since,
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    select: this.momentSelect(),
                }),
                this.databaseService.momentLike.findMany({
                    where: {
                        userId: {
                            in: visibleUserIds,
                        },
                        updatedAt: {
                            gte: since,
                        },
                        moment: {
                            userId: {
                                in: visibleUserIds,
                            },
                        },
                    },
                    orderBy: {
                        updatedAt: 'asc',
                    },
                    select: this.likeSelect(),
                }),
                this.databaseService.momentComment.findMany({
                    where: {
                        userId: {
                            in: visibleUserIds,
                        },
                        updatedAt: {
                            gte: since,
                        },
                        moment: {
                            userId: {
                                in: visibleUserIds,
                            },
                        },
                    },
                    orderBy: {
                        updatedAt: 'asc',
                    },
                    select: this.commentSelect(),
                }),
            ]);

        return {
            moments,
            likes,
            comments,
        };
    }

    private createUserIdentifierWhere(
        identifier: string
    ): Prisma.UserWhereInput | null {
        const normalized = identifier.trim();
        if (!normalized) {
            return null;
        }

        if (/^\d+$/.test(normalized)) {
            return {
                legacyId: BigInt(normalized),
            };
        }

        if (
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                normalized
            )
        ) {
            return {
                id: normalized,
            };
        }

        return {
            mobileNumbers: {
                some: {
                    number: normalized,
                },
            },
        };
    }

    private userSelect(): Prisma.UserSelect {
        return {
            id: true,
            legacyId: true,
            username: true,
            name: true,
            avatar: true,
            photo: true,
            status: true,
        };
    }

    private momentSelect(): Prisma.MomentSelect {
        return {
            id: true,
            userId: true,
            text: true,
            mediaUrls: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            user: {
                select: this.userSelect(),
            },
        };
    }

    private likeSelect(): Prisma.MomentLikeSelect {
        return {
            id: true,
            momentId: true,
            userId: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
            user: {
                select: this.userSelect(),
            },
        };
    }

    private commentSelect(): Prisma.MomentCommentSelect {
        return {
            id: true,
            momentId: true,
            userId: true,
            parentCommentId: true,
            content: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
            user: {
                select: this.userSelect(),
            },
        };
    }
}
