import { StorageUserController } from '@modules/storage/controllers/storage.user.controller';
import { StorageModule } from '@modules/storage/storage.module';
import { UserLegacyCommonController } from '@modules/user/controllers/user.legacy-common.controller';
import { UserLegacyController } from '@modules/user/controllers/user.legacy.controller';
import { UserUserController } from '@modules/user/controllers/user.user.controller';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';

/**
 * Mounts controllers for the authenticated end-user scope.
 */
@Module({
    controllers: [
        UserUserController,
        UserLegacyController,
        UserLegacyCommonController,
        StorageUserController,
    ],
    providers: [],
    exports: [],
    imports: [UserModule, StorageModule],
})
export class RoutesUserModule {}
