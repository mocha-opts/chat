import { DatabaseUtil } from '@common/database/utils/database.util';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import { EnumUserStatus, Prisma } from '@generated/prisma-client';
import {
    MomentCreateNoticeType,
    MomentDeleteCommentSuccessMessage,
    MomentDeleteLikeSuccessMessage,
    MomentDeleteSuccessMessage,
    MomentInteractionNoticeType,
    MomentSnowflakeEpochInMs,
    MomentSnowflakeSequenceMask,
} from '@modules/moment/constants/moment.constant';
import { MomentCreateCommentRequestDto } from '@modules/moment/dtos/request/moment.create-comment.request.dto';
import { MomentCreateRequestDto } from '@modules/moment/dtos/request/moment.create.request.dto';
import { MomentDeleteCommentRequestDto } from '@modules/moment/dtos/request/moment.delete-comment.request.dto';
import { MomentDeleteLikeRequestDto } from '@modules/moment/dtos/request/moment.delete-like.request.dto';
import { MomentListRequestDto } from '@modules/moment/dtos/request/moment.list.request.dto';
import { MomentUserRequestDto } from '@modules/moment/dtos/request/moment.user.request.dto';
import {
    MomentCommentResponseDto,
    MomentCreateCommentResponseDto,
    MomentCreateLikeResponseDto,
    MomentCreateResponseDto,
    MomentLikeResponseDto,
    MomentListResponseDto,
    MomentMessageResponseDto,
    MomentTimelineItemResponseDto,
} from '@modules/moment/dtos/response/moment.legacy.response.dto';
import { MomentCommentNotFoundException } from '@modules/moment/exceptions/moment.comment-not-found.exception';
import { MomentContentInvalidException } from '@modules/moment/exceptions/moment.content-invalid.exception';
import { MomentForbiddenException } from '@modules/moment/exceptions/moment.forbidden.exception';
import { MomentLikeNotFoundException } from '@modules/moment/exceptions/moment.like-not-found.exception';
import { MomentNotFoundException } from '@modules/moment/exceptions/moment.not-found.exception';
import { MomentParentCommentNotFoundException } from '@modules/moment/exceptions/moment.parent-comment-not-found.exception';
import { MomentTimeInvalidException } from '@modules/moment/exceptions/moment.time-invalid.exception';
import { MomentUserInactiveException } from '@modules/moment/exceptions/moment.user-inactive.exception';
import { MomentUserNotFoundException } from '@modules/moment/exceptions/moment.user-not-found.exception';
import {
    IMomentComment,
    IMomentLike,
    IMomentMoment,
    IMomentParentComment,
    IMomentRealtimePayload,
    IMomentUser,
} from '@modules/moment/interfaces/moment.interface';
import { IMomentService } from '@modules/moment/interfaces/moment.service.interface';
import { MomentRepository } from '@modules/moment/repositories/moment.repository';
import { RealtimeService } from '@modules/realtime/services/realtime.service';
import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

@Injectable()
export class MomentService implements IMomentService {
    private lastMomentTimestamp = 0n;
    private momentSequence = 0n;

    constructor(
        private readonly momentRepository: MomentRepository,
        private readonly realtimeService: RealtimeService,
        private readonly databaseUtil: DatabaseUtil
    ) {}

    async createMoment(
        authUserId: string,
        body: MomentCreateRequestDto
    ): Promise<IResponseReturn<MomentCreateResponseDto>> {
        const actor = await this.resolveActor(authUserId, body.userId);
        const text = this.normalizeText(body.text ?? null);
        const mediaUrls = this.normalizeMediaUrls(body.mediaUrls ?? null);
        this.assertMomentContent(text, mediaUrls);

        const momentId = this.createMomentId();
        const jsonMediaUrls = this.databaseUtil.toPlainArray<
            string[],
            Prisma.InputJsonValue
        >(mediaUrls);
        const moment = await this.momentRepository.createMoment(
            momentId,
            actor.id,
            text,
            jsonMediaUrls
        );
        const visibleUserIds = await this.momentRepository.findVisibleUserIds(
            actor.id
        );

        await this.pushMomentCreate(actor, moment, visibleUserIds);

        return {
            data: {
                userId: this.displayUserId(actor),
                text: moment.text,
                mediaUrls: this.mapMediaUrls(moment.mediaUrls),
                momentId: moment.id.toString(),
            },
        };
    }

