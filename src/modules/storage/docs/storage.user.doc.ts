import {
    Doc,
    DocRequest,
    DocResponse,
} from '@common/doc/decorators/doc.decorator';
import { EnumDocRequestBodyType } from '@common/doc/enums/doc.enum';
import { StorageUploadUrlRequestDto } from '@modules/storage/dtos/request/storage.upload-url.request.dto';
import { StorageUploadUrlResponseDto } from '@modules/storage/dtos/response/storage.upload-url.response.dto';
import { applyDecorators } from '@nestjs/common';

export function StorageUserUploadUrlDoc(): MethodDecorator {
    return applyDecorators(
        Doc({
            summary: 'Legacy upload presign URL',
        }),
        DocRequest({
            bodyType: EnumDocRequestBodyType.json,
            dto: StorageUploadUrlRequestDto,
        }),
        DocResponse('storage.uploadUrl', {
            dto: StorageUploadUrlResponseDto,
        })
    );
}
