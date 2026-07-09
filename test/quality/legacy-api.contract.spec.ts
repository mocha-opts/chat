import { readFileSync } from 'fs';
import { join } from 'path';

interface ILegacyRouteExpectation {
    method: 'DELETE' | 'GET' | 'PATCH' | 'POST';
    docPath: string;
    sourcePath: string;
    decoratorPath: string;
    protected: boolean;
}

const LegacyRouteExpectations: ILegacyRouteExpectation[] = [
    {
        method: 'POST',
        docPath: '/api/v1/user/register',
        sourcePath: 'src/modules/user/controllers/user.legacy.controller.ts',
        decoratorPath: '/register',
        protected: false,
    },
    {
        method: 'POST',
        docPath: '/api/v1/user/login',
        sourcePath: 'src/modules/user/controllers/user.legacy.controller.ts',
        decoratorPath: '/login',
        protected: false,
    },
    {
        method: 'POST',
        docPath: '/api/v1/user/loginCode',
        sourcePath: 'src/modules/user/controllers/user.legacy.controller.ts',
        decoratorPath: '/loginCode',
        protected: false,
    },
    {
        method: 'PATCH',
        docPath: '/api/v1/user/avatar',
        sourcePath: 'src/modules/user/controllers/user.legacy.controller.ts',
        decoratorPath: '/avatar',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/user/common/sendMail',
        sourcePath:
            'src/modules/user/controllers/user.legacy-common.controller.ts',
        decoratorPath: '/sendMail',
        protected: false,
    },
    {
        method: 'POST',
        docPath: '/api/v1/user/common/check',
        sourcePath:
            'src/modules/user/controllers/user.legacy-common.controller.ts',
        decoratorPath: '/check',
        protected: false,
    },
    {
        method: 'POST',
        docPath: '/api/v1/user/common/uploadUrl',
        sourcePath: 'src/modules/storage/controllers/storage.user.controller.ts',
        decoratorPath: '/uploadUrl',
        protected: false,
    },
    {
        method: 'GET',
        docPath: '/api/v1/contact/{userId}/user',
        sourcePath:
            'src/modules/contact/controllers/contact.legacy.controller.ts',
        decoratorPath: '/:userUuid/user',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/contact/{userId}/friend/{receiverId}',
        sourcePath:
            'src/modules/contact/controllers/contact.legacy.controller.ts',
        decoratorPath: '/:userUuid/friend/:receiverUuid',
        protected: true,
    },
    {
        method: 'GET',
        docPath: '/api/v1/contact/{userId}/friend/{friendId}',
        sourcePath:
            'src/modules/contact/controllers/contact.legacy.controller.ts',
        decoratorPath: '/:userUuid/friend/:friendUuid',
        protected: true,
    },
    {
        method: 'GET',
        docPath: '/api/v1/contact/{userId}/applyCount',
        sourcePath:
            'src/modules/contact/controllers/contact.legacy.controller.ts',
        decoratorPath: '/:userUuid/applyCount',
        protected: true,
    },
    {
        method: 'GET',
        docPath: '/api/v1/contact/{userId}/apply',
        sourcePath:
            'src/modules/contact/controllers/contact.legacy.controller.ts',
        decoratorPath: '/:userUuid/apply',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/contact/{userId}/application/{status}',
        sourcePath:
            'src/modules/contact/controllers/contact.legacy.controller.ts',
        decoratorPath: '/:userUuid/application/:status',
        protected: true,
    },
    {
        method: 'DELETE',
        docPath: '/api/v1/contact/{userId}/friend/{receiverId}',
        sourcePath:
            'src/modules/contact/controllers/contact.legacy.controller.ts',
        decoratorPath: '/:userUuid/friend/:receiverUuid',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/contact/{userId}/block/{receiverId}',
        sourcePath:
            'src/modules/contact/controllers/contact.legacy.controller.ts',
        decoratorPath: '/:userUuid/block/:receiverUuid',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/contact/groups',
        sourcePath:
            'src/modules/conversation/controllers/conversation.legacy.controller.ts',
        decoratorPath: '/groups',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/contact/group/invite',
        sourcePath:
            'src/modules/conversation/controllers/conversation.legacy.controller.ts',
        decoratorPath: '/group/invite',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/contact/group/kick',
        sourcePath:
            'src/modules/conversation/controllers/conversation.legacy.controller.ts',
        decoratorPath: '/group/kick',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/contact/group/exit',
        sourcePath:
            'src/modules/conversation/controllers/conversation.legacy.controller.ts',
        decoratorPath: '/group/exit',
        protected: true,
    },
    {
        method: 'GET',
        docPath: '/api/v1/contact/group/{conversationId}/members',
        sourcePath:
            'src/modules/conversation/controllers/conversation.legacy.controller.ts',
        decoratorPath: '/group/:conversationId/members',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/contact/group/setAdmin',
        sourcePath:
            'src/modules/conversation/controllers/conversation.legacy.controller.ts',
        decoratorPath: '/group/setAdmin',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/chat/session',
        sourcePath:
            'src/modules/messaging/controllers/messaging.legacy.controller.ts',
        decoratorPath: '/session',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/chat/redPacket/send',
        sourcePath:
            'src/modules/red-packet/controllers/red-packet.legacy.controller.ts',
        decoratorPath: '/send',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/chat/redPacket/receive',
        sourcePath:
            'src/modules/red-packet/controllers/red-packet.legacy.controller.ts',
        decoratorPath: '/receive',
        protected: true,
    },
    {
        method: 'GET',
        docPath: '/api/v1/chat/redPacket/{redPacketId}',
        sourcePath:
            'src/modules/red-packet/controllers/red-packet.legacy.controller.ts',
        decoratorPath: '/:redPacketId',
        protected: true,
    },
    {
        method: 'GET',
        docPath: '/api/v1/offline/message',
        sourcePath:
            'src/modules/offline-message/controllers/offline-message.legacy.controller.ts',
        decoratorPath: '/message',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/moment',
        sourcePath:
            'src/modules/moment/controllers/moment.legacy.controller.ts',
        decoratorPath: '/',
        protected: true,
    },
    {
        method: 'DELETE',
        docPath: '/api/v1/moment/{momentId}',
        sourcePath:
            'src/modules/moment/controllers/moment.legacy.controller.ts',
        decoratorPath: '/:momentId',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/moment/like/{momentId}',
        sourcePath:
            'src/modules/moment/controllers/moment.legacy.controller.ts',
        decoratorPath: '/like/:momentId',
        protected: true,
    },
    {
        method: 'DELETE',
        docPath: '/api/v1/moment/like/{momentId}',
        sourcePath:
            'src/modules/moment/controllers/moment.legacy.controller.ts',
        decoratorPath: '/like/:momentId',
        protected: true,
    },
    {
        method: 'POST',
        docPath: '/api/v1/moment/comment/{momentId}',
        sourcePath:
            'src/modules/moment/controllers/moment.legacy.controller.ts',
        decoratorPath: '/comment/:momentId',
        protected: true,
    },
    {
        method: 'DELETE',
        docPath: '/api/v1/moment/comment/{momentId}',
        sourcePath:
            'src/modules/moment/controllers/moment.legacy.controller.ts',
        decoratorPath: '/comment/:momentId',
        protected: true,
    },
    {
        method: 'GET',
        docPath: '/api/v1/moment/list/{userId}',
        sourcePath:
            'src/modules/moment/controllers/moment.legacy.controller.ts',
        decoratorPath: '/list/:userId',
        protected: true,
    },
];

