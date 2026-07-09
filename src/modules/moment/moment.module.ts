import { MomentRepository } from '@modules/moment/repositories/moment.repository';
import { MomentService } from '@modules/moment/services/moment.service';
import { RealtimeModule } from '@modules/realtime/realtime.module';
import { Module } from '@nestjs/common';

@Module({
    imports: [RealtimeModule],
    exports: [MomentService],
    providers: [MomentRepository, MomentService],
    controllers: [],
})
export class MomentModule {}
