import { IResponseReturn } from '@common/response/interfaces/response.interface';
import { ContactAddFriendRequestDto } from '@modules/contact/dtos/request/contact.add-friend.request.dto';
import { ContactApplyListRequestDto } from '@modules/contact/dtos/request/contact.apply-list.request.dto';
import { ContactModifyApplicationRequestDto } from '@modules/contact/dtos/request/contact.modify-application.request.dto';
import {
    ContactApplicationResponseDto,
    ContactApplyCountResponseDto,
    ContactApplyListResponseDto,
    ContactMessageResponseDto,
    ContactUserResponseDto,
} from '@modules/contact/dtos/response/contact.legacy.response.dto';

export interface IContactService {
    searchUser(
        authUserId: string,
        userIdentifier: string,
        phone: string
    ): Promise<IResponseReturn<ContactUserResponseDto>>;

    addFriend(
        authUserId: string,
        userIdentifier: string,
        receiverIdentifier: string,
        body: ContactAddFriendRequestDto
    ): Promise<IResponseReturn<number>>;

    getFriendDetail(
        authUserId: string,
        userIdentifier: string,
        friendIdentifier: string
    ): Promise<IResponseReturn<ContactUserResponseDto>>;

    getUnreadApplyCount(
        authUserId: string,
        userIdentifier: string
    ): Promise<IResponseReturn<ContactApplyCountResponseDto>>;

    getApplyList(
        authUserId: string,
        userIdentifier: string,
        query: ContactApplyListRequestDto
    ): Promise<IResponseReturn<ContactApplyListResponseDto>>;

    modifyApplicationStatus(
        authUserId: string,
        userIdentifier: string,
        status: string,
        body: ContactModifyApplicationRequestDto
    ): Promise<IResponseReturn<ContactApplicationResponseDto | null>>;

    deleteFriend(
        authUserId: string,
        userIdentifier: string,
        receiverIdentifier: string
    ): Promise<IResponseReturn<ContactMessageResponseDto>>;

    blockFriend(
        authUserId: string,
        userIdentifier: string,
        receiverIdentifier: string
    ): Promise<IResponseReturn<ContactMessageResponseDto>>;
}
