import { IResponseReturn } from '@common/response/interfaces/response.interface';
import { StorageUploadUrlRequestDto } from '@modules/storage/dtos/request/storage.upload-url.request.dto';
import { StorageUploadUrlResponseDto } from '@modules/storage/dtos/response/storage.upload-url.response.dto';

export interface IStorageService {
    uploadUrl(
        body: StorageUploadUrlRequestDto
    ): Promise<IResponseReturn<StorageUploadUrlResponseDto>>;
}
