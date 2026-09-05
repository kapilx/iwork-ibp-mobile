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
import { serviceNames, MICROSOFT_OAUTH } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';
import { ENV } from '../../../../service-lib/src/lib/environment';
import { getAccessTokenExpiry } from '../token.constants';
import axios from 'axios';

@Injectable()
export class MsOAuthService {
    private readonly logger: ReturnType<typeof createLogger>;

    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
        private readonly traceIdService: TraceIdService,
    ) {
        this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
    }

    /**
     * Exchange Microsoft authorization code for user info via Graph API.
     */
    async exchangeCodeForUserInfo(code: string): Promise<{
        email: string;
        msId: string;
        accessToken: string;
        firstName?: string;
        lastName?: string;
    }> {
        try {
            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'success',
                    location: 'MsOAuthService',
                    method: 'exchangeCodeForUserInfo',
                    payload: { redirect_uri: ENV.MS_CALLBACK_URL, code_length: code?.length },
                    messageData: 'Attempting to exchange code for token',
                }),
            });

            const params = new URLSearchParams({
                code,
                client_id: ENV.MS_CLIENT_ID,
                client_secret: ENV.MS_CLIENT_SECRET,
                redirect_uri: ENV.MS_CALLBACK_URL,
                grant_type: MICROSOFT_OAUTH.GRANT_TYPE,
                scope: 'openid email profile User.Read',
            });

            const tokenResponse = await axios.post(
                MICROSOFT_OAUTH.TOKEN_ENDPOINT(ENV.MS_TENANT_ID || 'common'),
                params.toString(),
                { headers: { 'Content-Type': MICROSOFT_OAUTH.CONTENT_TYPE_URLENCODED } },
            );

            const accessToken = tokenResponse.data.access_token;

            const userInfoResponse = await axios.get(MICROSOFT_OAUTH.USERINFO_ENDPOINT, {
                headers: { Authorization: `${MICROSOFT_OAUTH.BEARER_PREFIX} ${accessToken}` },
            });

            const userInfo = userInfoResponse.data;

            // Microsoft Graph returns `mail` for work accounts; `userPrincipalName` as fallback
            const email = userInfo.mail || userInfo.userPrincipalName;

            if (!email) {
                throw new UnauthorizedException('Email not provided by Microsoft');
            }

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'success',
                    location: 'MsOAuthService',
                    method: 'exchangeCodeForUserInfo',
                    payload: { email },
                    messageData: 'Successfully exchanged code for user info',
                }),
            });

            return {
                email,
                msId: userInfo.id,
                accessToken,
                firstName: userInfo.givenName,
                lastName: userInfo.surname,
            };
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'failure',
                    location: 'MsOAuthService',
                    method: 'exchangeCodeForUserInfo',
                    messageData: {
                        error: error.response?.data || error.message,
                        status: error.response?.status,
                        redirect_uri_used: ENV.MS_CALLBACK_URL,
                    },
                }),
            });
            throw new UnauthorizedException('Failed to exchange Microsoft authorization code');
        }
    }

    /**
     * Validates the Microsoft user against the local DB and generates JWT tokens.
     */
    async validateMsUser(msUser: {
        email: string;
        msId: string;
        accessToken: string;
        firstName?: string;
        lastName?: string;
    }): Promise<{ accessToken: string; refreshToken: string }> {
        this.logger.log({
            level: 'info',
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: 'success',
                location: 'MsOAuthService',
                method: 'validateMsUser',
                payload: { email: msUser.email },
                messageData: 'Validating Microsoft user',
            }),
        });

        try {
            const user = await this.userRepository.findByLoginNameOrEmail(msUser.email);

            if (!user) {
                throw new NotFoundException(
                    'User not found. Please contact administrator to create your account.',
                );
            }

            if (user.isActive === false) {
                throw new ForbiddenException('User account is deactivated');
            }

            if (user.emailId?.toLowerCase() !== msUser.email.toLowerCase()) {
                throw new UnauthorizedException('Email mismatch');
            }

            const tokens = await this.getTokens(user as User);

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId: user.userId,
                    status: 'success',
                    location: 'MsOAuthService',
                    method: 'validateMsUser',
                    payload: { email: msUser.email },
                    messageData: 'Microsoft user validated successfully',
                }),
            });

            return tokens;
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'failure',
                    location: 'MsOAuthService',
                    method: 'validateMsUser',
                    payload: { email: msUser.email },
                    messageData: error,
                }),
            });
            throw error;
        }
    }

    private async getTokens(
        userDetails: User,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        if (!userDetails?.userId) {
            throw new ForbiddenException('Invalid user details');
        }

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

        const accessToken = await this.jwtService.signAsync(payload, {
            expiresIn: getAccessTokenExpiry(),
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: ENV.JWT_REFRESH_EXPIRATION,
        });

        return { accessToken, refreshToken };
    }
}
