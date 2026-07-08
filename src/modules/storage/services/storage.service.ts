import { AwsServiceUnavailableException } from '@common/aws/exceptions/aws.service-unavailable.exception';
import { IAwsS3Presign } from '@common/aws/interfaces/aws.interface';
import { AwsS3Service } from '@common/aws/services/aws.s3.service';
import { HelperService } from '@common/helper/services/helper.service';
import { IResponseReturn } from '@common/response/interfaces/response.interface';
import { StorageUploadUrlRequestDto } from '@modules/storage/dtos/request/storage.upload-url.request.dto';
import { StorageUploadUrlResponseDto } from '@modules/storage/dtos/response/storage.upload-url.response.dto';
import { IStorageService } from '@modules/storage/interfaces/storage.service.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StorageService implements IStorageService {
    constructor(
        private readonly awsS3Service: AwsS3Service,
        private readonly helperService: HelperService
    ) {}

    async uploadUrl({
        fileName,
    }: StorageUploadUrlRequestDto): Promise<
        IResponseReturn<StorageUploadUrlResponseDto>
    > {
        const key = this.createLegacyUploadKey(fileName);
        const presign: IAwsS3Presign | null =
            await this.awsS3Service.presignPutItem(
                {
                    key,
                    size: 0,
                },
                {
                    forceUpdate: true,
                }
            );
        if (!presign) {
            throw new AwsServiceUnavailableException();
        }

        const mapped = this.awsS3Service.mapPresign({
            key,
            size: 0,
        });

        return {
            data: {
                uploadUrl: presign.presignUrl,
                downloadUrl: mapped.completedUrl,
            },
        };
    }

    private createLegacyUploadKey(fileName: string): string {
        const filename = fileName.split(/[\\/]/).pop() ?? 'file';
        const normalized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const safeName = normalized.length > 0 ? normalized : 'file';
        const random = this.helperService.randomString(24).toLowerCase();

        return `legacy/uploads/${random}-${safeName}`;
    }
}
