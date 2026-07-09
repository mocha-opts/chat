import { Module } from '@nestjs/common';
import { RouterModule as NestJsRouterModule } from '@nestjs/core';
import { RoutesAdminModule } from '@routes/routes.admin.module';
import { RoutesContactModule } from '@routes/routes.contact.module';
import { RoutesChatModule } from '@routes/routes.chat.module';
import { RoutesOfflineModule } from '@routes/routes.offline.module';
import { RoutesPublicModule } from '@routes/routes.public.module';
import { RoutesSharedModule } from '@routes/routes.shared.module';
import { RoutesSystemModule } from '@routes/routes.system.module';
import { RoutesUserModule } from '@routes/routes.user.module';

/**
 * Root router that mounts the access-level route modules under their path prefixes
 * (`/public`, `/system`, `/admin`, `/user`, `/shared`).
 */
@Module({
    providers: [],
    exports: [],
    controllers: [],
    imports: [
        RoutesPublicModule,
        RoutesSystemModule,
        RoutesUserModule,
        RoutesAdminModule,
        RoutesContactModule,
        RoutesChatModule,
        RoutesOfflineModule,
        RoutesSharedModule,
        NestJsRouterModule.register([
            {
                path: '/public',
                module: RoutesPublicModule,
            },
            {
                path: '/system',
                module: RoutesSystemModule,
            },
            {
                path: '/admin',
                module: RoutesAdminModule,
            },
            {
                path: '/user',
                module: RoutesUserModule,
            },
            {
                path: '/contact',
                module: RoutesContactModule,
            },
            {
                path: '/chat',
                module: RoutesChatModule,
            },
            {
                path: '/offline',
                module: RoutesOfflineModule,
            },
            {
                path: '/shared',
                module: RoutesSharedModule,
            },
        ]),
    ],
})
export class RouterModule {}
