import { MessagingOutboxRetryIntervalInMs } from '@modules/messaging/constants/messaging.constant';
import { MessagingOutboxService } from '@modules/messaging/services/messaging.outbox.service';
import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';

@Injectable()
export class MessagingOutboxProcessor implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MessagingOutboxProcessor.name);
    private timer: NodeJS.Timeout | null = null;

    constructor(private readonly messagingOutboxService: MessagingOutboxService) {}

    onModuleInit(): void {
        this.timer = setInterval(() => {
            void this.messagingOutboxService
                .retryUnsent()
                .catch((err: unknown) =>
                    this.logger.error(err, 'Kafka outbox retry failed')
                );
        }, MessagingOutboxRetryIntervalInMs);
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
