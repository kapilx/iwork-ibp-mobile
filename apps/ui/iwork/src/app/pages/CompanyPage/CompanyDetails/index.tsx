import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import {
  CompanyDetailsContainer,
  ButtonContainer,
  OverviewCardBackground,
  CardGridBackground,
} from "./styles";
import {
  LogoPreviewContainer,
  LogoImage,
  LogoTitle,
} from "../../InsurerPage/InsurerDetails/styles";
import {
  companyTabsConfig,
  companyDetails,
  companyRegulatory,
  companyProfile,
  companyStrategy,
  contactsColumns,
  companyRegulatoryConfig,
  companyBreadcrumbsData,
} from "./detailsConfig";
import editIcon from "../../../assets/svgs/edit-icon.svg";
import { EDIT, LED_BY, ASSOCIATED_BY, TRACXN_URL, UTILITY_UPLOAD_ENTITY } from "../../../constants";
import { priorityStyleMap } from "../CompanyListing/tableConfig";
import AddressSection from "../../../components/AddressSection";
import leadCrmImage from "../../../assets/svgs/lead-crm.svg";
import RegulatorySection from "../../../components/RegulatorySection/index.js";
import regulatoryImage from "../../../assets/svgs/regulatory-icon.svg";
import GstSection from "../../../components/GSTCards";
import gstIcon from "../../../assets/svgs/gst-heading-icon.svg";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  TabsContact,
  Button,
  useApi,
  endPoints,
  CustomTabs,
  SummaryCard,
  CommonBreadcrumb,
  CommonDetailsSection,
  NO_DATA_AVAILABLE,
  NOT_AVAILABLE,
  cardSections,
  CardGrid,
  ProfileSection,
  StrategySection,
  FeatureKey,
  selectHasPermission,
  useLocalization,
  DisplayDocuments,
  apiRequest,
  environment,
} from "@ui/ui-lib";
import { useSelector } from "react-redux";
import { CellClickedEvent } from "ag-grid-community";
import PolicyList from "../../../components/PolicyList";
import CompanySalesOpportunities from "../../../components/CompanyOpportunities";
import CompanyRenewalOpportunities from "../../../components/CompanyOpportunities/CompanyRenewalOpportunities";
import CompanyProfileSection from "../../../components/CompanyProfileSection";
import UtilityExcelUploadPage from "../../UtilityExcelUpload";
import StrapiAccessButton from "../../../components/StrapiAccessButton";
import { EmailReminders } from "./EmailReminders";

const sectionMap = {
  companyDetails,
  companyRegulatory,
  companyProfile,
  companyStrategy,
};

const componentMap: Record<string, React.FC> = {
  TabsContact,
  CardGrid,
  ProfileSection,
  StrategySection,
  companyRegulatory,
  EmployeeDetailConfig: UtilityExcelUploadPage,
};

