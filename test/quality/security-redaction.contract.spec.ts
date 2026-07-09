import { LoggerSensitiveFields } from '@common/logger/constants/logger.constant';
import { readFileSync } from 'fs';
import { join } from 'path';

const RequiredSensitiveFields = [
    'password',
    'newPassword',
    'oldPassword',
    'code',
    'verificationCode',
    'otpCode',
    'twoFactorCode',
    'backupCode',
    'token',
    'authorization',
    'x-api-key',
    'apiKey',
    'refreshToken',
    'accessToken',
    'privateKey',
    'secretKey',
    'amount',
    'balance',
    'beforeBalance',
    'afterBalance',
    'totalAmount',
    'remainingAmount',
    'redPacketAmount',
];

const LegacyServices = [
    'AuthenticationService',
    'ContactService',
    'GateWay',
    'MessagingService',
    'MomentService',
    'OfflineDataStoreService',
    'RealTimeCommunicationService',
];

const readProjectFile = (path: string): string =>
    readFileSync(join(process.cwd(), path), 'utf8');

describe('security redaction contract', () => {
    it('redacts credentials, verification codes, tokens, and balance context', () => {
        const sensitiveFields = new Set(
            LoggerSensitiveFields.map(field => field.toLowerCase())
        );

        for (const field of RequiredSensitiveFields) {
            expect(sensitiveFields.has(field.toLowerCase())).toBe(true);
        }
    });

    it('records every legacy service config audit without exposing values', () => {
        const securityAudit = readProjectFile('docs/security-audit.md');

        for (const service of LegacyServices) {
            expect(securityAudit).toContain(`\`${service}\``);
        }

        expect(securityAudit).toContain('需要轮换');
        expect(securityAudit).not.toMatch(/password:\s+\S+/i);
        expect(securityAudit).not.toMatch(/secret:\s+\S+/i);
        expect(securityAudit).not.toMatch(/token:\s+\S+/i);
    });
});
