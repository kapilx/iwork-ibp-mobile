import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ENV } from '../../../../service-lib/src/lib/environment';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
    private readonly logger: ReturnType<typeof createLogger>;
    private static readonly staticLogger = new Logger(GoogleOAuthStrategy.name);

    constructor(private readonly traceIdService: TraceIdService) {
        // Check if Google OAuth credentials are configured(this dummy declaration is just to avoid initialization errors)
        // TODO: Update this code on portal configuration when required for google Oauth
        if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET || !ENV.GOOGLE_CALLBACK_URL) {
            GoogleOAuthStrategy.staticLogger.warn(
                'Google OAuth credentials not configured. Google OAuth will be disabled.'
            );
            // Initialize with dummy values to prevent errors
            super({
                clientID: 'dummy',
                clientSecret: 'dummy',
                callbackURL: 'http://localhost:3000/auth/google/callback',
                scope: ['email', 'profile'],
            });
            this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
            return;
        }

        super({
            clientID: ENV.GOOGLE_CLIENT_ID,
            clientSecret: ENV.GOOGLE_CLIENT_SECRET,
            callbackURL: ENV.GOOGLE_CALLBACK_URL,
            scope: ['email', 'profile'],
            // Security: Enable state parameter for CSRF protection
            state: true,
            // Security: Only request necessary permissions
            accessType: 'offline',
            // Security: Prompt for consent to ensure user awareness
            prompt: 'select_account',
        });
        this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback
    ): Promise<any> {
        // Check if OAuth is properly configured
        if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET || !ENV.GOOGLE_CALLBACK_URL) {
            GoogleOAuthStrategy.staticLogger.error('Google OAuth is not configured');
            done(new UnauthorizedException('Google OAuth is not configured'), false);
            return;
        }

        this.logger.log({
            level: 'info',
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: 'success',
                location: 'GoogleOAuthStrategy',
                method: 'validate',
                payload: { profileId: profile.id },
                messageData: 'Google OAuth validation started',
            }),
        });

        try {
            // Security: Verify that profile exists
            if (!profile) {
                throw new UnauthorizedException('Invalid Google profile');
            }

            // Security: Verify email exists and is verified
            const email = profile.emails?.[0]?.value;
            const isEmailVerified = profile.emails?.[0]?.verified;

            if (!email) {
                throw new UnauthorizedException('Email not provided by Google');
            }

            // Security: Only allow verified emails
            if (!isEmailVerified) {
                this.logger.warn({
                    level: 'warn',
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: 'failure',
                        location: 'GoogleOAuthStrategy',
                        method: 'validate',
                        payload: { email },
                        messageData: 'Unverified email attempted login',
                    }),
                });
                throw new UnauthorizedException('Email must be verified with Google');
            }

            const user = {
                email,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                picture: profile.photos?.[0]?.value,
                googleId: profile.id,
                accessToken,
            };

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'success',
                    location: 'GoogleOAuthStrategy',
                    method: 'validate',
                    payload: { email },
                    messageData: 'Google OAuth validation successful',
                }),
            });

            done(null, user);
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'failure',
                    location: 'GoogleOAuthStrategy',
                    method: 'validate',
                    messageData: error,
                }),
            });
            done(error, false);
        }
    }
}
