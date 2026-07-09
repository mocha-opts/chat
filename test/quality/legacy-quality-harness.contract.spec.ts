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
];

const RequiredEndpoints: IQualityEndpointExpectation[] = [
    { method: 'POST', path: '/api/v1/user/common/sendMail' },
    { method: 'POST', path: '/api/v1/user/register' },
    { method: 'POST', path: '/api/v1/user/login' },
    { method: 'POST', path: '/api/v1/user/loginCode' },
    { method: 'PATCH', path: '/api/v1/user/avatar' },
    { method: 'GET', path: '/api/v1/contact/${userId}/user' },
    { method: 'POST', path: '/api/v1/contact/${auth.userId}/friend/${receiverId}' },
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
    'INFINITECHAT_KAFKA_BROKERS',
    'INFINITECHAT_PERF_SCENARIOS',
    'INFINITECHAT_PERF_ITERATIONS',
    'INFINITECHAT_PERF_CONCURRENCY',
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
