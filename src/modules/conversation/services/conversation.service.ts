import { AppUnknownException } from '@app/exceptions/app.unknown.exception';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import {
    ContactLegacyConversationType,
    ContactLegacyGroupAvatar,
} from '@modules/contact/enums/contact.legacy.enum';
import { ConversationCreateGroupRequestDto } from '@modules/conversation/dtos/request/conversation.create-group.request.dto';
import { ConversationExitGroupRequestDto } from '@modules/conversation/dtos/request/conversation.exit-group.request.dto';
import { ConversationInviteGroupRequestDto } from '@modules/conversation/dtos/request/conversation.invite-group.request.dto';
import { ConversationKickGroupRequestDto } from '@modules/conversation/dtos/request/conversation.kick-group.request.dto';
import { ConversationSetAdminRequestDto } from '@modules/conversation/dtos/request/conversation.set-admin.request.dto';
import {
    ConversationCreateGroupResponseDto,
    ConversationExitGroupResponseDto,
    ConversationGroupMemberResponseDto,
    ConversationGroupMembersResponseDto,
    ConversationInviteGroupResponseDto,
    ConversationKickGroupResponseDto,
    ConversationSetAdminResponseDto,
} from '@modules/conversation/dtos/response/conversation.legacy.response.dto';
import { ConversationKickedAdminInvalidException } from '@modules/conversation/exceptions/conversation.kicked-admin-invalid.exception';
import { ConversationKickedOwnerInvalidException } from '@modules/conversation/exceptions/conversation.kicked-owner-invalid.exception';
import { ConversationMemberNotFoundException } from '@modules/conversation/exceptions/conversation.member-not-found.exception';
import { ConversationNotFoundException } from '@modules/conversation/exceptions/conversation.not-found.exception';
import { ConversationPermissionDeniedException } from '@modules/conversation/exceptions/conversation.permission-denied.exception';
import { ConversationUserInactiveException } from '@modules/conversation/exceptions/conversation.user-inactive.exception';
import { ConversationUserNotFoundException } from '@modules/conversation/exceptions/conversation.user-not-found.exception';
import {
    IConversationEntity,
    IConversationMember,
    IConversationNewGroupSessionRealtimePayload,
    IConversationUser,
} from '@modules/conversation/interfaces/conversation.interface';
import { IConversationService } from '@modules/conversation/interfaces/conversation.service.interface';
import { ConversationRepository } from '@modules/conversation/repositories/conversation.repository';
import { RealtimeService } from '@modules/realtime/services/realtime.service';
import { Injectable } from '@nestjs/common';
import {
    EnumConversationMemberRole,
    EnumUserStatus,
} from '@generated/prisma-client';

@Injectable()
export class ConversationService implements IConversationService {
    constructor(
        private readonly conversationRepository: ConversationRepository,
        private readonly realtimeService: RealtimeService
    ) {}

    async createGroup(
        authUserId: string,
        { creatorId, memberIds }: ConversationCreateGroupRequestDto
    ): Promise<IResponseReturn<ConversationCreateGroupResponseDto>> {
        const creator = await this.resolveActor(authUserId, creatorId);
        const { users, failedIds } = await this.resolveAvailableUsers(
            memberIds
        );
        const uniqueMembers = this.uniqueUsers(
            users.filter(user => user.id !== creator.id)
        );
        const groupName = this.createGroupName([creator, ...uniqueMembers]);

        try {
            const result = await this.conversationRepository.createGroup(
                creator,
                uniqueMembers,
                failedIds,
                groupName
            );
            await this.pushGroupConversation(
                result.creator,
                result.conversation,
                result.members
            );

            return {
                data: {
                    sessionId: result.conversation.id.toString(),
                    sessionName: result.conversation.name,
                    sessionType: ContactLegacyConversationType.group,
                    avatar: ContactLegacyGroupAvatar,
                    creatorId: this.displayUserId(result.creator),
                    failedMemberIds: result.failedMemberIds,
                },
            };
        } catch (err: unknown) {
            throw new AppUnknownException(err);
        }
    }

