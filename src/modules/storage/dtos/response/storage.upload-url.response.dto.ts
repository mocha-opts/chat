import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class StorageUploadUrlResponseDto {
    @ApiProperty({
        required: true,
        example: 'https://example.com/upload',
    })
    @Expose()
    uploadUrl: string;

    @ApiProperty({
        required: true,
        example: 'https://example.com/file.png',
    })
    @Expose()
    downloadUrl: string;
}
