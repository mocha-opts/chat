import { AppUnknownException } from '@app/exceptions/app.unknown.exception';
import { HelperService } from '@common/helper/services/helper.service';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import { ContactFriendApplicationExpirationInHours } from '@modules/contact/constants/contact.friend-application.constant';
import { ContactAddFriendRequestDto } from '@modules/contact/dtos/request/contact.add-friend.request.dto';
import { ContactApplyListRequestDto } from '@modules/contact/dtos/request/contact.apply-list.request.dto';
import { ContactModifyApplicationRequestDto } from '@modules/contact/dtos/request/contact.modify-application.request.dto';
import {
    ContactApplicationResponseDto,
    ContactApplyCountResponseDto,
    ContactApplyItemResponseDto,
    ContactApplyListResponseDto,
    ContactMessageResponseDto,
    ContactUserResponseDto,
} from '@modules/contact/dtos/response/contact.legacy.response.dto';
import {
    ContactLegacyApplicationStatus,
    ContactLegacyConversationType,
    ContactLegacyIsReceiver,
    contactMapApplicationStatus,
    contactMapFriendStatus,
} from '@modules/contact/enums/contact.legacy.enum';
import { EnumContactStatusCodeError } from '@modules/contact/enums/contact.status-code.enum';
import { ContactException } from '@modules/contact/exceptions/contact.exception';
import {
    IContactFriendApplication,
    IContactFriendApplicationRealtimePayload,
    IContactNewSessionRealtimePayload,
    IContactUser,
} from '@modules/contact/interfaces/contact.interface';
import { IContactService } from '@modules/contact/interfaces/contact.service.interface';
import { ContactRepository } from '@modules/contact/repositories/contact.repository';
import { RealtimeService } from '@modules/realtime/services/realtime.service';
import { Injectable } from '@nestjs/common';
import { EnumFriendStatus, EnumUserStatus } from '@generated/prisma-client';

@Injectable()
export class ContactService implements IContactService {
    constructor(
        private readonly contactRepository: ContactRepository,
        private readonly realtimeService: RealtimeService,
        private readonly helperService: HelperService
    ) {}

    async searchUser(
        authUserId: string,
        userIdentifier: string,
        phone: string
    ): Promise<IResponseReturn<ContactUserResponseDto>> {
        const actor = await this.resolveActor(authUserId, userIdentifier);
        const target = await this.contactRepository.findUserByPhone(phone);
        this.assertUserAvailable(target);

        const [friend, conversation] = await Promise.all([
            this.contactRepository.findFriendRelation(actor.id, target.id),
            this.contactRepository.findCommonSingleConversation(
                actor.id,
                target.id
            ),
        ]);

        return {
            data: this.mapUserResponse(
                target,
                contactMapFriendStatus(friend?.status ?? null),
                conversation?.id.toString() ?? null
            ),
        };
    }

    async addFriend(
        authUserId: string,
        userIdentifier: string,
        receiverIdentifier: string,
        { msg }: ContactAddFriendRequestDto
    ): Promise<IResponseReturn<number>> {
        const sender = await this.resolveActor(authUserId, userIdentifier);
        const receiver =
            await this.contactRepository.findUserByIdentifier(
                receiverIdentifier
        );
        this.assertUserAvailable(receiver);
        if (sender.id === receiver.id) {
            throw new ContactException(
                EnumContactStatusCodeError.selfOperationInvalid
            );
        }

        const friend = await this.contactRepository.findFriendRelation(
            sender.id,
            receiver.id
        );
        if (friend?.status === EnumFriendStatus.normal) {
            throw new ContactException(
                EnumContactStatusCodeError.alreadyFriend
            );
        }

        const now = this.helperService.dateCreate();
        let applicationId: bigint | null = null;
        const existing = await this.contactRepository.findExistingApplication(
            sender.id,
            receiver.id,
            now
        );
        if (!existing) {
            try {
                const expiredAt = this.helperService.dateForward(
                    now,
                    this.helperService.dateCreateDuration({
                        hours: ContactFriendApplicationExpirationInHours,
                    })
                );
                applicationId = await this.contactRepository.createApplication(
                    sender.id,
                    receiver.id,
                    msg ?? null,
                    expiredAt
                );
            } catch (err: unknown) {
                throw new AppUnknownException(err);
            }
        }

        if (applicationId) {
            await this.pushFriendApplication(sender, receiver, applicationId);
        }

        return { data: 1 };
    }

