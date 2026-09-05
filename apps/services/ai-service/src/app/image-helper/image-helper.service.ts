import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import jsQR from 'jsqr';
import { createCanvas, loadImage } from 'canvas';
import { OpenAiService } from '../open-ai/open-ai.service';
import { QrCodeData } from './interfaces/image-helper.interface';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';
import * as AWS from "aws-sdk";
@Injectable()
export class ImageHelperService {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly s3: AWS.S3;
  private readonly bucket = process.env.S3_AWS_BUCKET || "";
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AI_SERVICE);
    AWS.config.update({
      accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY,
      region: process.env.S3_AWS_REGION,
    });
    this.s3 = new AWS.S3();
  }

  async extractQrCodeData(image): Promise<QrCodeData> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'ImageHelperService',
        method: 'extractQrCodeData',
        messageData: 'method invoked',
      }),
    });
    try {
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, image.width, image.height);

      const imageData = ctx.getImageData(0, 0, image.width, image.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        return {
          text: code.data,
          isDetected: true,
        };
      } else {
        return {
          text: 'QR code is not clear to scan or not detected',
          isDetected: false,
        };
      }
    } catch (err) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'ImageHelperService',
          method: 'extractQrCodeData',
          messageData: err,
        }),
      });
      return {
        text: `Error reading image or QR code: ${err instanceof Error ? err.message : 'Unknown error'}`,
        isDetected: false,
      };
    }
  }

  async extractTextWithQrSupport(imagePath: string): Promise<string> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'ImageHelperService',
        method: 'extractTextWithQrSupport',
        payload: { imagePath },
        messageData: 'method invoked',
      }),
    });
    try {
      // Read image file as base64
      const s3Object = await this.s3.getObject({ Bucket: this.bucket, Key: imagePath }).promise();
      if (!s3Object.Body) {
        throw new Error("Failed to read PDF from S3");
      }
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'ImageHelperService',
          method: 'extractTextWithQrSupport',
          payload: { s3Object },
          messageData: 'method invoked',
        }),
      });
      const imageBuffer = s3Object.Body as Buffer;
      const imageBase64 = imageBuffer.toString('base64');
      
      // Extract QR code data if present
      const loadedImage = await loadImage(imageBuffer);
      const qrData = await this.extractQrCodeData(loadedImage);
      // Extract text from image including QR data
      const extractedText = await this.openAiService.extractTextFromImage(
        imageBase64, 
        qrData
      );
      
      return extractedText;
    } catch (err) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'ImageHelperService',
          method: 'extractTextWithQrSupport',
          messageData: err,
        }),
      });
      throw new Error(`Failed to extract text with QR support: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
}