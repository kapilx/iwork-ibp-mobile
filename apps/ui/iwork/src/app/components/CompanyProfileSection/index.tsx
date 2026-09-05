import { Box } from "@mui/material";
import {
  columns,
  companyKPIData,
  getCompanyPolicyDetails,
  overViewData,
} from "./config";
import CompanyProfileKPICard from "../CompanyProfileKPICard";
import CompanyRenewalOpportunities from "../CompanyOpportunities/CompanyRenewalOpportunities";
import CompanySalesOpportunities from "../CompanyOpportunities";
import PolicyList from "../PolicyList";
import CompanyDetailsOverview from "../CompanyDetailsOverview";
import { Container, LeftContainer } from "./styles";
import { useLocalization } from "@ui/ui-lib";
import { environment } from "@ui/ui-lib/environment";
import { useHasPermission, FeatureKey } from "@ui/ui-lib";

export interface CompanyData {
  companyId: number;
  companyName?: string;
  displayName?: string;
  overViewData?: any;
  kpiData?: any;
  remarks?: string;
}

const CompanyProfileSection = ({
  companyData,
  activeTabKey,
}: {
  companyData: CompanyData;
  activeTabKey: string;
}) => {
  const { localizationData } = useLocalization();
  const localization = localizationData?.data;
  const hasRbacPermission = useHasPermission(FeatureKey.EXPORT_COMPANY);
  const showDownloadIcon =
    !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD ||
    (environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD && hasRbacPermission);

  return (
    <Container>
      <LeftContainer>
        <CompanyProfileKPICard
          data={companyKPIData(companyData?.kpiData, localization)}
        />
        <PolicyList
          values={{
            companyName: companyData?.displayName,
            companyId: companyData?.companyId,
            tableConfig: columns(localization),
            showDownloadIcon
          }}
        />
        <CompanySalesOpportunities
          companyData={companyData}
          activeTabKey={activeTabKey}
        />
      </LeftContainer>
      <CompanyDetailsOverview
        data={overViewData(companyData?.overViewData, companyData?.remarks)}
      />
    </Container>
  );
};
export default CompanyProfileSection;
