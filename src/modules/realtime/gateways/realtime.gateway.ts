import { RealtimeWebSocketPath } from '@modules/realtime/constants/realtime.constant';
import { RealtimeService } from '@modules/realtime/services/realtime.service';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { IncomingMessage } from 'http';
import { WebSocket } from 'ws';

@WebSocketGateway({
    path: RealtimeWebSocketPath,
})
export class RealtimeGateway
    implements OnGatewayConnection<WebSocket>, OnGatewayDisconnect<WebSocket>
{
    private readonly logger = new Logger(RealtimeGateway.name);

    constructor(private readonly realtimeService: RealtimeService) {}

    async handleConnection(
        client: WebSocket,
        request: IncomingMessage
    ): Promise<void> {
        const accepted = await this.realtimeService.handleConnection(
            client,
            request
        );
        if (!accepted) {
            return;
        }

        client.on('message', raw => {
            void this.realtimeService
                .handleMessage(client, raw)
                .catch((err: unknown) => this.handleClientError(client, err));
        });
        client.on('error', err => this.handleClientError(client, err));
    }

    async handleDisconnect(client: WebSocket): Promise<void> {
        await this.realtimeService.handleDisconnect(client);
    }

    private handleClientError(client: WebSocket, err: unknown): void {
        this.logger.error(err, 'Realtime client error');
        void this.realtimeService.handleDisconnect(client);

        if (client.readyState === WebSocket.OPEN) {
            client.close(1011, 'Internal error');
        }
    }
}
