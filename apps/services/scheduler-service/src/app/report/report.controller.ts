import { Body, Controller, Get, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { ReportService } from '../services/report.service';
import { createErrorResponse, createResponse } from '../../../../service-lib/src/lib/utils/response.utils';
import type { Response } from "express";
import {
  errorMessages,
  infoMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { UserActivityReportDto } from './dto/user-activity-report.dto';
import { GenerateReportQueryDto } from './dto/generate-report-query.dto';
import {
  getReportsListSwaggerMetadata,
  getReportDetailsSwaggerMetadata,
  generateReportSwaggerMetadata,
  downloadReportSwaggerMetadata,
} from './report.swagger';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Reports')
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('reports_list')
  @getReportsListSwaggerMetadata()
  async getReports(@Res() res: Response) {
    const data =await this.reportService.getReportsList();
    return res
      .status(HttpStatus.OK)
      .json(createResponse(HttpStatus.OK, successMessage.reportUserActivityGeneratedSuccessfully, { reportList: data }));
  }

  @Get(':reportId')
  @getReportDetailsSwaggerMetadata()
  async getReportDetails(@Param('reportId') reportId: string, @Res() res: Response) {
    try {
      const data = await this.reportService.getReportDetails(reportId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.reportUserActivityGeneratedSuccessfully, data));
    } catch (error) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(createErrorResponse(HttpStatus.NOT_FOUND, error instanceof Error ? error.message : infoMessages.noDataAvailable));
    }
  }

  @Post('generate/:report')
  @generateReportSwaggerMetadata()
  async generate(
    @Param('report') report: string,
    @Body() body: any,
    @Query() query: GenerateReportQueryDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.reportService.generateReport(report, { ...body }, {
        page: query.page,
        limit: query.limit,
        sort: query.sort,
      });
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            successMessage.reportUserActivityGeneratedSuccessfully,
            data,
          ),
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.reportUserActivityGenerationFailed,
          ),
        );
    }
  }

  @Post('download/:report')
  @downloadReportSwaggerMetadata()
  async download(
    @Param('report') report: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    try {
      const file = await this.reportService.downloadReport(report, { ...body });
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${file.fileName || report}`,
      );
      return res.send(file.data);
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.reportUserActivityGenerationFailed,
          ),
        );
    }
  }

  // @Post('user-activity-aggregated')
  // async generateAggregated(
  //   @Body() body: UserActivityReportDto,
  //   @Res() res: Response,
  // ) {
  //   try {
  //     const data = await this.reportService.generateReport('user_activity_aggregated', {
  //       startDate: body.startDate,
  //       endDate: body.endDate,
  //     });
  //     return res
  //       .status(HttpStatus.CREATED)
  //       .json(
  //         createResponse(
  //           HttpStatus.CREATED,
  //           successMessage.reportUserActivityAggregatedGeneratedSuccessfully,
  //           data,
  //         ),
  //       );
  //   } catch (error) {
  //     return res
  //       .status(HttpStatus.BAD_REQUEST)
  //       .json(
  //         createErrorResponse(
  //           HttpStatus.BAD_REQUEST,
  //           error instanceof Error
  //             ? error.message
  //             : errorMessages.reportUserActivityGenerationFailed,
  //         ),
  //       );
  //   }
  // }
  
}