    async getFriendDetail(
        authUserId: string,
        userIdentifier: string,
        friendIdentifier: string
    ): Promise<IResponseReturn<ContactUserResponseDto>> {
        const actor = await this.resolveActor(authUserId, userIdentifier);
        const friendUser =
            await this.contactRepository.findUserByIdentifier(
                friendIdentifier
            );
        this.assertUserAvailable(friendUser);

        const [friend, conversation] = await Promise.all([
            this.contactRepository.findFriendRelation(
                actor.id,
                friendUser.id
            ),
            this.contactRepository.findCommonSingleConversation(
                actor.id,
                friendUser.id
            ),
        ]);

        return {
            data: this.mapUserResponse(
                friendUser,
                contactMapFriendStatus(friend?.status ?? null),
                conversation?.id.toString() ?? '0'
            ),
        };
    }

    async getUnreadApplyCount(
        authUserId: string,
        userIdentifier: string
    ): Promise<IResponseReturn<ContactApplyCountResponseDto>> {
        const actor = await this.resolveActor(authUserId, userIdentifier);
        const now = this.helperService.dateCreate();
        await this.contactRepository.expireApplicationsForUser(actor.id, now);
        const count = await this.contactRepository.countUnreadApplications(
            actor.id,
            now
        );

        return { data: { count } };
    }

    async getApplyList(
        authUserId: string,
        userIdentifier: string,
        query: ContactApplyListRequestDto
    ): Promise<IResponseReturn<ContactApplyListResponseDto>> {
        const actor = await this.resolveActor(authUserId, userIdentifier);
        await this.contactRepository.expireApplicationsForUser(
            actor.id,
            this.helperService.dateCreate()
        );
        const page = query.pageNum ?? 1;
        const perPage = query.pageSize ?? 20;
        const { data, total } = await this.contactRepository.findApplications(
            actor.id,
            page,
            perPage,
            query.key ?? null
        );

        return {
            data: {
                total,
                data: data.map(application =>
                    this.mapApplicationItem(actor.id, application)
                ),
            },
        };
    }

    async modifyApplicationStatus(
        authUserId: string,
        userIdentifier: string,
        status: string,
        { receiveUserUuids }: ContactModifyApplicationRequestDto
    ): Promise<IResponseReturn<ContactApplicationResponseDto | null>> {
        const actor = await this.resolveActor(authUserId, userIdentifier);
        const now = this.helperService.dateCreate();
        await this.contactRepository.expireApplicationsForUser(actor.id, now);
        const statusCode = Number(status);
        if (statusCode === ContactLegacyApplicationStatus.read) {
            const senders = await this.resolveUsers(receiveUserUuids);
            await this.contactRepository.markApplicationsRead(
                actor.id,
                senders.map(sender => sender.id),
                now
            );

            return { data: null };
        }

        if (statusCode !== ContactLegacyApplicationStatus.accepted) {
            throw new ContactException(
                EnumContactStatusCodeError.applicationStatusInvalid
            );
        }

        const [senderIdentifier] = receiveUserUuids;
        const sender =
            await this.contactRepository.findUserByIdentifier(
                senderIdentifier
            );
        this.assertUserAvailable(sender);

        try {
            const result = await this.contactRepository.acceptApplication(
                actor.id,
                sender.id,
                now
            );
            if (!result) {
                throw new ContactException(
                    EnumContactStatusCodeError.applicationNotFound
                );
            }

            await this.pushNewSingleConversation(
                actor,
                result.applicant,
                result.conversationId
            );

            return {
                data: {
                    userId: this.displayUserId(result.applicant),
                    sessionId: result.conversationId.toString(),
                    sessionType: ContactLegacyConversationType.single,
                    sessionName:
                        result.applicant.name ?? result.applicant.username,
                    avatar: this.pickAvatar(result.applicant),
                },
            };
        } catch (err: unknown) {
            if (
                err instanceof ContactException &&
                err.statusCode ===
                    EnumContactStatusCodeError.applicationNotFound
            ) {
                throw err;
            }
            throw new AppUnknownException(err);
        }
    }

    async deleteFriend(
        authUserId: string,
        userIdentifier: string,
        receiverIdentifier: string
    ): Promise<IResponseReturn<ContactMessageResponseDto>> {
        const actor = await this.resolveActor(authUserId, userIdentifier);
        const friend =
            await this.contactRepository.findUserByIdentifier(
                receiverIdentifier
            );
        this.assertUserAvailable(friend);
        const relation = await this.contactRepository.findFriendRelation(
            actor.id,
            friend.id
        );
        if (!relation || relation.status === EnumFriendStatus.deleted) {
            throw new ContactException(EnumContactStatusCodeError.friendNotFound);
        }

        try {
            await this.contactRepository.deleteFriend(actor.id, friend.id);
        } catch (err: unknown) {
            throw new AppUnknownException(err);
        }

        return { data: { message: '删除好友成功' } };
    }

