import { Controller, Post, Body, InternalServerErrorException, Res, Req } from '@nestjs/common';
import { ResearchService } from './research.service';
import type { Request, Response } from "express";
import { ENV } from "../../../../service-lib/src/lib/environment";
import {
  searchCompanySwaggerMetadata,
  searchCompanyIndustryIntelligenceSwaggerMetadata,
} from '../ai-service.swagger';

@Controller('research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @searchCompanySwaggerMetadata()
  @Post('company')
  async searchCompany(
    @Body('query') query: string,
    @Res() res: Response,
    @Req() req: Request
  ){
    try {
      if (!query?.trim()) {
        throw new InternalServerErrorException("Query is required");
      }

      // Fetch dropdown values
      const [industrySegments, companyTypes, addressTypes] = await Promise.all([
        this.researchService.fetchDropdownValues(
          `${ENV.URL_ORG_SERVICE}/look-up/value?name=INDUSTRY_SEGMENT`,
          req.headers.authorization ?? ""
        ),
        this.researchService.fetchDropdownValues(
          `${ENV.URL_ORG_SERVICE}/look-up/value?name=COMPANY_TYPE`,
          req.headers.authorization ?? ""
        ),
        this.researchService.fetchDropdownValues(
          `${ENV.URL_ORG_SERVICE}/look-up/value?name=ADDRESS_TYPE`,
          req.headers.authorization ?? ""
        )
      ]);

      const data = await this.researchService.fetchCompanyData(query, {
        industrySegments,
        companyTypes,
        addressTypes
      }, req);
      
      if (data.success) {
        res.status(200).json({
          success : true,
          data: data.data,
        });
      } else {
        res.status(404).json({
          success : false,
          error: data?.error ?? "Unknown error",
        });
      }
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err?.message : "Internal Server Error",
      });
    }
  }

  @searchCompanyIndustryIntelligenceSwaggerMetadata()
  @Post('company/industry-intelligence')
  async searchCompanyIndustryIntelligence(
    @Body('query') query: string,
    @Body('industrySegment') industrySegment: string,
    @Res() res: Response
  ){
    try {
      if (!query?.trim()) {
        throw new InternalServerErrorException("Query is required");
      }
      const data = await this.researchService.fetchIndustryIntelligence(query, industrySegment);
      if (data.success) {
        res.status(200).json({
          success : true,
          data: data.data,
        });
      } else {
        res.status(404).json({
          success : false,
          error: data?.error ?? "Unknown error",
        });
      }
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err?.message : "Internal Server Error",
      });
    }
  }
}
