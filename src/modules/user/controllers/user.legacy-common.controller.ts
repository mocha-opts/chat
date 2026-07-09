import { Response } from '@common/response/decorators/response.decorator';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import { VerificationCheckRequestDto } from '@modules/verification/dtos/request/verification.check.request.dto';
import { VerificationSendMailRequestDto } from '@modules/verification/dtos/request/verification.send-mail.request.dto';
import { VerificationStatusResponseDto } from '@modules/verification/dtos/response/verification.status.response.dto';
import {
    UserLegacyCheckVerificationDoc,
    UserLegacySendMailDoc,
} from '@modules/user/docs/user.legacy-common.doc';
import { UserService } from '@modules/user/services/user.service';
import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('modules.user.legacy-common')
@Controller({
    version: '1',
    path: '/common',
})
export class UserLegacyCommonController {
    constructor(private readonly userService: UserService) {}

    @UserLegacySendMailDoc()
    @Response('verification.sendMail')
    @HttpCode(HttpStatus.OK)
    @Post('/sendMail')
    async sendMail(
        @Body() body: VerificationSendMailRequestDto
    ): Promise<IResponseReturn<VerificationStatusResponseDto>> {
        return this.userService.legacySendMail(body);
    }

    @UserLegacyCheckVerificationDoc()
    @Response('verification.check')
    @HttpCode(HttpStatus.OK)
    @Post('/check')
    async check(
        @Query() query: VerificationCheckRequestDto
    ): Promise<IResponseReturn<VerificationStatusResponseDto>> {
        return this.userService.legacyCheckVerification(query);
    }
}