const CompanyDetails = () => {
  const location = useLocation();
  const [companyData, setCompanyData] = useState<any | null>(
    location.state?.companyData ?? null,
  );
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);
  const { data, error, doFetch } = useApi();
  const { id } = useParams();
  const navigate = useNavigate();
  const { localizationData } = useLocalization();
  const [activeTab, setActiveTab] = useState<string>("profile");
  const from = location.state?.from;

  useEffect(() => {
    if (location.state?.activeTabKey) {
      setActiveTab(location.state.activeTabKey);
    }
  }, [location.state?.activeTabKey]);

  useEffect(() => {
    if (id) {
      doFetch(endPoints.companyById(Number(id)));
    }
  }, [id]);

  useEffect(() => {
    if (data) {
      setCompanyData(data.data);
    }
  }, [data]);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    const loadLogoPreview = async () => {
      const logoId = companyData?.companyLogoFileId;
      if (!logoId) {
        setLogoPreviewUrl(null);
        return;
      }

      setIsLoadingLogo(true);
      try {
        const response = await apiRequest(
          endPoints.fileUploadDownloadById(logoId),
          {
            method: "GET",
            responseType: "blob",
          },
        );

        if (isCancelled) return;

        const blob = response.data as Blob;
        objectUrl = URL.createObjectURL(blob);
        setLogoPreviewUrl(objectUrl);
      } catch (logoError) {
        if (!isCancelled) {
          console.error("Failed to load logo preview:", logoError);
          setLogoPreviewUrl(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingLogo(false);
        }
      }
    };

    if (companyData) {
      loadLogoPreview();
    }

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [companyData]);
  useEffect(() => {
    if ((error as { statusCode?: number })?.statusCode === 403) {
      navigate("/unauthorized", { replace: true });
    }
  }, [error, navigate]);

  const handleUpdateCompany = () => {
    if (id) {
      navigate(`/companies/${id}/edit`);
    }
  };

  const currentUserId: number | null = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}")?.userId ?? null;
    } catch {
      return null;
    }
  })();

  const isLeadCrm = currentUserId != null && companyData?.leadCrmInfo?.id === currentUserId;
  const canAccessRiskWatch = isLeadCrm || currentUserId === -1;

  const handleHrPortalRedirect = async () => {
    if (!id || !currentUserId) return;
    try {
      const res = await apiRequest(endPoints.crmRedirectToken, {
        method: "POST",
        data: { userId: currentUserId, companyId: Number(id) },
      });
      const token = res?.data?.accessToken;
      const portalBase = (res?.data?.portalUrl || environment.ibpAppUrl).replace(/\/$/, "");
      if (token) {
        window.open(`${portalBase}/hr-portal/portfolio?token=${encodeURIComponent(token)}&companyId=${id}`, "_blank");
      }
    } catch {
      // silently fail
    }
  };

  const handleConfigurePortal = () => {
    if (!id) return;

    const baseBreadcrumbs =
      (location.state?.breadcrumbs as any) ||
      companyBreadcrumbsData(
        companyData?.companyName,
        from,
        location.state?.filters ? location.state?.filters : null,
      );

    const portalBreadcrumbs = [
      ...(Array.isArray(baseBreadcrumbs) ? baseBreadcrumbs : []),
      { label: "Configure IBP Portal" },
    ];

    navigate(`/companies/${id}/configure-portal`, {
      state: {
        companyName: companyData?.companyName,
        from: from || "company-details",
        fromPath: location.pathname,
        filters: location.state?.filters,
        breadcrumbs: portalBreadcrumbs,
      },
    });
  };

  // Update onCellClicked to use opportunityId from row data
  const onCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "policyType" && event.data?.opportunityId) {
      navigate(`/opportunities/${event.data.opportunityId}`);
    }
  };

  const canUpdateCompany = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EDIT_COMPANY)(state),
  );

  const canViewPolicy = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_POLICY)(state),
  );

  const hasExportCompanyPermission = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EXPORT_COMPANY)(state),
  );
  const showDownloadIcon =
    !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD ||
    (environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD && hasExportCompanyPermission);

  if (!companyData) {
    return (
      <CompanyDetailsContainer>
        <Typography variant="h6" align="center" color="textSecondary">
          {NO_DATA_AVAILABLE}
        </Typography>
      </CompanyDetailsContainer>
    );
  }

  const filteredTabs = companyTabsConfig.filter(
    (tab) =>
      canViewPolicy ||
      (tab.componentKey !== "CompanySalesOpportunities" &&
        tab.componentKey !== "CompanyRenewalOpportunities"),
  );

  const tabs = filteredTabs.map((tab, index) => {
    if (tab.sectionKey === "companyDetails") {
      const section = sectionMap[tab.sectionKey];
      return {
        ...tab,
        content: (
          <div>
            <OverviewCardBackground>
              <CommonDetailsSection sections={section} data={companyData} />
              <LogoPreviewContainer>
                <LogoTitle variant="h6">Company Logo</LogoTitle>
                {isLoadingLogo ? (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="150px"
                  >
                    <CircularProgress size={24} />
                    <Typography variant="body2" ml={2}>
                      Loading logo...
                    </Typography>
                  </Box>
                ) : logoPreviewUrl ? (
                  <Box>
                    <LogoImage
                      src={logoPreviewUrl}
                      alt="Company logo"
                      onClick={() => {
                        const newWindow = window.open();
                        if (newWindow) {
                          newWindow.document.write(
                            `<img src="${logoPreviewUrl}" alt="Company logo" style="max-width: 100%; height: auto;" />`,
                          );
                          newWindow.document.close();
                        }
                      }}
                    />
                    <Typography
                      variant="caption"
                      display="block"
                      mt={1}
                      color="text.secondary"
                    >
                      Click to view full size
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="150px"
                    border="2px dashed"
                    borderColor="divider"
                    borderRadius={2}
                    p={3}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No logo available
                    </Typography>
                  </Box>
                )}
              </LogoPreviewContainer>
            </OverviewCardBackground>
            <AddressSection companyAddresses={companyData?.companyAddresses} />
            {companyData?.policyLocations?.length > 0 && (
              <Box mt={5}>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, fontWeight: 600 }}
                >
                  Policy configuration locations
                </Typography>
                <AddressSection
                  companyAddresses={companyData.policyLocations}
                />
              </Box>
            )}
          </div>
        ),
      };
    }
    if (tab.sectionKey) {
      const section = sectionMap[tab.sectionKey];
      return {
        ...tab,
        content: (
          <div>
            <CommonDetailsSection
              sections={section}
              data={companyData}
              itemStyles={{ marginTop: "20px" }}
            />
          </div>
        ),
      };
    }

    if (tab.componentKey === "companyRegulatory") {
      const regulatoryConfig = companyRegulatoryConfig(
        companyData,
        localizationData,
      );
      return {
        ...tab,
        content: (
          <OverviewCardBackground data-testid="kyc-section">
            <RegulatorySection
              sectionTitle={regulatoryConfig.sectionTitle}
              data={regulatoryConfig.data}
              sectionImage={regulatoryImage}
            />
            <GstSection
              data={companyData?.stateGstDetails || []}
              sectionImage={gstIcon}
              sectionTitle="GST"
            />
          </OverviewCardBackground>
        ),
      };
    }

    if (tab.componentKey === "TabsContact") {
      const rows = companyData?.contacts || [];
      const columns = contactsColumns;

      return {
        ...tab,
        content: <TabsContact rows={rows} columns={columns} />,
      };
    }

    if (tab.componentKey === "CardGrid") {
      const rows = companyData?.contacts || [];
      return {
        ...tab,
        content: (
          <CardGridBackground>
            <CardGrid
              contacts={rows}
              companyName={companyData.displayName}
              companyId={companyData.id}
            />
          </CardGridBackground>
        ),
      };
    }

    if (tab.componentKey === "profile") {
      return {
        ...tab,
        content: (
          <CompanyProfileSection
            companyData={{
              displayName: companyData?.displayName,
              companyId: companyData?.id,
              companyName: companyData?.companyName,
              overViewData: companyData?.details,
              kpiData: companyData?.kpiDetails,
              remarks: companyData?.remarks,
            }}
            activeTabKey={tab.tabKey}
          />
        ),
      };
    }
    if (tab.componentKey === "StrategySection") {
      return {
        ...tab,
        content: (
          <StrategySection profile={companyStrategy} data={companyData} />
        ),
      };
    }
    if (tab.componentKey === "PolicyList") {
      return {
        ...tab,
        content: (
          <PolicyList
            values={{
              companyName: companyData?.displayName,
              companyId: companyData?.id,
            }}
          />
        ),
      };
    }
    //As of now we are not having any design so this is implmemented as a placeholder
    if (tab.componentKey === "CompanySalesOpportunities") {
      return {
        ...tab,
        content: (
          <CompanySalesOpportunities
            companyData={{
              displayName: companyData?.displayName,
              companyId: companyData?.id,
              companyName: companyData?.companyName,
            }}
            activeTabKey={tab.tabKey}
          />
        ),
      };
    }
    if (tab.componentKey === "CompanyRenewalOpportunities") {
      return {
        ...tab,
        content: <CompanyRenewalOpportunities />,
      };
    }
    if (tab.componentKey === "ProfileSection") {
      return {
        ...tab,
        content: (
          <ProfileSection profile={companyProfile} companyData={companyData} />
        ),
      };
    }

    if (tab.componentKey === "documents") {
    const isExportFeatureEnabled = environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD;
    return {
        ...tab,
        content: (
          <DisplayDocuments
            endPoint={endPoints.companyDocs(Number(id))}
            downloadModuleKey="company_documents"
            fileNamePrefix={`company_${id || "unknown"}`}
            permissionFeatureKey={FeatureKey.EXPORT_COMPANY}
          />
        ),
    };
}

    if (tab.componentKey === "EmployeeDetailConfig") {
      return {
        ...tab,
        content: <UtilityExcelUploadPage entity={UTILITY_UPLOAD_ENTITY.SEND_TO_CLIENT} showDownloadIcon={showDownloadIcon} />,
      };
    }

    if (tab.componentKey === "EmailReminders") {
      return {
        ...tab,
        content: <EmailReminders companyId={id} />,
      };
    }

    const Component = tab?.componentKey
      ? componentMap[tab.componentKey]
      : undefined;

    return {
      ...tab,
      content: Component ? <Component /> : null,
    };
  });

  return (
    <CompanyDetailsContainer>
      <ButtonContainer>
        <CommonBreadcrumb
          crumbs={companyBreadcrumbsData(
            companyData?.companyName,
            from,
            location.state?.filters ? location.state?.filters : null,
            location.state?.policyName,
            location.state?.policyId,
          )}
        />
        <Box display="flex" gap={2}>
          {canAccessRiskWatch && (
            <Button
              variantType="secondary"
              onClick={handleHrPortalRedirect}
            >
              Risk Watch
            </Button>
          )}
          {canUpdateCompany &&
            (companyData?.editable === undefined || companyData?.editable) && (
              <Button
                variantType="secondary"
                onClick={handleUpdateCompany}
                className="edit-button"
              >
                <img src={editIcon} alt={EDIT} /> {EDIT}
              </Button>
            )}
          <StrapiAccessButton
            variant="outlined"
            size="medium"
            buttonText="Open Strapi CMS"
            tooltip="Open Strapi Content Management System in new tab"
            requiredPermissions={[]} // Empty for now to allow testing - add specific permissions as needed
            options={{ openInNewTab: true }}
            onSuccess={() => console.log('Strapi opened successfully')}
            onError={(error) => console.error('Failed to open Strapi:', error)}
          />
        </Box>
      </ButtonContainer>

      <SummaryCard
        data={{
          industry: companyData?.industrySegment?.lookUpValue ?? NOT_AVAILABLE,
          priority: companyData?.priority?.lookUpValue ?? NOT_AVAILABLE,
          companyNumber:
            companyData?.companyAddresses?.[0]?.address?.phoneNumber ??
            NOT_AVAILABLE,
          displayName: companyData?.displayName ?? NOT_AVAILABLE,
          sentiment: companyData?.sentiment?.lookUpValue ?? NOT_AVAILABLE,
          leadCRM: companyData?.leadCrmInfo?.name ?? NOT_AVAILABLE,
          associateCRM: companyData?.associateCrmInfo?.name ?? NOT_AVAILABLE,
        }}
        nameLink={TRACXN_URL}
        sections={cardSections}
        headerConfig={{
          titleKey: "displayName",
          chip: [
            { key: "priority", styleMap: priorityStyleMap, variant: "normal" },
            {
              key: "leadCRM",
              variant: "withImage",
              imageSrc: leadCrmImage,
              labelPrefix: LED_BY,
              labelStyles: "lead-crm-label",
            },
            {
              key: "associateCRM",
              variant: "withImage",
              imageSrc: leadCrmImage,
              labelPrefix: ASSOCIATED_BY,
              labelStyles: "lead-crm-label",
            },
          ],
          button: {
            label: "TRACXN",
            onClick: (data) => window.open(data.nameLink, "_blank"),
          },
          customButton: {
            label: "Configure IBP Portal",
            onClick: handleConfigurePortal,
            variant: "secondary",
            icon: <SettingsIcon sx={{ fontSize: 18, marginRight: 1 }} />,
            className: "configure-portal-button",
          },
        }}
      />

      <CustomTabs tabs={tabs} initialTabKey={activeTab} />
    </CompanyDetailsContainer>
  );
};

export default CompanyDetails;