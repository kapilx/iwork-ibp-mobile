import {
  Controller,
  Post,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClaimFormService } from './claim-form.service';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';

@Controller('claim-form')
export class ClaimFormController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly claimFormService: ClaimFormService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AI_SERVICE);
  }

  @Post('extract-gpt')
  @UseInterceptors(FileInterceptor('file'))
  async extractWithGpt(@UploadedFile() file: Express.Multer.File, @Res() res: any): Promise<void> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'ClaimFormController',
        method: 'extractWithGpt',
        messageData: 'method invoked',
      }),
    });
    try {
      if (!file) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: 'No file uploaded' });
        return;
      }
      const data = await this.claimFormService.extractWithGpt(file);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (err) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'ClaimFormController',
          method: 'extractWithGpt',
          messageData: err,
        }),
      });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: err instanceof Error ? err.message : 'Extraction failed',
      });
    }
  }

  @Post('extract-textract')
  @UseInterceptors(FileInterceptor('file'))
  async extractWithTextract(@UploadedFile() file: Express.Multer.File, @Res() res: any): Promise<void> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'ClaimFormController',
        method: 'extractWithTextract',
        messageData: 'method invoked',
      }),
    });
    try {
      if (!file) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: 'No file uploaded' });
        return;
      }
      const data = await this.claimFormService.extractWithTextract(file);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (err) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'ClaimFormController',
          method: 'extractWithTextract',
          messageData: err,
        }),
      });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: err instanceof Error ? err.message : 'Extraction failed',
      });
    }
  }
}
