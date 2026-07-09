import { Response } from '@common/response/decorators/response.decorator';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { ContactAddFriendRequestDto } from '@modules/contact/dtos/request/contact.add-friend.request.dto';
import { ContactApplyListRequestDto } from '@modules/contact/dtos/request/contact.apply-list.request.dto';
import { ContactModifyApplicationRequestDto } from '@modules/contact/dtos/request/contact.modify-application.request.dto';
import { ContactSearchUserRequestDto } from '@modules/contact/dtos/request/contact.search-user.request.dto';
import {
    ContactApplicationResponseDto,
    ContactApplyCountResponseDto,
    ContactApplyListResponseDto,
    ContactMessageResponseDto,
    ContactUserResponseDto,
} from '@modules/contact/dtos/response/contact.legacy.response.dto';
import {
    ContactLegacyAddFriendDoc,
    ContactLegacyApplyCountDoc,
    ContactLegacyApplyListDoc,
    ContactLegacyBlockFriendDoc,
    ContactLegacyDeleteFriendDoc,
    ContactLegacyFriendDetailDoc,
    ContactLegacyModifyApplicationDoc,
    ContactLegacySearchUserDoc,
} from '@modules/contact/docs/contact.legacy.doc';
import { ContactService } from '@modules/contact/services/contact.service';
import { UserProtected } from '@modules/user/decorators/user.decorator';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('modules.contact.legacy')
@Controller({
    version: '1',
    path: '/',
})
export class ContactLegacyController {
    constructor(private readonly contactService: ContactService) {}

    @ContactLegacySearchUserDoc()
    @Response('contact.searchUser')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Get('/:userUuid/user')
    async searchUser(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('userUuid') userUuid: string,
        @Query() query: ContactSearchUserRequestDto
    ): Promise<IResponseReturn<ContactUserResponseDto>> {
        return this.contactService.searchUser(
            authUserId,
            userUuid,
            query.phone
        );
    }

    @ContactLegacyAddFriendDoc()
    @Response('contact.addFriend')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Post('/:userUuid/friend/:receiverUuid')
    async addFriend(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('userUuid') userUuid: string,
        @Param('receiverUuid') receiverUuid: string,
        @Body() body: ContactAddFriendRequestDto
    ): Promise<IResponseReturn<number>> {
        return this.contactService.addFriend(
            authUserId,
            userUuid,
            receiverUuid,
            body
        );
    }

    @ContactLegacyFriendDetailDoc()
    @Response('contact.friendDetail')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Get('/:userUuid/friend/:friendUuid')
    async getFriendDetail(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('userUuid') userUuid: string,
        @Param('friendUuid') friendUuid: string
    ): Promise<IResponseReturn<ContactUserResponseDto>> {
        return this.contactService.getFriendDetail(
            authUserId,
            userUuid,
            friendUuid
        );
    }

    @ContactLegacyApplyCountDoc()
    @Response('contact.applyCount')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Get('/:userUuid/applyCount')
    async getUnreadApplyCount(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('userUuid') userUuid: string
    ): Promise<IResponseReturn<ContactApplyCountResponseDto>> {
        return this.contactService.getUnreadApplyCount(authUserId, userUuid);
    }

    @ContactLegacyApplyListDoc()
    @Response('contact.applyList')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Get('/:userUuid/apply')
    async getApplyList(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('userUuid') userUuid: string,
        @Query() query: ContactApplyListRequestDto
    ): Promise<IResponseReturn<ContactApplyListResponseDto>> {
        return this.contactService.getApplyList(authUserId, userUuid, query);
    }

    @ContactLegacyModifyApplicationDoc()
    @Response('contact.modifyApplication')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Post('/:userUuid/application/:status')
    async modifyApplicationStatus(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('userUuid') userUuid: string,
        @Param('status') status: string,
        @Body() body: ContactModifyApplicationRequestDto
    ): Promise<IResponseReturn<ContactApplicationResponseDto | null>> {
        return this.contactService.modifyApplicationStatus(
            authUserId,
            userUuid,
            status,
            body
        );
    }

    @ContactLegacyDeleteFriendDoc()
    @Response('contact.deleteFriend')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Delete('/:userUuid/friend/:receiverUuid')
    async deleteFriend(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('userUuid') userUuid: string,
        @Param('receiverUuid') receiverUuid: string
    ): Promise<IResponseReturn<ContactMessageResponseDto>> {
        return this.contactService.deleteFriend(
            authUserId,
            userUuid,
            receiverUuid
        );
    }

    @ContactLegacyBlockFriendDoc()
    @Response('contact.blockFriend')
    @UserProtected()
    @AuthJwtAccessProtected()
    @HttpCode(HttpStatus.OK)
    @Post('/:userUuid/block/:receiverUuid')
    async blockFriend(
        @AuthJwtPayload('userId') authUserId: string,
        @Param('userUuid') userUuid: string,
        @Param('receiverUuid') receiverUuid: string
    ): Promise<IResponseReturn<ContactMessageResponseDto>> {
        return this.contactService.blockFriend(
            authUserId,
            userUuid,
            receiverUuid
        );
    }
}
