export const RealtimeWebSocketPath = '/api/v1/netty';
export const RealtimeRouteKeyPrefix = 'user:session';
export const RealtimeRouteTtlInMs = 15 * 60 * 1000;
export const RealtimeAckTimeoutInMs = 5 * 1000;
export const RealtimeAckMaxRetryCount = 3;
export const RealtimeAckScanIntervalInMs = 5 * 1000;
export const RealtimeAckScanLimit = 100;
export const RealtimePendingAckKeyPrefix = 'realtime:pending-ack';
export const RealtimePendingAckUserKeyPrefix = 'realtime:pending-ack:user';
export const RealtimePendingAckDueKey = 'realtime:pending-ack:due';
export const RealtimePendingAckTtlInMs =
    RealtimeAckTimeoutInMs * (RealtimeAckMaxRetryCount + 2);
