import { Controller, Post, Body, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { PhoneOtpService } from './phone-otp.service';
import { ENV } from '../../../../service-lib/src/lib/environment';

@ApiTags('Phone OTP Authentication')
@Controller('auth/phone-otp')
export class PhoneOtpController {
  constructor(private readonly phoneOtpService: PhoneOtpService) {}

  /**
   * Send OTP to phone number (Backend-only implementation)
   * No Firebase SDK required on frontend
   */
  @Post('send-phone')
  @ApiOperation({ summary: 'Send 6-digit OTP to phone number' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phoneNumber: {
          type: 'string',
          description: 'Phone number to send OTP to (international format)',
        },
        domain: {
          type: 'string',
          description: 'Portal subdomain for company validation',
        },
      },
      required: ['phoneNumber', 'domain'],
    },
  })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phone number' })
  @ApiResponse({ status: 401, description: 'User not found or inactive' })
  async sendPhoneOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('domain') domain: string,
    @Body('scenario') scenario?: string,
    @Body('passwordMethodCode') passwordMethodCode?: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.phoneOtpService.sendPhoneOtp(
        phoneNumber,
        domain,
        scenario,
        passwordMethodCode,
      );

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
   * Verify phone OTP and generate JWT tokens (Backend-only implementation)
   * No Firebase SDK required on frontend
   */
  @Post('verify-phone')
  @ApiOperation({ summary: 'Verify 6-digit phone OTP' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phoneNumber: {
          type: 'string',
          description: 'Phone number',
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
      required: ['phoneNumber', 'otp', 'domain'],
    },
  })
  @ApiResponse({ status: 200, description: 'OTP verified and tokens generated' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyPhoneOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
    @Body('domain') domain: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.phoneOtpService.verifyPhoneOtpAndGenerateTokens(
        phoneNumber,
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
            redirectUrl,
            user: result.user,
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

  /**
   * Send OTP for password reset
   */
  @Post('send-password-reset-otp')
  @ApiOperation({ summary: 'Send 6-digit OTP for password reset' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phoneNumber: {
          type: 'string',
          description: 'Phone number to send password reset OTP to (international format)',
        },
        domain: {
          type: 'string',
          description: 'Portal subdomain for company validation',
        },
      },
      required: ['phoneNumber', 'domain'],
    },
  })
  @ApiResponse({ status: 200, description: 'Password reset OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phone number' })
  @ApiResponse({ status: 401, description: 'User not found or inactive' })
  async sendPasswordResetOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('domain') domain: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.phoneOtpService.sendPasswordResetOtp(
        phoneNumber,
        domain
      );

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: result.message,
        data: null,
      });
    } catch (error) {
      const statusCode = error.status || HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        statusCode: statusCode,
        message: error.message || 'Failed to send password reset OTP',
      });
    }
  }

  /**
   * Verify password reset OTP and generate limited JWT token
   * This token can only be used to call the password update endpoint
   */
  @Post('verify-password-reset-otp')
  @ApiOperation({ summary: 'Verify password reset OTP and get limited access token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phoneNumber: {
          type: 'string',
          description: 'Phone number',
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
      required: ['phoneNumber', 'otp', 'domain'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP verified and limited token generated for password reset',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'OTP verified. You can now reset your password.' },
        data: {
          type: 'object',
          properties: {
            resetToken: { type: 'string', description: 'JWT token for password reset (15 min expiry)' },
            userId: { type: 'number', description: 'User ID' },
            phoneNumber: { type: 'string', description: 'Phone number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyPasswordResetOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
    @Body('domain') domain: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.phoneOtpService.verifyPasswordResetOtp(
        phoneNumber,
        otp,
        domain
      );

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'OTP verified. You can now reset your password.',
        data: {
          resetToken: result.resetToken,
          userId: result.userId,
          phoneNumber: result.phoneNumber,
        },
      });
    } catch (error) {
      const statusCode = error.status || HttpStatus.UNAUTHORIZED;
      return res.status(statusCode).json({
        statusCode: statusCode,
        message: error.message || 'OTP verification failed',
      });
    }
  }
}