    async inviteGroup(
        authUserId: string,
        { sessionId, inviterId, inviteeIds }: ConversationInviteGroupRequestDto
    ): Promise<IResponseReturn<ConversationInviteGroupResponseDto>> {
        const inviter = await this.resolveActor(authUserId, inviterId);
        const conversationId = this.parseConversationId(sessionId);
        const conversation = await this.assertGroupExists(conversationId);
        const inviterMember = await this.assertMember(conversationId, inviter.id);
        this.assertOwnerOrAdmin(inviterMember);

        const { users, failedIds } = await this.resolveAvailableUsers(
            inviteeIds
        );
        const friendIds =
            await this.conversationRepository.findNormalFriendIds(
                inviter.id,
                users.map(user => user.id)
            );
        const currentMembers =
            await this.conversationRepository.findMembersByUserIds(
                conversationId,
                users.map(user => user.id)
            );
        const currentMemberIds = new Set(
            currentMembers.map(member => member.userId)
        );
        const successUsers = this.uniqueUsers(users).filter(
            user => friendIds.has(user.id) && !currentMemberIds.has(user.id)
        );
        const failedUserIds = users
            .filter(
                user => !friendIds.has(user.id) || currentMemberIds.has(user.id)
            )
            .map(user => this.displayUserId(user));

        try {
            await this.conversationRepository.addMembers(
                conversationId,
                successUsers.map(user => user.id)
            );
            await this.pushGroupConversation(
                inviter,
                conversation,
                successUsers
            );
        } catch (err: unknown) {
            throw new AppUnknownException(err);
        }

        return {
            data: {
                successIds: successUsers.map(user => this.displayUserId(user)),
                failedIds: [...failedIds, ...failedUserIds],
            },
        };
    }

    async kickGroupMembers(
        authUserId: string,
        { sessionId, operatorId, memberIds }: ConversationKickGroupRequestDto
    ): Promise<IResponseReturn<ConversationKickGroupResponseDto>> {
        const operator = await this.resolveActor(authUserId, operatorId);
        const conversationId = this.parseConversationId(sessionId);
        await this.assertGroupExists(conversationId);
        const operatorMember = await this.assertMember(
            conversationId,
            operator.id
        );
        this.assertOwnerOrAdmin(operatorMember);

        const { users } = await this.resolveAvailableUsers(memberIds);
        const targetMembers =
            await this.conversationRepository.findMembersByUserIds(
                conversationId,
                users.map(user => user.id)
            );
        if (targetMembers.length !== users.length) {
            throw new ConversationMemberNotFoundException();
        }

        for (const target of targetMembers) {
            if (target.role === EnumConversationMemberRole.owner) {
                throw new ConversationKickedOwnerInvalidException();
            }
            if (
                operatorMember.role === EnumConversationMemberRole.admin &&
                target.role === EnumConversationMemberRole.admin
            ) {
                throw new ConversationKickedAdminInvalidException();
            }
        }

        try {
            await this.conversationRepository.removeMembers(
                conversationId,
                targetMembers.map(member => member.userId)
            );
        } catch (err: unknown) {
            throw new AppUnknownException(err);
        }

        return {
            data: {
                successIds: targetMembers.map(member =>
                    this.displayUserId(member.user)
                ),
            },
        };
    }

    async exitGroup(
        authUserId: string,
        { sessionId, userId }: ConversationExitGroupRequestDto
    ): Promise<IResponseReturn<ConversationExitGroupResponseDto>> {
        const user = await this.resolveActor(authUserId, userId);
        const conversationId = this.parseConversationId(sessionId);
        await this.assertGroupExists(conversationId);
        await this.assertMember(conversationId, user.id);

        try {
            await this.conversationRepository.removeMembers(conversationId, [
                user.id,
            ]);
        } catch (err: unknown) {
            throw new AppUnknownException(err);
        }

        return { data: { success: true } };
    }

    async getGroupMembers(
        authUserId: string,
        conversationIdentifier: string
    ): Promise<IResponseReturn<ConversationGroupMembersResponseDto>> {
        const conversationId = this.parseConversationId(conversationIdentifier);
        await this.assertGroupExists(conversationId);
        await this.assertMember(conversationId, authUserId);
        const members = await this.conversationRepository.findGroupMembers(
            conversationId
        );

        return {
            data: {
                groupMembers: members.map(member =>
                    this.mapGroupMember(member)
                ),
                total: members.length,
            },
        };
    }

    async setGroupAdmin(
        authUserId: string,
        { sessionId, userId, targetId, isAdmin }: ConversationSetAdminRequestDto
    ): Promise<IResponseReturn<ConversationSetAdminResponseDto>> {
        const operator = await this.resolveActor(authUserId, userId);
        const target =
            await this.conversationRepository.findUserByIdentifier(targetId);
        this.assertUserAvailable(target);
        const conversationId = this.parseConversationId(sessionId);
        await this.assertGroupExists(conversationId);
        const operatorMember = await this.assertMember(
            conversationId,
            operator.id
        );
        if (operatorMember.role !== EnumConversationMemberRole.owner) {
            throw new ConversationPermissionDeniedException();
        }
        const targetMember = await this.assertMember(
            conversationId,
            target.id
        );
        if (targetMember.role === EnumConversationMemberRole.owner) {
            throw new ConversationPermissionDeniedException();
        }

        try {
            await this.conversationRepository.updateMemberRole(
                conversationId,
                target.id,
                isAdmin
                    ? EnumConversationMemberRole.admin
                    : EnumConversationMemberRole.member
            );
        } catch (err: unknown) {
            throw new AppUnknownException(err);
        }

        return {
            data: {
                success: true,
                message: isAdmin ? '已设置为管理员' : '已取消管理员',
            },
        };
    }

