import { Injectable, NotFoundException } from "@nestjs/common";
import { PdfRepository } from "./pdf.repository";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  DEFAULT_EXCEL_FILE_NAME,
  ACTIVITY_KEY,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  Policy,
  OpportunityActivityMap,
  Organisation,
} from "../../../../service-lib/src/lib/entities";
import path from "path";
@Injectable()
export class PdfService {
  constructor(
    private readonly pdfRepository: PdfRepository,
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(OpportunityActivityMap)
    private readonly opportunityActivityMapRepository: Repository<OpportunityActivityMap>
  ) {}

  async getOpportunityCompanyDetails(opportunityId: number): Promise<{
    companyId: any;
    companyName: any;
    opportunityId: any;
  }> {
    try {
      const opportunityData = await this.policyRepository.findOne({
        where: { opportunityId: opportunityId },
        relations: ["company"],
      });
      if (!opportunityData) {
        throw new NotFoundException(
          `Opportunity with ID ${opportunityId} not found`
        );
      }
      return {
        companyId: opportunityData.company?.id,
        companyName: opportunityData?.company?.companyName,
        opportunityId: opportunityData?.opportunityId,
      };
    } catch (error) {
      throw new NotFoundException(
        `Error while fetching opportunity details: ${(error as Error).message}`
      );
    }
  }

  async generatePlacementSlipPdf(
    fileName: string,
    data: Record<string, unknown>
  ) {
    try {
      const organisationName = data.FooterSection.organisationName;
      const getCompanyDetails = await this.getOpportunityCompanyDetails(
        Number(data.PolicySection.sectionData[0]["OUR REF NO"])
      );
      if (
        !getCompanyDetails.companyId ||
        !getCompanyDetails.companyName ||
        !getCompanyDetails.opportunityId
      ) {
        throw new NotFoundException(
          `Company or Opportunity details not found for Policy ID ${data.policyId}`
        );
      }
      // const currentDate = new Date();
      // const currentYear = currentDate.getFullYear() % 100; // e.g., 25 for 2025
      // const nextYear = (currentYear + 1) % 100; // e.g., 26 for 2026
      // const policyDateFormat = `${currentYear
      //   .toString()
      //   .padStart(2, "0")}-${nextYear.toString().padStart(2, "0")}`;

      // Extract years from Policy Inception and Policy Expiry
      const inceptionStr: string =
        data.CompanyPolicyDetails.sectionData[0]["Policy Inception"] || "";
      const expiryStr: string =
        data.CompanyPolicyDetails.sectionData[0]["Policy Expiry"] || "";

      // Helper function to extract year from string like "Date : 03/Oct/2025"
      const extractYear = (dateStr: string): number | null => {
        const match = dateStr.match(/(\d{4})/);
        return match ? parseInt(match[1].slice(-2), 10) : null;
      };

      const inceptionYear = extractYear(inceptionStr);
      const expiryYear = extractYear(expiryStr);

      if (inceptionYear === null || expiryYear === null) {
        throw new NotFoundException(
          "Invalid Policy Inception or Expiry date format."
        );
      }

      const policyDateFormat = `${inceptionYear
        .toString()
        .padStart(2, "0")}-${expiryYear.toString().padStart(2, "0")}`;
      const path = `document-generation/company/${getCompanyDetails.companyName}_${getCompanyDetails.companyId}/${getCompanyDetails.opportunityId}`;
      fileName = `${path}/placement-slip-generation/${DEFAULT_EXCEL_FILE_NAME.PLACEMENT_SLIP_FILE_NAME}_${getCompanyDetails.companyName}_${data["IsgDetails"]["sectionData"][0]["PolicyType"]}_${policyDateFormat}`;
      try {
        const uploadedurl = await this.fetchPlacementSlipUrl(
          getCompanyDetails.opportunityId
        );
        if (uploadedurl !== null) {
          return uploadedurl;
        }
      } catch (error) {
        throw new NotFoundException(
          `Error while fetching uploaded URL: ${(error as Error).message}`
        );
      }
      console.log("fileName", fileName);
      const responseUrl = await this.pdfRepository.generatePlacementSlipPdf(
        fileName,
        data,
        organisationName
      );
      const filePathUrl = responseUrl[1];
      console.log("filePathUrl", filePathUrl);
      console.log("getCompanyDetails", getCompanyDetails);
      const updateResult = await this.opportunityActivityMapRepository.update(
        {
          opportunityId: getCompanyDetails.opportunityId,
          activityKey: ACTIVITY_KEY.PLACEMENT_SLIP_GENERATION_ACTIVITY,
        },
        {
          filePathUrl,
        }
      );
      if (updateResult) {
        return responseUrl[0];
      } else {
        throw new NotFoundException(
          `Error while updating activity map for Opportunity ID ${getCompanyDetails.opportunityId}`
        );
      }
    } catch (error) {
      throw new NotFoundException(
        `Error while generating pdf: ${(error as Error).message}`
      );
    }
  }

  async fetchPlacementSlipUrl(opportunityId: number): Promise<string | null> {
    try {
      const activityMap = await this.opportunityActivityMapRepository.findOne({
        where: {
          opportunityId,
          activityKey: ACTIVITY_KEY.PLACEMENT_SLIP_GENERATION_ACTIVITY,
        },
      });
      if (!activityMap) {
        throw new NotFoundException(
          `Placement slip not found for Opportunity ID ${opportunityId}`
        );
      }
      const pathUrl: string = activityMap?.filePathUrl ?? null;
      if (pathUrl === null) {
        return null;
      } else {
        const uploadedUrl = await this.pdfRepository.fetchPlacementSlipUrl(
          pathUrl
        );
        return uploadedUrl;
      }
    } catch (error) {
      throw new NotFoundException(
        `Error while fetching pdf: ${(error as Error).message}`
      );
    }
  }
}
