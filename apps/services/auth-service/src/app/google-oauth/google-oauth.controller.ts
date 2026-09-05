import {
    Controller,
    Get,
    Req,
    Res,
    UseGuards,
    HttpStatus,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { GoogleOAuthService } from './google-oauth.service';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { serviceNames, GOOGLE_OAUTH, getOAuthSuccessHtml, getOAuthErrorHtml } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';
import { ENV } from '../../../../service-lib/src/lib/environment';

@ApiTags('Google OAuth')
@Controller('auth/google')
export class GoogleOAuthController {
    private readonly logger: ReturnType<typeof createLogger>;

    constructor(
        private readonly googleOAuthService: GoogleOAuthService,
        private readonly traceIdService: TraceIdService
    ) {
        this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
    }

    /**
     * Get Google OAuth URL for frontend to redirect to
     * This endpoint returns the OAuth URL as JSON instead of doing a server-side redirect
     * This allows it to work properly through API gateways
     */
    @Get('auth-url')
    @ApiOperation({ summary: 'Get Google OAuth URL' })
    @ApiResponse({ status: 200, description: 'Returns Google OAuth URL' })
    async getGoogleAuthUrl(): Promise<{ url: string }> {
        const clientId = ENV.GOOGLE_CLIENT_ID;
        const callbackUrl = ENV.GOOGLE_CALLBACK_URL;

        const authUrl = `${GOOGLE_OAUTH.AUTH_BASE_URL}?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
            `response_type=${GOOGLE_OAUTH.RESPONSE_TYPE}&` +
            `scope=${GOOGLE_OAUTH.SCOPE_ENCODED}&` +
            `access_type=${GOOGLE_OAUTH.ACCESS_TYPE}&` +
            `prompt=${GOOGLE_OAUTH.PROMPT}`;

        this.logger.log({
            level: 'info',
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: 'success',
                location: 'GoogleOAuthController',
                method: 'getGoogleAuthUrl',
                payload: { redirect_uri: callbackUrl },
                messageData: 'Google OAuth URL generated',
            }),
        });

        return { url: authUrl };
    }

    /**
     * Initiates Google OAuth flow
     * Security: Uses Passport Google strategy with state parameter for CSRF protection
     */
    @Get('login')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Initiate Google OAuth login' })
    @ApiResponse({ status: 302, description: 'Redirects to Google OAuth consent page' })
    async googleLogin(@Req() req: Request): Promise<void> {
        // This route is handled by Passport Guard
        // User will be redirected to Google's consent page
        this.logger.log({
            level: 'info',
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: 'success',
                location: 'GoogleOAuthController',
                method: 'googleLogin',
                messageData: 'Google OAuth login initiated',
            }),
        });
    }

    /**
     * Manual Google OAuth callback endpoint
     * Handles the OAuth callback without Passport guards (works through API gateway)
     * Exchanges authorization code for tokens and redirects to frontend
     */
    @Get('callback')
    @ApiOperation({ summary: 'Google OAuth callback endpoint' })
    @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
        const code = req.query.code as string;
        const error = req.query.error as string;

        this.logger.log({
            level: 'info',
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: 'success',
                location: 'GoogleOAuthController',
                method: 'googleCallback',
                payload: {
                    hasCode: !!code,
                    hasError: !!error,
                    queryParams: req.query,
                },
                messageData: 'Google OAuth callback received',
            }),
        });

        try {
            // Check if Google returned an error
            if (error) {
                throw new UnauthorizedException(`Google OAuth error: ${error}`);
            }

            // Get authorization code from query params
            if (!code) {
                throw new UnauthorizedException('No authorization code provided');
            }

            // Exchange code for access token and user info
            const googleUser = await this.googleOAuthService.exchangeCodeForUserInfo(code);

            if (!googleUser || !googleUser.email) {
                throw new UnauthorizedException('Invalid Google user data');
            }

            // Validate user and generate JWT tokens
            const tokens = await this.googleOAuthService.validateGoogleUser({
                email: googleUser.email,
                googleId: googleUser.googleId,
                accessToken: googleUser.accessToken,
                firstName: googleUser.firstName,
                lastName: googleUser.lastName,
            });

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'success',
                    location: 'GoogleOAuthController',
                    method: 'googleCallback',
                    payload: { email: googleUser.email },
                    messageData: 'Google OAuth successful, tokens generated',
                }),
            });

            // Security Note: In production, consider these alternatives:
            // 1. Use httpOnly cookies to store tokens (more secure)
            // 2. Use session-based authentication
            // 3. Implement PKCE flow for single-page applications

            // Option 1: Redirect to frontend with tokens in URL (less secure, use for development only)
            const frontendUrl = ENV.FRONTEND_IBP_URL || 'http://localhost:4201';
            const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'success',
                    location: 'GoogleOAuthController',
                    method: 'googleCallback',
                    payload: { redirectUrl },
                    messageData: 'Redirecting to frontend with tokens',
                }),
            });

            // Use HTML with JavaScript redirect instead of HTTP redirect
            // This works through API gateways that proxy responses
            const html = getOAuthSuccessHtml(redirectUrl);
            res.setHeader('Content-Type', 'text/html');
            res.send(html);

            // Option 2: Set httpOnly cookies (more secure - uncomment to use)
            /*
            res.cookie('accessToken', tokens.accessToken, {
                httpOnly: true,
                secure: ENV.NODE_ENV === 'production', // HTTPS only in production
                sameSite: 'strict',
                maxAge: 4 * 60 * 60 * 1000, // 4 hours
            });
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: ENV.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            const frontendUrl = ENV.FRONTEND_IBP_URL || 'http://localhost:4201';
            return res.redirect(`${frontendUrl}/dashboard`);
            */
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'failure',
                    location: 'GoogleOAuthController',
                    method: 'googleCallback',
                    messageData: {
                        error: error?.message,
                        stack: error?.stack,
                        response: error?.response?.data,
                    },
                }),
            });

            // Redirect to frontend with error using JavaScript redirect
            const frontendUrl = ENV.FRONTEND_IBP_URL || 'http://localhost:4201';
            const errorMessage = encodeURIComponent(
                error?.message || 'Authentication failed'
            );
            const errorRedirectUrl = `${frontendUrl}/login?error=${errorMessage}`;

            const html = getOAuthErrorHtml(errorRedirectUrl);
            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        }
    }
}
