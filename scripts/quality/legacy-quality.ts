import { Kafka, logLevel } from 'kafkajs';
import WebSocket from 'ws';

type IHttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST';
type ILegacyQualityMode =
    | 'full-strict'
    | 'http-smoke'
    | 'perf'
    | 'realtime-kafka-smoke';
type IJsonRecord = Record<string, unknown>;

interface IHttpRequestOptions {
    body?: IJsonRecord;
    query?: Record<string, string>;
    token?: string | null;
}

interface IHttpResponseEnvelope<TData> {
    statusCode?: number;
    message?: unknown;
    data?: TData;
    metadata?: unknown;
}

interface ILegacyAuthData extends IJsonRecord {
    userId: string;
    userName: string;
    token: string;
}

interface IMessageData extends IJsonRecord {
    messageId: string;
    body: IJsonRecord;
}

interface IGroupData extends IJsonRecord {
    sessionId: string;
}

interface IScenarioResult {
    name: string;
    count: number;
    min: number;
    max: number;
    avg: number;
    p95: number;
}

class LegacyQualityRunner {
    private token: string | null = null;

    async run(mode: ILegacyQualityMode): Promise<void> {
        this.ensureEnabled();

        switch (mode) {
            case 'full-strict':
                this.validateFullRunEnvironment();
                await this.runHttpSmoke();
                await this.runRealtimeKafkaSmoke();
                await this.runPerformanceProbe();
                this.printResult('legacy full quality probe completed');
                return;
            case 'http-smoke':
                await this.runHttpSmoke();
                return;
            case 'realtime-kafka-smoke':
                await this.runRealtimeKafkaSmoke();
                return;
            case 'perf':
                await this.runPerformanceProbe();
                return;
        }
    }

    private async runHttpSmoke(): Promise<void> {
        await this.maybeSendMail();
        await this.maybeRegister();
        const auth = await this.passwordLogin();

        await this.maybeLoginCode();
        await this.maybeUpdateAvatar(auth);
        await this.maybeSearchUser();
        await this.maybeAddFriend(auth);
        const groupSessionId = await this.maybeCreateGroup(auth);
        await this.maybeReadGroupMembers(groupSessionId);
        const message = await this.maybeSendMessage(auth);
        await this.maybeSendRedPacket(auth);
        await this.maybeReadOfflineMessages(auth);
        await this.maybeCreateMoment(auth);

        this.printResult(
            `legacy http smoke completed${message ? ` with message ${message.messageId}` : ''}`
        );
    }

    private async runRealtimeKafkaSmoke(): Promise<void> {
        const auth = await this.passwordLogin();

        await this.checkWebSocket(auth);
        await this.checkKafkaTopics();
        this.printResult('legacy realtime and Kafka smoke completed');
    }

    private async runPerformanceProbe(): Promise<void> {
        const auth = await this.passwordLogin();
        const scenarios = this.optionalEnv('INFINITECHAT_PERF_SCENARIOS')
            .split(',')
            .map(value => value.trim())
            .filter(Boolean);
        const selected =
            scenarios.length > 0 ? scenarios : ['message', 'offline'];
        const results: IScenarioResult[] = [];

        for (const scenario of selected) {
            if (scenario === 'message') {
                results.push(
                    await this.measure('message', () => this.sendMessage(auth))
                );
            } else if (scenario === 'offline') {
                results.push(
                    await this.measure('offline', () =>
                        this.readOfflineMessages(auth)
                    )
                );
            } else if (scenario === 'redPacket') {
                results.push(
                    await this.measure('redPacket', () =>
                        this.sendRedPacket(auth)
                    )
                );
            } else {
                throw new Error(`Unsupported performance scenario ${scenario}`);
            }
        }

        for (const result of results) {
            this.printResult(
                `${result.name}: count=${result.count} min=${result.min}ms max=${result.max}ms avg=${result.avg}ms p95=${result.p95}ms`
            );
        }
    }

    private async maybeSendMail(): Promise<void> {
        const email = this.optionalEnv('INFINITECHAT_E2E_EMAIL');
        const phone = this.optionalEnv('INFINITECHAT_E2E_PHONE');
        if (!email || !phone) {
            this.printSkip(
                'sendMail',
                'INFINITECHAT_E2E_EMAIL or phone missing'
            );
            return;
        }

        await this.request('POST', '/api/v1/user/common/sendMail', {
            body: { email, phone },
        });
        this.printResult('sendMail accepted');
    }

