import { Response } from '@common/response/decorators/response.decorator';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import { StorageUploadUrlRequestDto } from '@modules/storage/dtos/request/storage.upload-url.request.dto';
import { StorageUploadUrlResponseDto } from '@modules/storage/dtos/response/storage.upload-url.response.dto';
import { StorageService } from '@modules/storage/services/storage.service';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('modules.user.storage')
@Controller({
    version: '1',
    path: '/common',
})
export class StorageUserController {
    constructor(private readonly storageService: StorageService) {}

    @Response('storage.uploadUrl')
    @HttpCode(HttpStatus.OK)
    @Post('/uploadUrl')
    async uploadUrl(
        @Body() body: StorageUploadUrlRequestDto
    ): Promise<IResponseReturn<StorageUploadUrlResponseDto>> {
        return this.storageService.uploadUrl(body);
    }
}
