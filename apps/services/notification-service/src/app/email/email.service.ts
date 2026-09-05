import { Injectable } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { ENV } from '../../../../service-lib/src/lib/environment.ts';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';
@Injectable()
export class EmailService {
  private readonly logger: ReturnType<typeof createLogger>;
  sesClient;

  constructor(private readonly traceIdService: TraceIdService) {
    this.sesClient = new SESClient({
       region: ENV.S3_AWS_REGION,
       credentials: {
         accessKeyId: ENV.S3_AWS_ACCESS_KEY_ID,
         secretAccessKey: ENV.S3_AWS_SECRET_ACCESS_KEY,
       },
     });
    this.logger = createLogger(this.traceIdService, serviceNames.NOTIFICATION_SERVICE);
  }
    
  async simplyMail(toAddress: string[], ccAddress: string[], subject: string, body: string) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'EmailService',
        method: 'simplyMail',
        messageData: 'method invoked',
      }),
    });
    const sendEmailCommand = new SendEmailCommand({
      Destination: {
        CcAddresses: ccAddress,
        ToAddresses: toAddress,
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: body,
          },
          Text: {
            Charset: 'UTF-8',
            Data: body,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: ENV.EMAIL_FROM,
    });
    try {
      return await this.sesClient.send(sendEmailCommand);
    } catch (e) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'EmailService',
          method: 'simplyMail',
          messageData: e,
        }),
      });
      return e;
    }
  }
}
    