    private async maybeRegister(): Promise<void> {
        const phone = this.optionalEnv('INFINITECHAT_E2E_REGISTER_PHONE');
        const password = this.optionalEnv('INFINITECHAT_E2E_REGISTER_PASSWORD');
        const code = this.optionalEnv('INFINITECHAT_E2E_REGISTER_CODE');
        if (!phone || !password || !code) {
            this.printSkip(
                'register',
                'INFINITECHAT_E2E_REGISTER_PHONE, password, or code missing'
            );
            return;
        }

        await this.request('POST', '/api/v1/user/register', {
            body: { phone, password, code },
        });
        this.printResult('register accepted');
    }

    private async passwordLogin(): Promise<ILegacyAuthData> {
        const phone = this.requiredEnv('INFINITECHAT_E2E_PHONE');
        const password = this.requiredEnv('INFINITECHAT_E2E_PASSWORD');
        const envelope = await this.request<ILegacyAuthData>(
            'POST',
            '/api/v1/user/login',
            {
                body: { phone, password },
            }
        );
        const data = this.requireData(envelope, 'login');

        this.token = data.token;
        this.printResult(`password login accepted for ${data.userId}`);

        return data;
    }

    private async maybeLoginCode(): Promise<void> {
        const phone = this.optionalEnv('INFINITECHAT_E2E_LOGIN_CODE_PHONE');
        const code = this.optionalEnv('INFINITECHAT_E2E_LOGIN_CODE');
        if (!phone || !code) {
            this.printSkip(
                'loginCode',
                'INFINITECHAT_E2E_LOGIN_CODE_PHONE or code missing'
            );
            return;
        }

        const envelope = await this.request<ILegacyAuthData>(
            'POST',
            '/api/v1/user/loginCode',
            {
                body: { phone, code },
            }
        );
        const data = this.requireData(envelope, 'loginCode');

        this.token = data.token;
        this.printResult(`loginCode accepted for ${data.userId}`);
    }

    private async maybeUpdateAvatar(auth: ILegacyAuthData): Promise<void> {
        const avatarUrl = this.optionalEnv('INFINITECHAT_E2E_AVATAR_URL');
        if (!avatarUrl) {
            this.printSkip('avatar', 'INFINITECHAT_E2E_AVATAR_URL missing');
            return;
        }

        await this.request('PATCH', '/api/v1/user/avatar', {
            body: { avatarUrl },
            token: auth.token,
        });
        this.printResult('avatar update accepted');
    }

    private async maybeSearchUser(): Promise<void> {
        const userId = this.optionalEnv('INFINITECHAT_E2E_USER_ID');
        const phone = this.optionalEnv('INFINITECHAT_E2E_SEARCH_PHONE');
        if (!userId || !phone) {
            this.printSkip(
                'searchUser',
                'INFINITECHAT_E2E_USER_ID or search phone missing'
            );
            return;
        }

        await this.request('GET', `/api/v1/contact/${userId}/user`, {
            query: { phone },
            token: this.token,
        });
        this.printResult('user search accepted');
    }

    private async maybeAddFriend(auth: ILegacyAuthData): Promise<void> {
        const receiverId = this.optionalEnv('INFINITECHAT_E2E_FRIEND_USER_ID');
        if (!receiverId) {
            this.printSkip(
                'addFriend',
                'INFINITECHAT_E2E_FRIEND_USER_ID missing'
            );
            return;
        }

        await this.request(
            'POST',
            `/api/v1/contact/${auth.userId}/friend/${receiverId}`,
            {
                body: {
                    msg: 'quality smoke request',
                },
                token: auth.token,
            }
        );
        this.printResult('friend application accepted');
    }

