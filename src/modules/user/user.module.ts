import { Module } from '@nestjs/common';
import { UserService } from '@modules/user/services/user.service';
import { AwsModule } from '@common/aws/aws.module';
import { PasswordHistoryModule } from '@modules/password-history/password-history.module';
import { UserRepository } from '@modules/user/repositories/user.repository';
import { UserUtil } from '@modules/user/utils/user.util';
import { CountryModule } from '@modules/country/country.module';
import { VerificationModule } from '@modules/verification/verification.module';

/** Exports user service, repository, and util; controllers are wired through the router. */
@Module({
    imports: [PasswordHistoryModule, AwsModule, CountryModule, VerificationModule],
    exports: [UserService, UserRepository, UserUtil],
    providers: [UserService, UserRepository, UserUtil],
    controllers: [],
})
export class UserModule {}
