import { Body, Controller, Get, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';

@Controller('email')
export class EmailController {
  private readonly logger: ReturnType<typeof createLogger>;
  constructor(
    private readonly emailService: EmailService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.NOTIFICATION_SERVICE);
  }
  @Post('send')
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'EmailController',
        method: 'sendEmail',
        messageData: 'method invoked',
      }),
    });
    const sendEmailCommand = this.emailService.simplyMail(
      sendEmailDto.toAddress,
      sendEmailDto.ccAddress,
      sendEmailDto.subject,
      sendEmailDto.body,
    );
    return sendEmailCommand;
  }