    async deleteMoment(
        authUserId: string,
        momentId: string,
        query: MomentUserRequestDto
    ): Promise<IResponseReturn<MomentMessageResponseDto>> {
        const actor = await this.resolveActor(authUserId, query.userId);
        const parsedMomentId = this.parseId(momentId);
        const moment = await this.momentRepository.findMomentById(
            parsedMomentId
        );
        this.assertMomentExists(moment);
        if (moment.userId !== actor.id) {
            throw new MomentForbiddenException();
        }

        const deleted =
            await this.momentRepository.softDeleteMomentWithRelations(
                parsedMomentId,
                actor.id,
                new Date()
            );
        if (!deleted) {
            throw new MomentNotFoundException();
        }

        return {
            data: {
                message: MomentDeleteSuccessMessage,
            },
        };
    }

    async likeMoment(
        authUserId: string,
        momentId: string,
        body: MomentUserRequestDto
    ): Promise<IResponseReturn<MomentCreateLikeResponseDto>> {
        const actor = await this.resolveActor(authUserId, body.userId);
        const moment = await this.resolveVisibleMoment(
            actor.id,
            this.parseId(momentId)
        );
        const like = await this.momentRepository.upsertLike(
            moment.id,
            actor.id
        );

        await this.pushMomentInteraction(actor, moment, 'like', like.id);

        return {
            data: {
                likeId: like.id.toString(),
            },
        };
    }

    async deleteLikeMoment(
        authUserId: string,
        momentId: string,
        query: MomentDeleteLikeRequestDto
    ): Promise<IResponseReturn<MomentMessageResponseDto>> {
        const actor = await this.resolveActor(authUserId, query.userId);
        const parsedMomentId = this.parseId(momentId);
        await this.resolveVisibleMoment(actor.id, parsedMomentId);
        const deleted = await this.momentRepository.softDeleteLike(
            parsedMomentId,
            this.parseId(query.likeId),
            actor.id
        );
        if (!deleted) {
            throw new MomentLikeNotFoundException();
        }

        return {
            data: {
                message: MomentDeleteLikeSuccessMessage,
            },
        };
    }

    async createComment(
        authUserId: string,
        momentId: string,
        body: MomentCreateCommentRequestDto
    ): Promise<IResponseReturn<MomentCreateCommentResponseDto>> {
        const actor = await this.resolveActor(authUserId, body.userId);
        const moment = await this.resolveVisibleMoment(
            actor.id,
            this.parseId(momentId)
        );
        const content = this.normalizeText(body.comment);
        if (!content) {
            throw new MomentContentInvalidException();
        }

        const parentComment = await this.resolveParentComment(
            moment.id,
            body.parentCommentId ?? null
        );
        const comment = await this.momentRepository.createComment(
            moment.id,
            actor.id,
            content,
            parentComment?.id ?? null
        );

        await this.pushMomentInteraction(actor, moment, 'comment', comment.id);

        return {
            data: {
                parentCommentId: parentComment?.id.toString() ?? null,
                parentUserName: parentComment
                    ? this.displayUserName(parentComment.user)
                    : null,
                commentId: comment.id.toString(),
                userName: this.displayUserName(actor),
                comment: comment.content,
            },
        };
    }

    async deleteComment(
        authUserId: string,
        momentId: string,
        query: MomentDeleteCommentRequestDto
    ): Promise<IResponseReturn<MomentMessageResponseDto>> {
        const actor = await this.resolveActor(authUserId, query.userId);
        const parsedMomentId = this.parseId(momentId);
        await this.resolveVisibleMoment(actor.id, parsedMomentId);
        const deleted =
            await this.momentRepository.softDeleteCommentWithChildren(
                parsedMomentId,
                this.parseId(query.commentId),
                actor.id
            );
        if (!deleted) {
            throw new MomentCommentNotFoundException();
        }

        return {
            data: {
                message: MomentDeleteCommentSuccessMessage,
            },
        };
    }