    private async maybeCreateGroup(
        auth: ILegacyAuthData
    ): Promise<string | null> {
        const memberIds = this.listEnv('INFINITECHAT_E2E_GROUP_MEMBER_IDS');
        if (memberIds.length === 0) {
            this.printSkip(
                'createGroup',
                'INFINITECHAT_E2E_GROUP_MEMBER_IDS missing'
            );
            return null;
        }

        const envelope = await this.request<IGroupData>(
            'POST',
            '/api/v1/contact/groups',
            {
                body: {
                    creatorId: auth.userId,
                    memberIds,
                },
                token: auth.token,
            }
        );
        const data = this.requireData(envelope, 'createGroup');

        this.printResult(`group create accepted for ${data.sessionId}`);
        return data.sessionId;
    }

    private async maybeReadGroupMembers(
        createdGroupSessionId: string | null
    ): Promise<void> {
        const sessionId =
            createdGroupSessionId ??
            this.optionalEnv('INFINITECHAT_E2E_GROUP_SESSION_ID');
        if (!sessionId) {
            this.printSkip(
                'groupMembers',
                'created group or INFINITECHAT_E2E_GROUP_SESSION_ID missing'
            );
            return;
        }

        await this.request(
            'GET',
            `/api/v1/contact/group/${sessionId}/members`,
            {
                token: this.token,
            }
        );
        this.printResult('group members accepted');
    }

    private async maybeSendMessage(
        auth: ILegacyAuthData
    ): Promise<IMessageData | null> {
        if (!this.optionalEnv('INFINITECHAT_E2E_SESSION_ID')) {
            this.printSkip(
                'sendMessage',
                'INFINITECHAT_E2E_SESSION_ID missing'
            );
            return null;
        }

        return this.sendMessage(auth);
    }

    private async sendMessage(auth: ILegacyAuthData): Promise<IMessageData> {
        const sessionId = this.requiredEnv('INFINITECHAT_E2E_SESSION_ID');
        const receiverId = this.optionalEnv(
            'INFINITECHAT_E2E_RECEIVER_USER_ID'
        );
        const envelope = await this.request<IMessageData>(
            'POST',
            '/api/v1/chat/session',
            {
                body: {
                    sessionId,
                    sendUserId: auth.userId,
                    ...(receiverId && { receiveUserId: receiverId }),
                    sessionType: Number(
                        this.optionalEnv('INFINITECHAT_E2E_SESSION_TYPE') || '1'
                    ),
                    type: 1,
                    body: {
                        content: `quality smoke ${Date.now()}`,
                    },
                },
                token: auth.token,
            }
        );
        const data = this.requireData(envelope, 'sendMessage');

        this.printResult(`message send accepted for ${data.messageId}`);
        return data;
    }

    private async maybeSendRedPacket(auth: ILegacyAuthData): Promise<void> {
        if (!this.optionalEnv('INFINITECHAT_E2E_RED_PACKET_AMOUNT')) {
            this.printSkip(
                'redPacket',
                'INFINITECHAT_E2E_RED_PACKET_AMOUNT missing'
            );
            return;
        }

        await this.sendRedPacket(auth);
    }

    private async sendRedPacket(auth: ILegacyAuthData): Promise<IMessageData> {
        const sessionId = this.requiredEnv('INFINITECHAT_E2E_SESSION_ID');
        const receiverId = this.optionalEnv(
            'INFINITECHAT_E2E_RECEIVER_USER_ID'
        );
        const envelope = await this.request<IMessageData>(
            'POST',
            '/api/v1/chat/redPacket/send',
            {
                body: {
                    sessionId,
                    sendUserId: auth.userId,
                    ...(receiverId && { receiveUserId: receiverId }),
                    type: 5,
                    sessionType: Number(
                        this.optionalEnv('INFINITECHAT_E2E_SESSION_TYPE') || '1'
                    ),
                    body: {
                        redPacketType: 2,
                        totalAmount: this.requiredEnv(
                            'INFINITECHAT_E2E_RED_PACKET_AMOUNT'
                        ),
                        totalCount: Number(
                            this.optionalEnv(
                                'INFINITECHAT_E2E_RED_PACKET_COUNT'
                            ) || '1'
                        ),
                        redPacketWrapperText: 'quality smoke',
                    },
                },
                token: auth.token,
            }
        );
        const data = this.requireData(envelope, 'sendRedPacket');

        this.printResult(
            `red packet send accepted for message ${data.messageId}`
        );
        await this.maybeReceiveRedPacket(auth, data);

        return data;
    }

