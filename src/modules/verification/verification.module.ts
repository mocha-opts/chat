import { Module } from '@nestjs/common';
import { VerificationRepository } from '@modules/verification/repositories/verification.repository';
import { VerificationService } from '@modules/verification/services/verification.service';

@Module({
    imports: [],
    exports: [VerificationService, VerificationRepository],
    providers: [VerificationService, VerificationRepository],
    controllers: [],
})
export class VerificationModule {}
