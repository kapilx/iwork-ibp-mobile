import { Injectable } from "@nestjs/common";
import {
  excelSheetGeneration,
  quoteComparisonReportExcelSheetGeneration,
  type VersionSheet,
  policyReportExcelSheetGeneration,
  type UserDetailsForPassword,
} from "../../../../service-lib/src/lib/utils/file-management.utils";

@Injectable()
export class ExcelRepository {
  async brokingSlipExcelGeneration(fileName: string, data: VersionSheet[],userDetails?: UserDetailsForPassword) {
    return await excelSheetGeneration(fileName, data, userDetails);
  }

  async quoteComparisonReportExcelGeneration(
    fileName: string,
    qcrData: any,
    organisationKey: string,
    userDetails?: UserDetailsForPassword,
  ) {
    return await quoteComparisonReportExcelSheetGeneration(
      fileName,
      qcrData,
      organisationKey,
      userDetails,
    );
  }

  async policyReportExcelGeneration(fileName: string, policyData: any, userDetails?: UserDetailsForPassword) {
    return await policyReportExcelSheetGeneration(fileName, policyData, userDetails, "utilization_reports");
  }
}
