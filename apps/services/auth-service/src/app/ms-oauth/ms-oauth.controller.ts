import {
    Controller,
    Get,
    Query,
    Req,
    Res,
    HttpStatus,
    UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { MsOAuthService } from './ms-oauth.service';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import {
    serviceNames,
    MICROSOFT_OAUTH,
    getOAuthSuccessHtml,
    getOAuthErrorHtml,
} from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';
import { ENV } from '../../../../service-lib/src/lib/environment';

@ApiTags('Microsoft OAuth')
@Controller('auth/microsoft')
export class MsOAuthController {
    private readonly logger: ReturnType<typeof createLogger>;

    constructor(
        private readonly msOAuthService: MsOAuthService,
        private readonly traceIdService: TraceIdService,
    ) {
        this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
    }

    /**
     * Returns the Microsoft OAuth authorization URL as JSON.
     * The frontend redirects the user to this URL.
     */
    @Get('auth-url')
    @ApiOperation({ summary: 'Get Microsoft OAuth URL' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Returns Microsoft OAuth URL' })
    async getMsAuthUrl(@Query('silent') silent?: string): Promise<{ url: string }> {
        const tenantId = ENV.MS_TENANT_ID || 'common';
        const callbackUrl = ENV.MS_CALLBACK_URL;
        const clientId = ENV.MS_CLIENT_ID;
        const isSilent = silent === 'true';

        // Seamless attempt (silent=true): omit `prompt` entirely so Microsoft can use
        // the device's Primary Refresh Token (PRT) to sign the user in with no UI —
        // the same way first-party apps like office.com behave on an Entra-joined
        // device. We intentionally do NOT use `prompt=none` here: it skips the PRT
        // bootstrap (nonce + PRT cookie exchange) and returns AADSTS50058 whenever no
        // login.microsoftonline.com session cookie already exists, even though a valid
        // PRT is present. `state=silent` lets the callback bounce real errors quietly
        // back to the app's /login form (username/password fallback).
        //
        // Manual button (silent=false): force the account picker so the user can
        // explicitly choose / switch the Microsoft account.
        const authUrl =
            `${MICROSOFT_OAUTH.AUTH_BASE_URL(tenantId)}?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
            `response_type=${MICROSOFT_OAUTH.RESPONSE_TYPE}&` +
            `scope=${MICROSOFT_OAUTH.SCOPE_ENCODED}&` +
            `response_mode=query` +
            (isSilent ? '&state=silent' : '&prompt=select_account');

        this.logger.log({
            level: 'info',
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: 'success',
                location: 'MsOAuthController',
                method: 'getMsAuthUrl',
                payload: { redirect_uri: callbackUrl, silent: isSilent },
                messageData: 'Microsoft OAuth URL generated',
            }),
        });

        return { url: authUrl };
    }

    /**
     * Microsoft OAuth callback — exchanges the authorization code for tokens
     * and redirects to the iwork frontend with JWT tokens in the URL.
     */
    @Get('callback')
    @ApiOperation({ summary: 'Microsoft OAuth callback endpoint' })
    @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
    async msCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
        const code = req.query.code as string;
        const error = req.query.error as string;
        const errorDescription = req.query.error_description as string;
        const state = req.query.state as string;

        this.logger.log({
            level: 'info',
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: 'success',
                location: 'MsOAuthController',
                method: 'msCallback',
                payload: { hasCode: !!code, hasError: !!error, state },
                messageData: 'Microsoft OAuth callback received',
            }),
        });

        const frontendLoginUrl = `${ENV.FRONTEND_IWORK_URL}/login`;

        try {
            if (error) {
                // Silent auth failure — no active MS session; just return to login page quietly
                if (state === 'silent') {
                    res.redirect(frontendLoginUrl);
                    return;
                }
                throw new UnauthorizedException(
                    errorDescription || `Microsoft OAuth error: ${error}`,
                );
            }

            if (!code) {
                throw new UnauthorizedException('No authorization code provided');
            }

            const msUser = await this.msOAuthService.exchangeCodeForUserInfo(code);

            if (!msUser?.email) {
                throw new UnauthorizedException('Invalid Microsoft user data');
            }

            const tokens = await this.msOAuthService.validateMsUser({
                email: msUser.email,
                msId: msUser.msId,
                accessToken: msUser.accessToken,
                firstName: msUser.firstName,
                lastName: msUser.lastName,
            });

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'success',
                    location: 'MsOAuthController',
                    method: 'msCallback',
                    payload: { email: msUser.email },
                    messageData: 'Microsoft OAuth successful, tokens generated',
                }),
            });

            const frontendUrl = ENV.FRONTEND_IWORK_URL || ENV.FRONTEND_IBP_URL || 'http://localhost:4200';
            const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;

            res.setHeader('Content-Type', 'text/html');
            res.send(getOAuthSuccessHtml(redirectUrl));
        } catch (err: any) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'failure',
                    location: 'MsOAuthController',
                    method: 'msCallback',
                    messageData: { error: err?.message, stack: err?.stack },
                }),
            });

            const frontendUrl = ENV.FRONTEND_IWORK_URL || ENV.FRONTEND_IBP_URL || 'http://localhost:4200';
            const errorMessage = encodeURIComponent(err?.message || 'Authentication failed');
            const errorRedirectUrl = `${frontendUrl}/login?error=${errorMessage}`;

            res.setHeader('Content-Type', 'text/html');
            res.send(getOAuthErrorHtml(errorRedirectUrl));
        }
    }
}
