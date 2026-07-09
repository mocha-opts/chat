import packageJson from '@package';
import { readFileSync } from 'fs';
import { join } from 'path';

interface IQualityEndpointExpectation {
    method: string;
    path: string;
}

const QualityScripts = [
    'quality:legacy:e2e',
    'quality:legacy:realtime',
    'quality:legacy:perf',
    'quality:legacy:full',
];

const RequiredEndpoints: IQualityEndpointExpectation[] = [
    { method: 'POST', path: '/api/v1/user/common/sendMail' },
    { method: 'POST', path: '/api/v1/user/register' },
    { method: 'POST', path: '/api/v1/user/login' },
    { method: 'POST', path: '/api/v1/user/loginCode' },
    { method: 'PATCH', path: '/api/v1/user/avatar' },
    { method: 'GET', path: '/api/v1/contact/${userId}/user' },
    {
        method: 'POST',
        path: '/api/v1/contact/${auth.userId}/friend/${receiverId}',
    },
    { method: 'POST', path: '/api/v1/contact/groups' },
    { method: 'GET', path: '/api/v1/contact/group/${sessionId}/members' },
    { method: 'POST', path: '/api/v1/chat/session' },
    { method: 'POST', path: '/api/v1/chat/redPacket/send' },
    { method: 'POST', path: '/api/v1/chat/redPacket/receive' },
    { method: 'GET', path: '/api/v1/offline/message' },
    { method: 'POST', path: '/api/v1/moment' },
];

const RequiredEnvNames = [
    'INFINITECHAT_E2E',
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
    'INFINITECHAT_E2E_OFFLINE_TIME',
    'INFINITECHAT_E2E_MOMENT_TEXT',
    'INFINITECHAT_KAFKA_BROKERS',
    'INFINITECHAT_PERF_SCENARIOS',
    'INFINITECHAT_PERF_ITERATIONS',
    'INFINITECHAT_PERF_CONCURRENCY',
    'INFINITECHAT_E2E_RED_PACKET_RECEIVER_PHONE',
    'INFINITECHAT_E2E_RED_PACKET_RECEIVER_PASSWORD',
];

const readProjectFile = (path: string): string =>
    readFileSync(join(process.cwd(), path), 'utf8');

describe('legacy quality harness contract', () => {
    const script = readProjectFile('scripts/quality/legacy-quality.ts');
    const qualityDoc = readProjectFile('docs/quality.md');

    it('exposes the expected package scripts', () => {
        const scripts = packageJson.scripts as Record<string, string>;

        for (const scriptName of QualityScripts) {
            expect(scripts[scriptName]).toContain(
                'scripts/quality/legacy-quality.ts'
            );
        }
    });

    it.each(RequiredEndpoints)(
        'covers $method $path in the HTTP smoke harness',
        endpoint => {
            expect(script).toContain(`'${endpoint.method}'`);
            expect(script).toContain(endpoint.path);
        }
    );

    it('covers websocket heartbeat and Kafka topic checks', () => {
        expect(script).toContain('/api/v1/netty');
        expect(script).toContain('quality-heartbeat');
        expect(script).toContain('im.message.persist');
        expect(script).toContain('im.realtime.push');
        expect(script).toContain('im.dead-letter');
    });

    it('provides a strict full quality probe', () => {
        const scripts = packageJson.scripts as Record<string, string>;

        expect(scripts['quality:legacy:full']).toContain('full-strict');
        expect(script).toContain("'full-strict'");
        expect(script).toContain('validateFullRunEnvironment');
        expect(script).toContain('Missing full quality probe env vars');
        expect(script).toContain('INFINITECHAT_E2E_RED_PACKET_RECEIVER_PHONE');
        expect(script).toContain(
            'INFINITECHAT_E2E_RED_PACKET_RECEIVER_PASSWORD'
        );
        expect(script).toContain('INFINITECHAT_PERF_SCENARIOS must include');
        expect(qualityDoc).toContain('quality:legacy:full');
    });

    it('documents required live-run environment variables', () => {
        for (const envName of RequiredEnvNames) {
            expect(script).toContain(envName);
            expect(qualityDoc).toContain(envName);
        }
    });

    it('keeps live probes opt-in only', () => {
        expect(script).toContain("INFINITECHAT_E2E') !== '1'");
        expect(qualityDoc).toContain('INFINITECHAT_E2E=1');
    });
});