    async blockFriend(
        authUserId: string,
        userIdentifier: string,
        receiverIdentifier: string
    ): Promise<IResponseReturn<ContactMessageResponseDto>> {
        const actor = await this.resolveActor(authUserId, userIdentifier);
        const friend =
            await this.contactRepository.findUserByIdentifier(
                receiverIdentifier
            );
        this.assertUserAvailable(friend);
        const count = await this.contactRepository.blockFriend(
            actor.id,
            friend.id
        );
        if (count === 0) {
            throw new ContactException(EnumContactStatusCodeError.friendNotFound);
        }

        return { data: { message: '拉黑好友成功' } };
    }

    private async pushFriendApplication(
        sender: IContactUser,
        receiver: IContactUser,
        applicationId: bigint
    ): Promise<void> {
        const payload: IContactFriendApplicationRealtimePayload = {
            applyUserName: sender.name ?? sender.username,
        };

        await this.realtimeService.pushFriendApplication(
            receiver.id,
            payload,
            applicationId.toString()
        );
    }

    private async pushNewSingleConversation(
        accepter: IContactUser,
        applicant: IContactUser,
        conversationId: bigint
    ): Promise<void> {
        const payload: IContactNewSessionRealtimePayload = {
            userId: this.displayUserId(accepter),
            sessionId: conversationId.toString(),
            sessionType: ContactLegacyConversationType.single,
            sessionName: accepter.name ?? accepter.username,
            avatar: this.pickAvatar(accepter),
        };

        await this.realtimeService.pushConversation(
            applicant.id,
            payload,
            conversationId.toString()
        );
    }

    private async resolveActor(
        authUserId: string,
        userIdentifier: string
    ): Promise<IContactUser> {
        const actor =
            await this.contactRepository.findUserByIdentifier(userIdentifier);
        this.assertUserAvailable(actor);
        if (actor.id !== authUserId) {
            throw new ContactException(EnumContactStatusCodeError.forbidden);
        }

        return actor;
    }

    private async resolveUsers(identifiers: string[]): Promise<IContactUser[]> {
        const users = await Promise.all(
            identifiers.map(identifier =>
                this.contactRepository.findUserByIdentifier(identifier)
            )
        );
        const missing = users.some(user => !user);
        if (missing) {
            throw new ContactException(EnumContactStatusCodeError.userNotFound);
        }

        return users as IContactUser[];
    }

    private assertUserAvailable(
        user: IContactUser | null
    ): asserts user is IContactUser {
        if (!user) {
            throw new ContactException(EnumContactStatusCodeError.userNotFound);
        }
        if (user.status !== EnumUserStatus.active) {
            throw new ContactException(EnumContactStatusCodeError.userInactive);
        }
    }

    private mapUserResponse(
        user: IContactUser,
        status: number,
        sessionId: string | null
    ): ContactUserResponseDto {
        return {
            userUuid: this.displayUserId(user),
            nickname: user.name ?? user.username,
            avatar: this.pickAvatar(user),
            email: user.email,
            phone: user.mobileNumbers[0]?.number ?? null,
            signature: user.signature ?? null,
            gender: user.gender ?? null,
            status,
            sessionId,
        };
    }

    private mapApplicationItem(
        actorId: string,
        application: IContactFriendApplication
    ): ContactApplyItemResponseDto {
        const isReceiver = application.receiverId === actorId;
        const oppositeUser = isReceiver
            ? application.sender
            : application.receiver;

        return {
            userUuid: this.displayUserId(oppositeUser),
            nickname: oppositeUser.name ?? oppositeUser.username,
            avatar: this.pickAvatar(oppositeUser),
            msg: application.message ?? null,
            status: contactMapApplicationStatus(application.status),
            time: application.createdAt,
            isReceiver: isReceiver
                ? ContactLegacyIsReceiver.yes
                : ContactLegacyIsReceiver.no,
        };
    }

    private displayUserId(user: Pick<IContactUser, 'id' | 'legacyId'>): string {
        return user.legacyId?.toString() ?? user.id;
    }

    private pickAvatar(user: Pick<IContactUser, 'avatar' | 'photo'>): string | null {
        const photo = user.photo as { completedUrl?: string } | null;

        return user.avatar ?? photo?.completedUrl ?? null;
    }
}
