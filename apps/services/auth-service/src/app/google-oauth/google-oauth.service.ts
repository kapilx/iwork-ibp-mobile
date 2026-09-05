import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../simple-auth/simple-auth.repository';
import { User } from '../../../../service-lib/src/lib/entities/user';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { serviceNames, GOOGLE_OAUTH } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';
import { errorMessages } from '../../../../../../libs/service-lib/src/lib/messages';
import { ENV } from '../../../../service-lib/src/lib/environment';
import { getAccessTokenExpiry } from '../token.constants';
import axios from 'axios';

@Injectable()
export class GoogleOAuthService {
    private readonly logger: ReturnType<typeof createLogger>;

    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
        private readonly traceIdService: TraceIdService
    ) {
        this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
    }

    /**
     * Exchange authorization code for Google user info
     * This method handles the OAuth code exchange manually (without Passport)
     */
    async exchangeCodeForUserInfo(code: string): Promise<{
        email: string;
        googleId: string;
        accessToken: string;
        firstName?: string;
        lastName?: string;
    }> {
        try {
            // Log the redirect URI being used for debugging
            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'success',
                    location: 'GoogleOAuthService',
                    method: 'exchangeCodeForUserInfo',
                    payload: {
                        redirect_uri: ENV.GOOGLE_CALLBACK_URL,
                        code_length: code?.length
                    },
                    messageData: 'Attempting to exchange code for token',
                }),
            });

            // Step 1: Exchange code for access token
            const params = new URLSearchParams({
                code,
                client_id: ENV.GOOGLE_CLIENT_ID,
                client_secret: ENV.GOOGLE_CLIENT_SECRET,
                redirect_uri: ENV.GOOGLE_CALLBACK_URL,
                grant_type: GOOGLE_OAUTH.GRANT_TYPE,
            });

            const tokenResponse = await axios.post(
                GOOGLE_OAUTH.TOKEN_ENDPOINT,
                params.toString(),
                {
                    headers: {
                        'Content-Type': GOOGLE_OAUTH.CONTENT_TYPE_URLENCODED,
                    },
                }
            );

            const accessToken = tokenResponse.data.access_token;

            // Step 2: Use access token to get user info
            const userInfoResponse = await axios.get(GOOGLE_OAUTH.USERINFO_ENDPOINT, {
                headers: {
                    Authorization: `${GOOGLE_OAUTH.BEARER_PREFIX} ${accessToken}`,
                },
            });

            const userInfo = userInfoResponse.data;

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'success',
                    location: 'GoogleOAuthService',
                    method: 'exchangeCodeForUserInfo',
                    payload: { email: userInfo.email },
                    messageData: 'Successfully exchanged code for user info',
                }),
            });

            return {
                email: userInfo.email,
                googleId: userInfo.id,
                accessToken,
                firstName: userInfo.given_name,
                lastName: userInfo.family_name,
            };
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'failure',
                    location: 'GoogleOAuthService',
                    method: 'exchangeCodeForUserInfo',
                    messageData: {
                        error: error.response?.data || error.message,
                        status: error.response?.status,
                        redirect_uri_used: ENV.GOOGLE_CALLBACK_URL,
                    },
                }),
            });
            throw new UnauthorizedException('Failed to exchange authorization code');
        }
    }

    /**
     * Validates Google OAuth user and generates JWT tokens
     * Security: Verifies Google token, checks user exists in DB, generates secure JWT
     * @param googleUser - User data from Google OAuth
     * @returns JWT tokens
     */
    async validateGoogleUser(googleUser: {
        email: string;
        googleId: string;
        accessToken: string;
        firstName?: string;
        lastName?: string;
    }): Promise<{ accessToken: string; refreshToken: string }> {
        this.logger.log({
            level: 'info',
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: 'success',
                location: 'GoogleOAuthService',
                method: 'validateGoogleUser',
                payload: { email: googleUser.email },
                messageData: 'Validating Google user',
            }),
        });

        try {
            // Security: Verify the Google access token is valid by calling Google's API
            await this.verifyGoogleToken(googleUser.accessToken, googleUser.email);

            // Security: Find user by email in our database
            const user = await this.userRepository.findByLoginNameOrEmail(
                googleUser.email
            );

            if (!user) {
                this.logger.warn({
                    level: 'warn',
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: 'failure',
                        location: 'GoogleOAuthService',
                        method: 'validateGoogleUser',
                        payload: { email: googleUser.email },
                        messageData: 'User not found in database',
                    }),
                });
                throw new NotFoundException(
                    'User not found. Please contact administrator to create your account.'
                );
            }

            // Security: Check if user account is active
            if (user.isActive === false) {
                throw new ForbiddenException('User account is deactivated');
            }

            // Security: Verify email matches
            if (user.emailId?.toLowerCase() !== googleUser.email.toLowerCase()) {
                throw new UnauthorizedException('Email mismatch');
            }

            // Generate JWT tokens (reusing existing secure token generation)
            const tokens = await this.getTokens(user as User);

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId: user.userId,
                    status: 'success',
                    location: 'GoogleOAuthService',
                    method: 'validateGoogleUser',
                    payload: { email: googleUser.email },
                    messageData: 'Google user validated successfully',
                }),
            });

            return tokens;
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'failure',
                    location: 'GoogleOAuthService',
                    method: 'validateGoogleUser',
                    payload: { email: googleUser.email },
                    messageData: error,
                }),
            });
            throw error;
        }
    }

    /**
     * Security: Verify Google access token with Google's API
     * This prevents token forgery and ensures the token is valid
     */
    private async verifyGoogleToken(
        accessToken: string,
        expectedEmail: string
    ): Promise<void> {
        try {
            // Call Google's tokeninfo endpoint to verify the token
            const response = await axios.get(
                `${GOOGLE_OAUTH.TOKENINFO_ENDPOINT}?access_token=${accessToken}`
            );

            // Verify token is valid
            if (!response.data) {
                throw new UnauthorizedException('Invalid Google token');
            }

            // Security: Verify the token belongs to our app
            if (response.data.audience !== ENV.GOOGLE_CLIENT_ID) {
                throw new UnauthorizedException('Token audience mismatch');
            }

            // Security: Verify email matches
            if (response.data.email?.toLowerCase() !== expectedEmail.toLowerCase()) {
                throw new UnauthorizedException('Token email mismatch');
            }

            // Security: Check if email is verified
            if (response.data.verified_email !== 'true' && response.data.verified_email !== true) {
                throw new UnauthorizedException('Email not verified by Google');
            }

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'success',
                    location: 'GoogleOAuthService',
                    method: 'verifyGoogleToken',
                    payload: { email: expectedEmail },
                    messageData: 'Google token verified successfully',
                }),
            });
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'failure',
                    location: 'GoogleOAuthService',
                    method: 'verifyGoogleToken',
                    payload: { email: expectedEmail },
                    messageData: error,
                }),
            });
            throw new UnauthorizedException('Failed to verify Google token');
        }
    }

    /**
     * Generates secure JWT access and refresh tokens
     * Reuses the existing token generation logic for consistency
     */
    private async getTokens(
        userDetails: User
    ): Promise<{ accessToken: string; refreshToken: string }> {
        this.logger.log({
            level: 'info',
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                userId: userDetails?.userId,
                status: 'success',
                location: 'GoogleOAuthService',
                method: 'getTokens',
                payload: { userId: userDetails?.userId },
                messageData: 'Generating tokens',
            }),
        });

        try {
            // Security: Validate user details
            if (!userDetails || !userDetails.userId) {
                throw new ForbiddenException('Invalid user details');
            }

            // Prepare secure payload
            const payload = {
                userDetails: {
                    departmentId: userDetails.departmentId,
                    emailId: userDetails.emailId,
                    userId: userDetails.userId,
                    iirmId: userDetails.iirmEmpId,
                    roles: userDetails?.roles,
                    organisationId: userDetails?.organisationId,
                },
            };

            // Generate access token
            const accessToken = await this.jwtService.signAsync(payload, {
                expiresIn: getAccessTokenExpiry(),
            });

            // Generate refresh token
            const refreshToken = await this.jwtService.signAsync(payload, {
                expiresIn: ENV.JWT_REFRESH_EXPIRATION,
            });

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId: userDetails.userId,
                    status: 'success',
                    location: 'GoogleOAuthService',
                    method: 'getTokens',
                    payload: { userId: userDetails.userId },
                    messageData: 'Tokens generated successfully',
                }),
            });

            return { accessToken, refreshToken };
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId: userDetails?.userId,
                    status: 'failure',
                    location: 'GoogleOAuthService',
                    method: 'getTokens',
                    payload: { userId: userDetails?.userId },
                    messageData: error,
                }),
            });
            throw new ForbiddenException('Failed to generate tokens');
        }
    }
}