const readProjectFile = (path: string): string =>
    readFileSync(join(process.cwd(), path), 'utf8');

const escapeRegex = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const methodDecorator = (method: ILegacyRouteExpectation['method']): string =>
    `${method.charAt(0)}${method.slice(1).toLowerCase()}`;

describe('legacy API compatibility contract', () => {
    const legacyApiDoc = readProjectFile('docs/legacy-api.md');
    const realtimeConstant = readProjectFile(
        'src/modules/realtime/constants/realtime.constant.ts'
    );

    it.each(LegacyRouteExpectations)(
        '$method $docPath is documented and implemented',
        route => {
            expect(legacyApiDoc).toContain(
                `| ${route.method} | \`${route.docPath}\` |`
            );

            const source = readProjectFile(route.sourcePath);
            const decorator = methodDecorator(route.method);
            const routePattern = new RegExp(
                `@${decorator}\\(\\s*['"\`]${escapeRegex(
                    route.decoratorPath
                )}['"\`]\\s*\\)`
            );

            expect(source).toMatch(routePattern);
            expect(source).toContain('@Response(');

            if (route.protected) {
                expect(source).toContain('@UserProtected()');
                expect(source).toContain('@AuthJwtAccessProtected()');
            }
        }
    );

    it('documents and implements the legacy websocket path', () => {
        expect(legacyApiDoc).toContain('| WS | `/api/v1/netty` |');
        expect(realtimeConstant).toContain(
            "RealtimeWebSocketPath = '/api/v1/netty'"
        );
    });
});