    private async maybeReceiveRedPacket(
        auth: ILegacyAuthData,
        message: IMessageData
    ): Promise<void> {
        const redPacketId = this.extractString(message.body, 'redPacketId');
        if (!redPacketId) {
            this.printSkip(
                'receiveRedPacket',
                'redPacketId missing from response'
            );
            return;
        }
        const receiverAuth = await this.maybeCreateRedPacketReceiverAuth();
        const receiveUserId = receiverAuth?.userId ?? auth.userId;
        const receiveToken = receiverAuth?.token ?? auth.token;

        await this.request('POST', '/api/v1/chat/redPacket/receive', {
            body: {
                userId: receiveUserId,
                redPacketId,
            },
            token: receiveToken,
        });
        this.printResult('red packet receive accepted');
    }

    private async maybeCreateRedPacketReceiverAuth(): Promise<ILegacyAuthData | null> {
        const phone = this.optionalEnv(
            'INFINITECHAT_E2E_RED_PACKET_RECEIVER_PHONE'
        );
        const password = this.optionalEnv(
            'INFINITECHAT_E2E_RED_PACKET_RECEIVER_PASSWORD'
        );
        if (!phone || !password) {
            return null;
        }

        const envelope = await this.request<ILegacyAuthData>(
            'POST',
            '/api/v1/user/login',
            {
                body: { phone, password },
                token: null,
            }
        );

        return this.requireData(envelope, 'redPacketReceiverLogin');
    }

    private async maybeReadOfflineMessages(
        auth: ILegacyAuthData
    ): Promise<void> {
        if (!this.optionalEnv('INFINITECHAT_E2E_OFFLINE_TIME')) {
            this.printSkip(
                'offlineMessages',
                'INFINITECHAT_E2E_OFFLINE_TIME missing'
            );
            return;
        }

        await this.readOfflineMessages(auth);
    }

    private async readOfflineMessages(auth: ILegacyAuthData): Promise<void> {
        await this.request('GET', '/api/v1/offline/message', {
            query: {
                userId: auth.userId,
                time:
                    this.optionalEnv('INFINITECHAT_E2E_OFFLINE_TIME') ||
                    '1970-01-01 00:00:00',
            },
            token: auth.token,
        });
        this.printResult('offline message list accepted');
    }

    private async maybeCreateMoment(auth: ILegacyAuthData): Promise<void> {
        const text = this.optionalEnv('INFINITECHAT_E2E_MOMENT_TEXT');
        if (!text) {
            this.printSkip('moment', 'INFINITECHAT_E2E_MOMENT_TEXT missing');
            return;
        }

        await this.request('POST', '/api/v1/moment', {
            body: {
                userId: auth.userId,
                text,
                mediaUrls: this.listEnv('INFINITECHAT_E2E_MOMENT_MEDIA_URLS'),
            },
            token: auth.token,
        });
        this.printResult('moment create accepted');
    }

    private async checkWebSocket(auth: ILegacyAuthData): Promise<void> {
        const url = this.createWebSocketUrl(auth);

        await new Promise<void>((resolve, reject) => {
            const socket = new WebSocket(url);
            const timer = setTimeout(() => {
                socket.close(1000, 'quality timeout');
                reject(new Error('WebSocket heartbeat timeout'));
            }, this.timeoutInMs());

            socket.on('open', () => {
                socket.send(
                    JSON.stringify({
                        type: 5,
                        msgUuid: 'quality-heartbeat',
                        data: {
                            source: 'legacy-quality',
                        },
                    })
                );
            });
            socket.on('message', data => {
                const text = data.toString();
                if (text.includes('quality-heartbeat') || text.includes('ok')) {
                    clearTimeout(timer);
                    socket.close(1000, 'quality done');
                    resolve();
                }
            });
            socket.on('error', error => {
                clearTimeout(timer);
                reject(error);
            });
        });

        this.printResult('websocket heartbeat accepted');
    }

