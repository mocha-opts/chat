import { DatabaseService } from '@common/database/services/database.service';
import { Injectable } from '@nestjs/common';
import {
    IConversationCreateGroupResult,
    IConversationEntity,
    IConversationMember,
    IConversationUser,
} from '@modules/conversation/interfaces/conversation.interface';
import {
    EnumConversationMemberRole,
    EnumConversationMemberStatus,
    EnumConversationStatus,
    EnumConversationType,
    EnumFriendStatus,
    Prisma,
} from '@generated/prisma-client';

@Injectable()
export class ConversationRepository {
    constructor(private readonly databaseService: DatabaseService) {}

    async findUserByIdentifier(
        identifier: string
    ): Promise<IConversationUser | null> {
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

    async findUsersByIdentifiers(
        identifiers: string[]
    ): Promise<Map<string, IConversationUser>> {
        const pairs = await Promise.all(
            identifiers.map(async identifier => ({
                identifier,
                user: await this.findUserByIdentifier(identifier),
            }))
        );
        const map = new Map<string, IConversationUser>();
        for (const { identifier, user } of pairs) {
            if (user) {
                map.set(identifier, user);
            }
        }

        return map;
    }

    async createGroup(
        creator: IConversationUser,
        members: IConversationUser[],
        failedMemberIds: string[],
        groupName: string
    ): Promise<IConversationCreateGroupResult> {
        const conversation = await this.databaseService.conversation.create({
            data: {
                name: groupName,
                type: EnumConversationType.group,
                status: EnumConversationStatus.normal,
                members: {
                    createMany: {
                        data: [
                            {
                                userId: creator.id,
                                role: EnumConversationMemberRole.owner,
                                status: EnumConversationMemberStatus.normal,
                            },
                            ...members.map(member => ({
                                userId: member.id,
                                role: EnumConversationMemberRole.member,
                                status: EnumConversationMemberStatus.normal,
                            })),
                        ],
                    },
                },
            },
            select: {
                id: true,
                name: true,
                type: true,
            },
        });

        return { conversation, creator, failedMemberIds };
    }

    async findGroupConversation(
        conversationId: bigint
    ): Promise<IConversationEntity | null> {
        return this.databaseService.conversation.findFirst({
            where: {
                id: conversationId,
                type: EnumConversationType.group,
                status: EnumConversationStatus.normal,
            },
            select: {
                id: true,
                name: true,
                type: true,
            },
        });
    }

    async findMember(
        conversationId: bigint,
        userId: string
    ): Promise<IConversationMember | null> {
        return this.databaseService.conversationMember.findFirst({
            where: {
                conversationId,
                userId,
                status: EnumConversationMemberStatus.normal,
            },
            include: {
                user: {
                    select: this.userSelect(),
                },
            },
        });
    }

    async findMembersByUserIds(
        conversationId: bigint,
        userIds: string[]
    ): Promise<IConversationMember[]> {
        return this.databaseService.conversationMember.findMany({
            where: {
                conversationId,
                userId: {
                    in: userIds,
                },
                status: EnumConversationMemberStatus.normal,
            },
            include: {
                user: {
                    select: this.userSelect(),
                },
            },
        });
    }

    async findGroupMembers(
        conversationId: bigint
    ): Promise<IConversationMember[]> {
        return this.databaseService.conversationMember.findMany({
            where: {
                conversationId,
                status: EnumConversationMemberStatus.normal,
            },
            orderBy: {
                createdAt: 'asc',
            },
            include: {
                user: {
                    select: this.userSelect(),
                },
            },
        });
    }

    async findNormalFriendIds(
        userId: string,
        friendIds: string[]
    ): Promise<Set<string>> {
        const rows = await this.databaseService.friend.findMany({
            where: {
                userId,
                friendId: {
                    in: friendIds,
                },
                status: EnumFriendStatus.normal,
            },
            select: {
                friendId: true,
            },
        });

        return new Set(rows.map(({ friendId }) => friendId));
    }

    async addMembers(
        conversationId: bigint,
        userIds: string[]
    ): Promise<void> {
        if (userIds.length === 0) {
            return;
        }

        await this.databaseService.conversationMember.createMany({
            data: userIds.map(userId => ({
                conversationId,
                userId,
                role: EnumConversationMemberRole.member,
                status: EnumConversationMemberStatus.normal,
            })),
            skipDuplicates: true,
        });
    }

    async removeMembers(
        conversationId: bigint,
        userIds: string[]
    ): Promise<void> {
        await this.databaseService.conversationMember.updateMany({
            where: {
                conversationId,
                userId: {
                    in: userIds,
                },
                status: EnumConversationMemberStatus.normal,
            },
            data: {
                status: EnumConversationMemberStatus.deleted,
            },
        });
    }

    async updateMemberRole(
        conversationId: bigint,
        userId: string,
        role: EnumConversationMemberRole
    ): Promise<void> {
        await this.databaseService.conversationMember.updateMany({
            where: {
                conversationId,
                userId,
                status: EnumConversationMemberStatus.normal,
            },
            data: {
                role,
            },
        });
    }

    private createUserIdentifierWhere(
        identifier: string
    ): Prisma.UserWhereInput | null {
        if (/^\d+$/.test(identifier)) {
            return {
                legacyId: BigInt(identifier),
            };
        }

        if (
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                identifier
            )
        ) {
            return {
                id: identifier,
            };
        }

        return null;
    }

    private userSelect(): Prisma.UserSelect {
        return {
            id: true,
            legacyId: true,
            name: true,
            username: true,
            avatar: true,
            photo: true,
            status: true,
        };
    }
}
