import { Module, DynamicModule, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MsOAuthController } from './ms-oauth.controller';
import { MsOAuthService } from './ms-oauth.service';
import { UserRepository } from '../simple-auth/simple-auth.repository';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { User } from '../../../../service-lib/src/lib/entities/user';
import { ENV } from '../../../../service-lib/src/lib/environment';
import { getAccessTokenExpiry } from '../token.constants';

@Module({})
export class MsOAuthModule {
    private static readonly logger = new Logger(MsOAuthModule.name);

    static forRoot(): DynamicModule {
        const isMsOAuthEnabled = !!(
            ENV.MS_CLIENT_ID &&
            ENV.MS_CLIENT_SECRET &&
            ENV.MS_CALLBACK_URL
        );

        if (!isMsOAuthEnabled) {
            MsOAuthModule.logger.warn(
                'Microsoft OAuth credentials not found in environment. Microsoft OAuth module will be disabled.',
            );
        } else {
            MsOAuthModule.logger.log('Microsoft OAuth is enabled');
        }

        return {
            module: MsOAuthModule,
            imports: [
                TypeOrmModule.forFeature([User]),
                JwtModule.register({
                    secret: ENV.JWT_SECRET,
                    signOptions: { expiresIn: getAccessTokenExpiry() },
                }),
            ],
            controllers: isMsOAuthEnabled ? [MsOAuthController] : [],
            providers: isMsOAuthEnabled
                ? [MsOAuthService, UserRepository, TraceIdService]
                : [MsOAuthService, UserRepository, TraceIdService],
            exports: [MsOAuthService],
        };
    }
}