    private async pushGroupConversation(
        creator: IConversationUser,
        conversation: IConversationEntity,
        receivers: IConversationUser[]
    ): Promise<void> {
        if (receivers.length === 0) {
            return;
        }

        const payload: IConversationNewGroupSessionRealtimePayload = {
            creatorId: this.displayUserId(creator),
            sessionId: conversation.id.toString(),
            sessionType: ContactLegacyConversationType.group,
            sessionName: conversation.name,
            avatar: ContactLegacyGroupAvatar,
        };

        await Promise.all(
            receivers.map(receiver =>
                this.realtimeService.pushConversation(
                    receiver.id,
                    payload,
                    conversation.id.toString()
                )
            )
        );
    }

    private async resolveActor(
        authUserId: string,
        identifier: string
    ): Promise<IConversationUser> {
        const user =
            await this.conversationRepository.findUserByIdentifier(identifier);
        this.assertUserAvailable(user);
        if (user.id !== authUserId) {
            throw new ConversationPermissionDeniedException();
        }

        return user;
    }

    private async resolveAvailableUsers(
        identifiers: string[]
    ): Promise<{ users: IConversationUser[]; failedIds: string[] }> {
        const uniqueIdentifiers = [...new Set(identifiers)];
        const userMap =
            await this.conversationRepository.findUsersByIdentifiers(
                uniqueIdentifiers
            );
        const users: IConversationUser[] = [];
        const failedIds: string[] = [];

        for (const identifier of uniqueIdentifiers) {
            const user = userMap.get(identifier);
            if (!user || user.status !== EnumUserStatus.active) {
                failedIds.push(identifier);
            } else {
                users.push(user);
            }
        }

        return { users, failedIds };
    }

    private uniqueUsers(users: IConversationUser[]): IConversationUser[] {
        const seen = new Set<string>();

        return users.filter(user => {
            if (seen.has(user.id)) {
                return false;
            }
            seen.add(user.id);

            return true;
        });
    }

    private async assertGroupExists(
        conversationId: bigint
    ): Promise<IConversationEntity> {
        const conversation =
            await this.conversationRepository.findGroupConversation(
                conversationId
            );
        if (!conversation) {
            throw new ConversationNotFoundException();
        }

        return conversation;
    }

    private async assertMember(
        conversationId: bigint,
        userId: string
    ): Promise<IConversationMember> {
        const member = await this.conversationRepository.findMember(
            conversationId,
            userId
        );
        if (!member) {
            throw new ConversationMemberNotFoundException();
        }

        return member;
    }

    private assertOwnerOrAdmin(member: IConversationMember): void {
        if (
            member.role !== EnumConversationMemberRole.owner &&
            member.role !== EnumConversationMemberRole.admin
        ) {
            throw new ConversationPermissionDeniedException();
        }
    }

    private assertUserAvailable(
        user: IConversationUser | null
    ): asserts user is IConversationUser {
        if (!user) {
            throw new ConversationUserNotFoundException();
        }
        if (user.status !== EnumUserStatus.active) {
            throw new ConversationUserInactiveException();
        }
    }

    private parseConversationId(identifier: string): bigint {
        if (!/^\d+$/.test(identifier)) {
            throw new ConversationNotFoundException();
        }

        return BigInt(identifier);
    }

    private createGroupName(users: IConversationUser[]): string {
        return users
            .map(user => user.name ?? user.username)
            .join(',')
            .slice(0, 16);
    }

    private mapGroupMember(
        member: IConversationMember
    ): ConversationGroupMemberResponseDto {
        return {
            userId: this.displayUserId(member.user),
            userName: member.user.name ?? member.user.username,
            avatar: this.pickAvatar(member.user),
        };
    }

    private displayUserId(
        user: Pick<IConversationUser, 'id' | 'legacyId'>
    ): string {
        return user.legacyId?.toString() ?? user.id;
    }

    private pickAvatar(
        user: Pick<IConversationUser, 'avatar' | 'photo'>
    ): string | null {
        const photo = user.photo as { completedUrl?: string } | null;

        return user.avatar ?? photo?.completedUrl ?? null;
    }
}