    private async checkKafkaTopics(): Promise<void> {
        const brokers = this.listEnv('INFINITECHAT_KAFKA_BROKERS');
        if (brokers.length === 0) {
            this.printSkip('kafkaTopics', 'INFINITECHAT_KAFKA_BROKERS missing');
            return;
        }

        const kafka = new Kafka({
            clientId: 'infinite-chat-quality-smoke',
            brokers,
            logLevel: logLevel.NOTHING,
        });
        const admin = kafka.admin();

        await admin.connect();
        try {
            const topics = await admin.listTopics();
            const requiredTopics = [
                'im.message.persist',
                'im.realtime.push',
                'im.dead-letter',
            ];
            const missing = requiredTopics.filter(
                topic => !topics.includes(topic)
            );
            if (missing.length > 0) {
                throw new Error(`Missing Kafka topics: ${missing.join(', ')}`);
            }
        } finally {
            await admin.disconnect();
        }

        this.printResult('Kafka topics accepted');
    }

    private async measure(
        name: string,
        action: () => Promise<unknown>
    ): Promise<IScenarioResult> {
        const iterations = this.positiveIntEnv(
            'INFINITECHAT_PERF_ITERATIONS',
            10
        );
        const concurrency = this.positiveIntEnv(
            'INFINITECHAT_PERF_CONCURRENCY',
            2
        );
        const durations: number[] = [];
        let nextIndex = 0;

        const worker = async (): Promise<void> => {
            for (;;) {
                const current = nextIndex;
                nextIndex += 1;
                if (current >= iterations) {
                    return;
                }

                const startedAt = Date.now();
                await action();
                durations.push(Date.now() - startedAt);
            }
        };

        await Promise.all(
            Array.from({ length: Math.min(concurrency, iterations) }, () =>
                worker()
            )
        );

        const sorted = durations.toSorted((left, right) => left - right);
        const total = sorted.reduce((sum, value) => sum + value, 0);
        const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);

