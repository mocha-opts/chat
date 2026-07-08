import { AwsModule } from '@common/aws/aws.module';
import { Module } from '@nestjs/common';
import { StorageService } from '@modules/storage/services/storage.service';

@Module({
    imports: [AwsModule],
    exports: [StorageService],
    providers: [StorageService],
    controllers: [],
})
export class StorageModule {}
