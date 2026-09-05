import {
  Button,
  CommonBreadcrumb,
  CommonDetailsSection,
  CustomModal,
  FeatureKey,
  NO_DATA_AVAILABLE,
  NOT_AVAILABLE,
  SummaryCard,
  endPoints,
  selectHasPermission,
  useApi,
  apiRequest,
} from "@ui/ui-lib";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { InsurerDetailsContainer, ButtonContainer, LogoPreviewContainer, LogoImage, LogoTitle } from "./styles";
import { Typography, Box, CircularProgress } from "@mui/material";
import {
  Breadcrumbs,
  getSectionConfig,
  getSummaryConfig,
  getGstSectionConfig,
  getHqSectionConfig,
  isHqAddress,
} from "./detailsConfig";
import { EntityType } from "../../../constants/enum";
import AddressSection from "../../../components/AddressSection";
import { OverviewCardBackground } from "../../CompanyPage/CompanyDetails/styles";
import { useSelector } from "react-redux";
import UtilityExcelUploadPage from "../../UtilityExcelUpload";

export const normalizeEntityType = (
  rawType: string | undefined
): EntityType | null => {
  switch (rawType?.toLowerCase()) {
    case "insurer":
      return EntityType.INSURER;
    case "tpa":
      return EntityType.TPA;
    case "broker":
      return EntityType.BROKER;
    default:
      return null;
  }
};

const entityTypeToEditFeatureKey: Record<EntityType, FeatureKey> = {
  [EntityType.INSURER]: FeatureKey.EDIT_INSURER,
  [EntityType.TPA]: FeatureKey.EDIT_TPA,
  [EntityType.BROKER]: FeatureKey.EDIT_BROKER,
};