        return {
            name,
            count: sorted.length,
            min: sorted[0] ?? 0,
            max: sorted.at(-1) ?? 0,
            avg: Math.round(total / sorted.length),
            p95: sorted[p95Index] ?? 0,
        };
    }

    private async request<TData>(
        method: IHttpMethod,
        path: string,
        options: IHttpRequestOptions = {}
    ): Promise<IHttpResponseEnvelope<TData>> {
        const url = new URL(path, this.baseUrl());
        for (const [key, value] of Object.entries(options.query ?? {})) {
            url.searchParams.set(key, value);
        }

        const headers: Record<string, string> = {
            accept: 'application/json',
        };
        const token = options.token ?? this.token;
        if (token) {
            headers.authorization = this.toAuthorization(token);
        }
        if (options.body) {
            headers['content-type'] = 'application/json';
        }

        const response = await fetch(url, {
            method,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });
        const text = await response.text();
        const parsed = text ? this.parseJson(text) : {};

        if (!response.ok) {
            throw new Error(
                `${method} ${path} failed with ${response.status}: ${this.safeMessage(parsed)}`
            );
        }

        return parsed as IHttpResponseEnvelope<TData>;
    }

    private createWebSocketUrl(auth: ILegacyAuthData): string {
        const url = new URL('/api/v1/netty', this.baseUrl());
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        url.searchParams.set('token', auth.token);
        url.searchParams.set('userId', auth.userId);
        return url.toString();
    }

    private ensureEnabled(): void {
        if (this.optionalEnv('INFINITECHAT_E2E') !== '1') {
            throw new Error(
                'Set INFINITECHAT_E2E=1 to run live InfiniteChat quality probes.'
            );
        }
    }

    private validateFullRunEnvironment(): void {
        const required = [
            'INFINITECHAT_BASE_URL',
            'INFINITECHAT_E2E_PHONE',
            'INFINITECHAT_E2E_PASSWORD',
            'INFINITECHAT_E2E_EMAIL',
            'INFINITECHAT_E2E_REGISTER_PHONE',
            'INFINITECHAT_E2E_REGISTER_PASSWORD',
            'INFINITECHAT_E2E_REGISTER_CODE',
            'INFINITECHAT_E2E_LOGIN_CODE_PHONE',
            'INFINITECHAT_E2E_LOGIN_CODE',
            'INFINITECHAT_E2E_AVATAR_URL',
            'INFINITECHAT_E2E_USER_ID',
            'INFINITECHAT_E2E_SEARCH_PHONE',
            'INFINITECHAT_E2E_FRIEND_USER_ID',
            'INFINITECHAT_E2E_GROUP_MEMBER_IDS',
            'INFINITECHAT_E2E_SESSION_ID',
            'INFINITECHAT_E2E_RECEIVER_USER_ID',
            'INFINITECHAT_E2E_SESSION_TYPE',
            'INFINITECHAT_E2E_RED_PACKET_AMOUNT',
            'INFINITECHAT_E2E_RED_PACKET_RECEIVER_PHONE',
            'INFINITECHAT_E2E_RED_PACKET_RECEIVER_PASSWORD',
            'INFINITECHAT_E2E_OFFLINE_TIME',
            'INFINITECHAT_E2E_MOMENT_TEXT',
            'INFINITECHAT_KAFKA_BROKERS',
            'INFINITECHAT_PERF_SCENARIOS',
            'INFINITECHAT_PERF_ITERATIONS',
            'INFINITECHAT_PERF_CONCURRENCY',
        ];
        const missing = required.filter(name => !this.optionalEnv(name));
        if (missing.length > 0) {
            throw new Error(
                `Missing full quality probe env vars: ${missing.join(', ')}`
            );
        }

        const perfScenarios = new Set(
            this.listEnv('INFINITECHAT_PERF_SCENARIOS')
        );
        const missingScenarios = ['message', 'offline', 'redPacket'].filter(
            scenario => !perfScenarios.has(scenario)
        );
        if (missingScenarios.length > 0) {
            throw new Error(
                `INFINITECHAT_PERF_SCENARIOS must include ${missingScenarios.join(
                    ', '
                )}`
            );
        }
    }

    private baseUrl(): string {
        return this.requiredEnv('INFINITECHAT_BASE_URL').replace(/\/+$/, '');
    }

    private timeoutInMs(): number {
        return this.positiveIntEnv('INFINITECHAT_E2E_TIMEOUT_MS', 5000);
    }

    private positiveIntEnv(name: string, fallback: number): number {
        const raw = this.optionalEnv(name);
        if (!raw) {
            return fallback;
        }

        const parsed = Number(raw);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error(`${name} must be a positive integer`);
        }

        return parsed;
    }

    private requiredEnv(name: string): string {
        const value = this.optionalEnv(name);
        if (!value) {
            throw new Error(`${name} is required`);
        }

        return value;
    }

    private optionalEnv(name: string): string {
        return process.env[name]?.trim() ?? '';
    }

    private listEnv(name: string): string[] {
        return this.optionalEnv(name)
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
    }

    private requireData<TData>(
        envelope: IHttpResponseEnvelope<TData>,
        step: string
    ): TData {
        if (envelope.data === undefined || envelope.data === null) {
            throw new Error(`${step} response data is empty`);
        }

        return envelope.data;
    }

    private extractString(record: IJsonRecord, key: string): string | null {
        const value = record[key];
        return typeof value === 'string' && value.trim() ? value : null;
    }

    private toAuthorization(token: string): string {
        return token.toLowerCase().startsWith('bearer ')
            ? token
            : `Bearer ${token}`;
    }

    private parseJson(text: string): unknown {
        try {
            return JSON.parse(text) as unknown;
        } catch {
            throw new Error('Response body is not valid JSON');
        }
    }

    private safeMessage(parsed: unknown): string {
        if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'message' in parsed
        ) {
            return String((parsed as { message: unknown }).message);
        }

        return 'no response message';
    }

    private printResult(message: string): void {
        console.log(`[quality] ${message}`);
    }

    private printSkip(step: string, reason: string): void {
        console.log(`[quality] skipped ${step}: ${reason}`);
    }
}

const mode = process.argv[2] as ILegacyQualityMode | undefined;
const allowedModes: ILegacyQualityMode[] = [
    'full-strict',
    'http-smoke',
    'realtime-kafka-smoke',
    'perf',
];

if (!mode || !allowedModes.includes(mode)) {
    console.error(
        `Usage: ts-node scripts/quality/legacy-quality.ts ${allowedModes.join('|')}`
    );
    process.exit(1);
}

void new LegacyQualityRunner().run(mode).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[quality] failed: ${message}`);
    process.exit(1);
});
