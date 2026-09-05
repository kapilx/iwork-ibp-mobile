import { Module, DynamicModule, Logger } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleOAuthController } from './google-oauth.controller';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleOAuthStrategy } from './google-oauth.strategy';
import { UserRepository } from '../simple-auth/simple-auth.repository';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { User } from '../../../../service-lib/src/lib/entities/user';
import { ENV } from '../../../../service-lib/src/lib/environment';
import { getAccessTokenExpiry } from '../token.constants';

@Module({})
export class GoogleOAuthModule {
    private static readonly logger = new Logger(GoogleOAuthModule.name);

    static forRoot(): DynamicModule {
        const isGoogleOAuthEnabled = !!(
            ENV.GOOGLE_CLIENT_ID &&
            ENV.GOOGLE_CLIENT_SECRET &&
            ENV.GOOGLE_CALLBACK_URL
        );

        if (!isGoogleOAuthEnabled) {
            GoogleOAuthModule.logger.warn(
                'Google OAuth credentials not found in environment. Google OAuth module will be disabled.'
            );
        } else {
            GoogleOAuthModule.logger.log('Google OAuth is enabled');
        }

        return {
            module: GoogleOAuthModule,
            imports: [
                TypeOrmModule.forFeature([User]),
                PassportModule.register({ defaultStrategy: 'google' }),
                JwtModule.register({
                    secret: ENV.JWT_SECRET,
                    signOptions: {
                        expiresIn: getAccessTokenExpiry(),
                    },
                }),
            ],
            controllers: isGoogleOAuthEnabled ? [GoogleOAuthController] : [],
            providers: isGoogleOAuthEnabled
                ? [GoogleOAuthService, GoogleOAuthStrategy, UserRepository, TraceIdService]
                : [GoogleOAuthService, UserRepository, TraceIdService],
            exports: [GoogleOAuthService],
        };
    }
}