const InsurerDetails = () => {
  const [insurerData, setInsurerData] = useState<any | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);
  const { data, doFetch, error } = useApi();
  const navigate = useNavigate();
  const { entityType: rawEntityType, id: entityId } = useParams();
  const location = useLocation();

  const entityType = normalizeEntityType(rawEntityType);
  const sectionConfig = entityType ? getSectionConfig(entityType) : [];
  const summaryConfig = entityType ? getSummaryConfig(entityType) : [];

  const editFeatureKey = entityType
    ? entityTypeToEditFeatureKey[entityType]
    : undefined;

  // Use the dynamic FeatureKey for permission check
  const canUpdate = useSelector((state: any) =>
    editFeatureKey ? selectHasPermission(editFeatureKey)(state) : false
  );

  useEffect(() => {
    if (entityId && entityType) {
      const getEntityByIdEndpoint = (() => {
        switch (entityType) {
          case EntityType.INSURER:
            return endPoints.insurerById(Number(entityId));
          case EntityType.TPA:
            return endPoints.tpaByID(Number(entityId));
          case EntityType.BROKER:
            return endPoints.brokerByID(Number(entityId));
          default:
            console.warn(`Unexpected entity type: ${entityType}`);
            return null;
        }
      })();

      if (getEntityByIdEndpoint) {
        doFetch(getEntityByIdEndpoint);
      }
    }
  }, [entityId, entityType]);

  useEffect(() => {
    if (data?.data) {
      setInsurerData(data.data);
    }
  }, [data]);

  // Logo preview effect
  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    const loadLogoPreview = async () => {
      const logoId = entityType === EntityType.TPA 
        ? insurerData?.tpaLogoFileId 
        : insurerData?.insurerLogoFileId;
        
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
          }
        );

        if (isCancelled) return;

        const blob = response.data as Blob;
        objectUrl = URL.createObjectURL(blob);
        setLogoPreviewUrl(objectUrl);
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load logo preview:", error);
          setLogoPreviewUrl(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingLogo(false);
        }
      }
    };

    if (insurerData) {
      loadLogoPreview();
    }

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [insurerData]);

  useEffect(() => {
    if (error?.status === 403) {
      navigate("/unauthorized", { replace: true });
    }
  }, [error, navigate]);

  if (!insurerData || Object.keys(insurerData).length === 0) {
    return (
      <InsurerDetailsContainer>
        <Typography variant="h6" align="center" color="textSecondary">
          {NO_DATA_AVAILABLE}
        </Typography>
      </InsurerDetailsContainer>
    );
  }

  const handleConfigClick = () => {
    if (entityType && insurerData?.id) {
      navigate(`/${entityType}/${insurerData.id}/config`, {
        state: { entityName: insurerData?.displayName },
      });
    }
  };

  const handleUploadClaimConfigClick = () => {
    if (entityType === EntityType.TPA && insurerData?.id) {
      navigate(`/${entityType}/${insurerData.id}/config?entityName=UPLOAD_CLAIM`, {
        state: {
          entityName: insurerData?.displayName,
          configEntityName: "UPLOAD_CLAIM",
        },
      });
    }
  };

  const handleExternalFeaturesClick = () => {
    if (insurerData?.id) {
      navigate(`/tpa/${insurerData.id}/external-features`, {
        state: { entityName: insurerData?.displayName },
      });
    }
  };

  return (
    <InsurerDetailsContainer>
      <ButtonContainer>
        <CommonBreadcrumb
          crumbs={Breadcrumbs(
            insurerData?.displayName,
            rawEntityType,
            location.state?.from
          )}
        />
        <div style={{ display: "flex", gap: "12px" }}>
          <Button
            variantType="secondary"
            onClick={handleConfigClick}
            className="config-button"
          >
            Config
          </Button>
          {entityType === EntityType.TPA && (
            <Button
              variantType="secondary"
              onClick={handleUploadClaimConfigClick}
              className="config-upload-claim-button"
            >
              Config Upload Claim
            </Button>
          )}
          {entityType === EntityType.TPA && (
            <Button
              variantType="secondary"
              onClick={handleExternalFeaturesClick}
              className="external-features-button"
            >
              External Features
            </Button>
          )}
        </div>
      </ButtonContainer>
      <SummaryCard
        data={{
          insurerName: insurerData?.insurerName ?? NOT_AVAILABLE,
          brokerName: insurerData?.brokerName ?? NOT_AVAILABLE,
          tpaName: insurerData?.tpaName ?? NOT_AVAILABLE,
          tag: insurerData?.companyTag?.lookUpValue ?? NOT_AVAILABLE,
          linkedInUrl: insurerData?.linkedInUrl ?? NOT_AVAILABLE,
          department: insurerData?.department?.lookUpValue ?? NOT_AVAILABLE,
          designation: insurerData?.designation?.name ?? NOT_AVAILABLE,
          status: insurerData?.status?.lookUpValue ?? NOT_AVAILABLE,
          website: insurerData?.website ?? NOT_AVAILABLE,
          insureCode: insurerData?.insureCode ?? NOT_AVAILABLE,
          isLife: insurerData?.isLife?.lookUpValue ?? NOT_AVAILABLE,
          companyType: insurerData?.companyType?.lookUpValue ?? NOT_AVAILABLE,

          // For TPA/Broker in case entityType is not 'insurer'
          displayName: insurerData?.displayName ?? NOT_AVAILABLE,
        }}
        sections={summaryConfig}
        headerConfig={{
          titleKey: "displayName",
        }}
      />
      {/* Logo Preview Section - Only show for Insurer and TPA */}
      <OverviewCardBackground>
        <CommonDetailsSection sections={sectionConfig} data={insurerData} />
      {(entityType === EntityType.INSURER || entityType === EntityType.TPA) && (
        <LogoPreviewContainer>
          <LogoTitle variant="h6">
            {entityType === EntityType.TPA ? "TPA" : "Insurer"} Logo
          </LogoTitle>
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
                alt={`${
                  entityType === EntityType.TPA ? "TPA" : "Insurer"
                } logo`}
                onClick={() => {
                  const newWindow = window.open();
                  if (newWindow) {
                    newWindow.document.write(
                      `<img src="${logoPreviewUrl}" alt="Entity logo" style="max-width: 100%; height: auto;" />`
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
      )}
      </OverviewCardBackground>

      {/* Head Quarter Details — insurer only */}
      {entityType === EntityType.INSURER &&
        getHqSectionConfig(insurerData?.insurerAddresses).length > 0 && (
          <OverviewCardBackground>
            <CommonDetailsSection
              sections={getHqSectionConfig(insurerData.insurerAddresses)}
              data={insurerData}
            />
          </OverviewCardBackground>
        )}



      {/* GST details — insurer only */}
      {entityType === EntityType.INSURER && insurerData?.gstDetails?.length > 0 && (
        <OverviewCardBackground>
          <CommonDetailsSection
            sections={getGstSectionConfig(insurerData.gstDetails)}
            data={insurerData}
          />
        </OverviewCardBackground>
      )}

      <AddressSection
        companyAddresses={
          entityType === EntityType.INSURER
            ? (insurerData?.insurerAddresses ?? []).filter((a: any) => !isHqAddress(a))
            : entityType === EntityType.TPA
            ? insurerData?.tpaAddresses
            : entityType === EntityType.BROKER
            ? insurerData?.brokerAddresses
            : []
        }
        showBranchInfo={entityType === EntityType.INSURER}
        onEditBranch={
          entityType === EntityType.INSURER && canUpdate && insurerData?.id
            ? (addressId: number) =>
                navigate(
                  `/${entityType}/${insurerData.id}/branch/${addressId}/edit`
                )
            : undefined
        }
      />

      <CustomModal
        open={showConfigModal}
        handleClose={() => setShowConfigModal(false)}
        heading="Insurer Configuration"
        modalBoxStyles={{ width: "100vw", height: "100vh", maxWidth: "100%", padding: "24px", margin: 0 }}
      >
        <UtilityExcelUploadPage />
      </CustomModal>
    </InsurerDetailsContainer>
  );
};

export default InsurerDetails;