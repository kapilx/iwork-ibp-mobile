import {
  Controller,
  Post,
  HttpStatus,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BusinessCardService } from './business-card.service';
import express from 'express';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';
import { uploadBusinessCardSwaggerMetadata } from '../ai-service.swagger';

@Controller('business-card')
export class BusinessCardController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly businessCardService: BusinessCardService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AI_SERVICE);
  }

  @uploadBusinessCardSwaggerMetadata()
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))// Handle file uploads
  async uploadBusinessCard(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<any> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'BusinessCardController',
        method: 'uploadBusinessCard',
        messageData: 'method invoked',
      }),
    });
    try {
      if (!file) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'No file uploaded',
        });
        return;
      }
      const userId = parseInt(req?.headers?.userid);
      const filePath = file.path;
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'BusinessCardController',
          method: 'uploadBusinessCard',
          payload: { userId },
          messageData: 'processing file',
        }),
      });

      const data = await this.businessCardService.processBusinessCard(file,userId, req);

      if (Array.isArray(data)) {
        res.status(HttpStatus.OK).json({ success: true, data });
      } else {
        res.status(HttpStatus.OK).json({
          success: false,
          error: data?.error ?? 'Unknown error',
        });
      }
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'BusinessCardController',
          method: 'uploadBusinessCard',
          payload: { filePath },
          messageData: 'completed',
        }),
      });
    } catch (err) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'BusinessCardController',
          method: 'uploadBusinessCard',
          messageData: err,
        }),
      });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }
}