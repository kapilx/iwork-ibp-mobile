import { Controller, Post, Body, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { EmailOtpService } from './email-otp.service';
import { ENV } from '../../../../service-lib/src/lib/environment';
import { EMAIL_OTP_SCENARIOS } from '../../../../service-lib/src/lib/constants';

type EmailOTPScenario = typeof EMAIL_OTP_SCENARIOS[keyof typeof EMAIL_OTP_SCENARIOS];

@ApiTags('Custom Email OTP Authentication')
@Controller('auth/email-otp')
export class EmailOtpController {
  constructor(private readonly emailOtpService: EmailOtpService) {}

  /**
   * Send OTP to email address
   */
  @Post('send')
  @ApiOperation({ summary: 'Send 6-digit OTP to email address' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email address to send OTP to',
        },
        domain: {
          type: 'string',
          description: 'Portal subdomain for company validation',
        },
        scenario: {
          type: 'string',
          description: 'OTP scenario: LOGIN, TWO_FACTOR_AUTH, or ENROLLMENT_VERIFICATION',
          enum: ['LOGIN', 'TWO_FACTOR_AUTH', 'ENROLLMENT_VERIFICATION'],
          default: 'LOGIN'
        },
      },
      required: ['email', 'domain'],
    },
  })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid email address' })
  @ApiResponse({ status: 401, description: 'User not found or inactive' })
  async sendOTP(
    @Body('email') email: string,
    @Body('domain') domain: string,
    @Body('scenario') scenario?: EmailOTPScenario,
    @Body('passwordMethodCode') passwordMethodCode?: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.emailOtpService.sendOTP(email, domain, scenario, passwordMethodCode);

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: result.message,
        data: null,
      });
    } catch (error) {
      const statusCode = error.status || HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        statusCode: statusCode,
        message: error.message || 'Failed to send OTP',
      });
    }
  }

  /**
   * Verify OTP and generate JWT tokens
   */
  @Post('verify')
  @ApiOperation({ summary: 'Verify 6-digit OTP and generate JWT tokens' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email address',
        },
        otp: {
          type: 'string',
          description: '6-digit OTP code',
        },
        domain: {
          type: 'string',
          description: 'Portal subdomain for company validation',
        },
      },
      required: ['email', 'otp', 'domain'],
    },
  })
  @ApiResponse({ status: 200, description: 'OTP verified and tokens generated' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOTP(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Body('domain') domain: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.emailOtpService.verifyOTPAndGenerateTokens(
        email,
        otp,
        domain
      );

      // In development, return tokens in response
      // In production, consider using httpOnly cookies
      if (ENV.NODE_ENV === 'production') {
        // Set tokens in httpOnly cookies for production
        res.cookie('access_token', result.accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 4 * 60 * 60 * 1000, // 4 hours
        });

        res.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(HttpStatus.OK).json({
          statusCode: HttpStatus.OK,
          message: 'OTP verified successfully',
          data: {
            user: result.user,
          },
        });
      } else {
        // Development: return tokens in response body
        const frontendUrl = ENV.FRONTEND_IBP_URL || 'http://localhost:4201';
        const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;

        return res.status(HttpStatus.OK).json({
          statusCode: HttpStatus.OK,
          message: 'OTP verified successfully',
          data: {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
            redirectUrl,
          },
        });
      }
    } catch (error) {
      const statusCode = error.status || HttpStatus.UNAUTHORIZED;
      return res.status(statusCode).json({
        statusCode: statusCode,
        message: error.message || 'OTP verification failed',
      });
    }
  }
}
