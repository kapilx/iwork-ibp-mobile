import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Res,
} from "@nestjs/common";
import { ExcelService } from "./excel.service";
import type { Response } from "express";
import type { VersionSheet } from "../../../../service-lib/src/lib/utils/file-management.utils";
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { ApiTags } from "@nestjs/swagger";
import {
  getPlacementSlipDataSwaggerMetadata,
} from "./excel.swagger";

@ApiTags("Excel")
@Controller("document")
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Post("excel/broking_slip_activity")
  async generateExcel(
    @Body()
    body: {
      fileName: string;
      data: VersionSheet[];
      userId?: number;
    },
    @Res() res: Response
  ) {
    try {
      const url = await this.excelService.generateExcel(
        body.fileName,
        body.data,
        body.userId,
      );
      return res.status(HttpStatus.CREATED).json({
        status: HttpStatus.CREATED,
        message: successMessage.brokingSlipExcelGenerated,
        data: url,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : errorMessages.excelGenerationError;
      console.error("[Excel] broking_slip_activity generation failed:", message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message,
      });
    }
  }
  @Post("excel/quote_comparison_report_activity")
  async generateQuoteComparisonReportExcel(
    @Body()
    body: {
      fileName: string;
      data: any;
      userId?: number;
    },
    @Res() res: Response
  ) {
    try {
      const url = await this.excelService.generateQuoteComparisonReportExcel(
        body.fileName,
        body.data,
        body.userId,
      );
      console.log(
        "generateQuoteComparisonReportExcel:",
        body.fileName,
        body.data
      );
      return res.status(HttpStatus.CREATED).json({
        status: HttpStatus.CREATED,
        message: successMessage.quoteComparisonReportExcelGenerated,
        data: url,
      });
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : errorMessages.excelGenerationError,
      };
    }
  }
  @Post("excel/policy-generation")
  async generatePolicyReportExcel(
    @Body()
    body: {
      fileName: string;
      data: any;
      userId?: number;
    },
    @Res() res: Response
  ) {
    try {
      const url = await this.excelService.generatePolicyReportExcel(
        body.fileName,
        body.data
      );
      return res.status(HttpStatus.CREATED).json({
        status: HttpStatus.CREATED,
        message: successMessage.policyReportExcelGenerated,
        data: url,
      });
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : errorMessages.excelGenerationError,
      };
    }
  }

  @Post("placement-slip/data")
  @getPlacementSlipDataSwaggerMetadata()
  async getPlacementSlipData(
    @Body() body: { policyId?: number; opportunityId?: number },
    @Res() res: Response
  ) {
    try {
      const policy = await this.excelService.getPolicyById(body.policyId);
      if (policy) {
        const organizationId =
          await this.excelService.getOrganizationIdFromPolicy(policy);
        const organisationName = await this.excelService.getOrgName(
          organizationId
        );
        const placementslipOrganisationTemplates = [
          "iirm_india",
          "iirm_srilanka",
          "iirm_kenya",
        ];
        if (
          organisationName !== null &&
          placementslipOrganisationTemplates.includes(organisationName)
        ) {
          const data = await this.excelService.getPlacementSlipData(body);
          const printedOn = this.getIstTimestamp();

          let logoUrl: string | null = null;
          if (organisationName === "iirm_india") {
            logoUrl = "../jpgs/iirm_india_logo.jpg";
          } else if (organisationName === "iirm_srilanka") {
            logoUrl = "../jpgs/iirm_sriLanka_logo.jpg";
          } else if (organisationName === "iirm_kenya") {
            console.log("Setting logo for kenya");
            logoUrl = "../pngs/iirm_kenya_logo.png";
          }

          const section =
            data?.FooterSection && typeof data.FooterSection === "object"
              ? data.FooterSection
              : null;

          if (section && typeof section === "object") {
            Object.assign(section, { printedOn, logoUrl, organisationName });
          }

          return res.status(HttpStatus.OK).json({
            status: HttpStatus.OK,
            message: successMessage.placementSlipRetrieved,
            data,
          });
        } else {
          return res.status(HttpStatus.NOT_FOUND).json({
            status: HttpStatus.NOT_FOUND,
            message: errorMessages.placementSlipTemplateNotFound,
          });
        }
      } else {
        return res.status(HttpStatus.NOT_FOUND).json({
          status: HttpStatus.NOT_FOUND,
          message: errorMessages.policyNotFound,
        });
      }
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error instanceof HttpException
          ? error.message
          : error instanceof Error
          ? error.message
          : errorMessages.placementSlipRetrievalFailed;

      return res.status(status).json({
        status,
        message,
      });
    }
  }

  private getIstTimestamp(): string {
    const now = new Date();

    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset);

    const year = istTime.getUTCFullYear();
    const month = String(istTime.getUTCMonth() + 1).padStart(2, "0");
    const day = String(istTime.getUTCDate()).padStart(2, "0");
    const hour = String(istTime.getUTCHours()).padStart(2, "0");
    const minute = String(istTime.getUTCMinutes()).padStart(2, "0");
    const second = String(istTime.getUTCSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`;
  }
}
