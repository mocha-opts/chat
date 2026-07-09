import { RedPacketExpireScanIntervalInMs } from '@modules/red-packet/constants/red-packet.constant';
import { RedPacketService } from '@modules/red-packet/services/red-packet.service';
import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';

@Injectable()
export class RedPacketExpireProcessor
    implements OnModuleInit, OnModuleDestroy
{
    private readonly logger = new Logger(RedPacketExpireProcessor.name);
    private timer: NodeJS.Timeout | null = null;

    constructor(private readonly redPacketService: RedPacketService) {}

    onModuleInit(): void {
        this.timer = setInterval(() => {
            void this.redPacketService
                .expireRedPackets()
                .catch((error: unknown) =>
                    this.logger.error(error, 'Red packet expire scan failed')
                );
        }, RedPacketExpireScanIntervalInMs);
        this.timer.unref();
    }

    onModuleDestroy(): void {
        if (!this.timer) {
            return;
        }

        clearInterval(this.timer);
        this.timer = null;
    }
}