    async getMomentList(
        authUserId: string,
        userIdentifier: string,
        query: MomentListRequestDto
    ): Promise<IResponseReturn<MomentListResponseDto>> {
        const actor = await this.resolveActor(authUserId, userIdentifier);
        const since = this.parseSince(query.time);
        const visibleUserIds = await this.momentRepository.findVisibleUserIds(
            actor.id
        );
        const visibleUserIdSet = new Set(visibleUserIds);
        const snapshot = await this.momentRepository.findTimelineSnapshot(
            visibleUserIds,
            since
        );
        const createMoment: MomentTimelineItemResponseDto[] = [];
        const deleteMoment: string[] = [];

        for (const moment of snapshot.moments) {
            if (moment.deletedAt) {
                deleteMoment.push(moment.id.toString());
                continue;
            }

            createMoment.push(this.mapMoment(moment));
        }

        const createLike = snapshot.likes
            .filter(like => !like.isDeleted && visibleUserIdSet.has(like.userId))
            .map(like => this.mapLike(like));
        const deleteLike = snapshot.likes
            .filter(like => like.isDeleted && visibleUserIdSet.has(like.userId))
            .map(like => like.id.toString());
        const createComment = snapshot.comments
            .filter(
                comment =>
                    !comment.isDeleted && visibleUserIdSet.has(comment.userId)
            )
            .map(comment => this.mapComment(comment));
        const deleteComment = snapshot.comments
            .filter(
                comment =>
                    comment.isDeleted && visibleUserIdSet.has(comment.userId)
            )
            .map(comment => comment.id.toString());

        return {
            data: {
                deleteLike,
                deleteComment,
                deleteMoment,
                createLike,
                createComment,
                createMoment,
            },
        };
    }

    private async resolveActor(
        authUserId: string,
        userIdentifier: string
    ): Promise<IMomentUser> {
        const user =
            await this.momentRepository.findUserByIdentifier(userIdentifier);
        if (!user) {
            throw new MomentUserNotFoundException();
        }
        if (user.status !== EnumUserStatus.active) {
            throw new MomentUserInactiveException();
        }
        if (user.id !== authUserId) {
            throw new MomentForbiddenException();
        }

        return user;
    }

    private async resolveVisibleMoment(
        userId: string,
        momentId: bigint
    ): Promise<IMomentMoment> {
        const moment = await this.momentRepository.findMomentById(momentId);
        this.assertMomentExists(moment);
        const visibleUserIds = await this.momentRepository.findVisibleUserIds(
            userId
        );
        if (!visibleUserIds.includes(moment.userId)) {
            throw new MomentForbiddenException();
        }

        return moment;
    }

    private async resolveParentComment(
        momentId: bigint,
        parentCommentId: string | null
    ): Promise<IMomentParentComment | null> {
        if (!parentCommentId) {
            return null;
        }

        const parentComment = await this.momentRepository.findParentComment(
            momentId,
            this.parseId(parentCommentId)
        );
        if (!parentComment) {
            throw new MomentParentCommentNotFoundException();
        }

        return parentComment;
    }

    private assertMomentExists(
        moment: IMomentMoment | null
    ): asserts moment is IMomentMoment {
        if (!moment || moment.deletedAt) {
            throw new MomentNotFoundException();
        }
    }

    private assertMomentContent(
        text: string | null,
        mediaUrls: string[]
    ): void {
        if (!text && mediaUrls.length === 0) {
            throw new MomentContentInvalidException();
        }
    }

    private normalizeText(text: string | null): string | null {
        const normalized = text?.trim() ?? null;

        return normalized && normalized.length > 0 ? normalized : null;
    }

    private normalizeMediaUrls(mediaUrls: string[] | null): string[] {
        if (!mediaUrls) {
            return [];
        }

        return mediaUrls
            .map(mediaUrl => mediaUrl.trim())
            .filter(mediaUrl => mediaUrl.length > 0);
    }

    private parseId(value: string): bigint {
        const normalized = value.trim();
        if (!/^\d+$/.test(normalized)) {
            throw new MomentNotFoundException();
        }

        return BigInt(normalized);
    }

    private parseSince(value: string): Date {
        const normalized = value.trim();
        const parsed =
            DateTime.fromISO(normalized).isValid
                ? DateTime.fromISO(normalized)
                : DateTime.fromSQL(normalized).isValid
                  ? DateTime.fromSQL(normalized)
                  : DateTime.fromFormat(
                        normalized,
                        'yyyy-MM-dd HH:mm:ss'
                    );
        if (!parsed.isValid) {
            throw new MomentTimeInvalidException();
        }

        return parsed.toJSDate();
    }

