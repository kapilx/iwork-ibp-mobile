import { Injectable } from '@nestjs/common';
import { ImageHelperService } from '../image-helper/image-helper.service';
import { OpenAiService } from '../open-ai/open-ai.service';
import { Address, BusinessCard, BusinessCardError } from './interfaces/business-card.interface';
import * as fs from "fs/promises";
import * as AWS from "aws-sdk";
import pdfParse from "pdf-parse";
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';
import { matchLocationDropdowns } from '../common/utils/match-location-dropdowns';
@Injectable()
export class BusinessCardService {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly s3: AWS.S3;
  private readonly bucket = process.env.S3_AWS_BUCKET || "";
  constructor(
    private readonly imageHelperService: ImageHelperService,
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

  async processBusinessCard(
    file: Express.Multer.File,
    userId: number,
    request: Request 
  ): Promise<BusinessCard[] | BusinessCardError> {
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'BusinessCardService',
          payload: { userId,file },
          method: 'processBusinessCard',
          messageData: 'pdf text extracted',
        }),
      });
      const fileName = `${userId}_${Date.now()}_${file.originalname}`;
      const key = `ai-uploads/business-card/${fileName}`;
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'BusinessCardService',
          payload: { key },
          method: 'processBusinessCard',
          messageData: 'pdf text extracted',
        }),
      });
      const uploadResult = await this.s3
          .putObject({ Bucket: this.bucket, Key: key, Body: file.buffer })
          .promise();
      console.log("File uploaded to S3:", uploadResult);
        if (!uploadResult || uploadResult.$response.error) {

          throw new Error("File upload to S3 failed.");
        }
      const isPdf = key.toLowerCase().endsWith(".pdf");
      let extractedText: string;
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'BusinessCardService',
          payload: { isPdf },
          method: 'processBusinessCard',
          messageData: 'pdf text extracted',
        }),
      });
      if (isPdf) {
        // Extract text from PDF
        extractedText = await this.extractTextFromPdf(key);
        this.logger.log({
          level: 'info',
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: 'success',
            location: 'BusinessCardService',
            method: 'processBusinessCard',
            messageData: 'pdf text extracted',
          }),
        });
      } else {
        // Extract text from image with QR code support
      extractedText = await this.imageHelperService.extractTextWithQrSupport(
        key
      );
      };
      // Process the extracted text to identify business card details
      let cardDetails = await this.openAiService.explainCardDetails(extractedText);
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'BusinessCardService',
          method: 'processBusinessCard',
          messageData: 'card details extracted',
        }),
      });
      if (Array.isArray(cardDetails)) {
        cardDetails = await Promise.all(
          cardDetails.map(async (card) => {
            const addresses: Address[] = await Promise.all(
              (card.address ?? []).map(async (addr) => {
                if (addr?.country || addr?.state || addr?.city) {
                  const { country, state, city } = await matchLocationDropdowns(
                    {
                      country: addr?.country ?? '',
                      state: addr?.state ?? '',
                      city: addr?.city ?? '',
                    },
                    request
                  );
                  return { ...addr, country, state, city };
                }
                return {};
              })
            );
            return { ...card, address: addresses.filter(a => a !== undefined) };
          })
        );
      }
    return cardDetails;
  } catch (err) {
    this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'BusinessCardService',
          method: 'processBusinessCard',
          messageData: err,
        }),
      });
      return {
        error: 'Failed to process business card',
        details: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  async extractTextFromPdf(pdfPath: string): Promise<string> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'BusinessCardService',
        method: 'extractTextFromPdf',
        payload: { pdfPath },
        messageData: 'method invoked',
      }),
    });
    try {
      const s3Object = await this.s3.getObject({ Bucket: this.bucket, Key: pdfPath }).promise();
      if (!s3Object.Body) {
        throw new Error("Failed to read PDF from S3");
      }
      const buffer = s3Object.Body as Buffer;
      const data = await pdfParse(buffer);
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'BusinessCardService',
          method: 'extractTextFromPdf',
          payload: { data },
          messageData: 'method invoked',
        }),
      });
      return data.text || "";
    } catch (err) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'BusinessCardService',
          method: 'extractTextFromPdf',
          messageData: err,
        }),
      });
      throw new Error("PDF extraction failed");
    }
  }
}
