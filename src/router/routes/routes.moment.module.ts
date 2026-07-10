import { MomentLegacyController } from '@modules/moment/controllers/moment.legacy.controller';
import { MomentModule } from '@modules/moment/moment.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';

@Module({
    controllers: [MomentLegacyController],
    providers: [],
    exports: [],
    imports: [MomentModule, UserModule],
})
export class RoutesMomentModule {}