    private createMomentId(): bigint {
        const timestamp = BigInt(Date.now());
        if (timestamp === this.lastMomentTimestamp) {
            this.momentSequence =
                (this.momentSequence + 1n) & MomentSnowflakeSequenceMask;
        } else {
            this.lastMomentTimestamp = timestamp;
            this.momentSequence = 0n;
        }

        return ((timestamp - MomentSnowflakeEpochInMs) << 12n) |
            this.momentSequence;
    }

    private async pushMomentCreate(
        actor: IMomentUser,
        moment: IMomentMoment,
        visibleUserIds: string[]
    ): Promise<void> {
        const receiverIds = visibleUserIds.filter(userId => userId !== actor.id);
        if (receiverIds.length === 0) {
            return;
        }

        const payload: IMomentRealtimePayload = {
            noticeType: MomentCreateNoticeType,
            senderUserId: this.displayUserId(actor),
            momentId: moment.id.toString(),
            receiveUserIds: receiverIds,
            avatar: this.pickAvatar(actor),
            action: 'createMoment',
        };

        await Promise.all(
            receiverIds.map(receiverId =>
                this.realtimeService.pushMoment(
                    receiverId,
                    payload,
                    moment.id.toString()
                )
            )
        );
    }

    private async pushMomentInteraction(
        actor: IMomentUser,
        moment: IMomentMoment,
        action: string,
        interactionId: bigint
    ): Promise<void> {
        if (moment.userId === actor.id) {
            return;
        }

        const payload: IMomentRealtimePayload = {
            noticeType: MomentInteractionNoticeType,
            senderUserId: this.displayUserId(actor),
            momentId: moment.id.toString(),
            receiveUserIds: [moment.userId],
            avatar: this.pickAvatar(actor),
            action,
            interactionId: interactionId.toString(),
        };

        await this.realtimeService.pushMoment(
            moment.userId,
            payload,
            moment.id.toString()
        );
    }

    private mapMoment(moment: IMomentMoment): MomentTimelineItemResponseDto {
        return {
            momentId: moment.id.toString(),
            userId: this.displayUserId(moment.user),
            userName: this.displayUserName(moment.user),
            avatar: this.pickAvatar(moment.user),
            text: moment.text,
            mediaUrls: this.mapMediaUrls(moment.mediaUrls),
            likes: [],
            comments: [],
            createTime: moment.createdAt,
            updateTime: moment.updatedAt,
            deleteTime: moment.deletedAt,
        };
    }

    private mapLike(like: IMomentLike): MomentLikeResponseDto {
        return {
            likeId: like.id.toString(),
            momentId: like.momentId.toString(),
            userId: this.displayUserId(like.user),
            userName: this.displayUserName(like.user),
            userAvatar: this.pickAvatar(like.user),
        };
    }

    private mapComment(comment: IMomentComment): MomentCommentResponseDto {
        return {
            momentId: comment.momentId.toString(),
            commentId: comment.id.toString(),
            userId: this.displayUserId(comment.user),
            userName: this.displayUserName(comment.user),
            parentCommentId: comment.parentCommentId?.toString() ?? null,
            comment: comment.content,
            createTime: comment.createdAt,
            updateTime: comment.updatedAt,
        };
    }

    private mapMediaUrls(mediaUrls: Prisma.JsonValue): string[] {
        if (!Array.isArray(mediaUrls)) {
            return [];
        }

        return mediaUrls.filter(
            (mediaUrl): mediaUrl is string => typeof mediaUrl === 'string'
        );
    }

    private displayUserId(user: Pick<IMomentUser, 'id' | 'legacyId'>): string {
        return user.legacyId?.toString() ?? user.id;
    }

    private displayUserName(user: Pick<IMomentUser, 'name' | 'username'>): string {
        return user.name ?? user.username;
    }

    private pickAvatar(user: Pick<IMomentUser, 'avatar' | 'photo'>): string | null {
        const photo = user.photo;
        if (
            typeof photo === 'object' &&
            photo !== null &&
            !Array.isArray(photo) &&
            typeof photo.completedUrl === 'string'
        ) {
            return user.avatar ?? photo.completedUrl;
        }

        return user.avatar;
    }
}
