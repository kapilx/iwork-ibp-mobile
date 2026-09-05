import { Body, Controller, HttpStatus, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { PdfService } from "./pdf.service";
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { ApiTags } from "@nestjs/swagger";
import { generatePlacementSlipPdfSwaggerMetadata } from "./pdf.swagger";

interface PlacementSlipPdfRequest {
  fileName: string;
  data: Record<string, unknown>;
}
interface FetchPlacementSlipPdfUrlRequest {
  opportunityId: number;
}

@ApiTags("PDF")
@Controller("document")
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post("pdf/placement-slip")
  @generatePlacementSlipPdfSwaggerMetadata()
  async generatePlacementSlipPdf(
    @Body() body: PlacementSlipPdfRequest,
    @Res() res: Response
  ) {
    try {
      const url = await this.pdfService.generatePlacementSlipPdf(
        body.fileName,
        body.data
      );
      return res.status(HttpStatus.CREATED).json({
        status: HttpStatus.CREATED,
        message: successMessage.placementSlipPdfGenerated,
        data: url,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          error instanceof Error
            ? error.message
            : errorMessages.pdfGenerationError,
      });
    }
  }
}
