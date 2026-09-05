import React from "react";
import { PortalConfigurationTitle, VIEW } from "../../constants";
import { portalConfigurationItems } from "./config.ts";
import HospitalUpload from "../HospitalUpload/index.js";
import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useApiQuery,
  endPoints,
  formatNumberByLocalization,
  apiRequest,
  HTTP_METHODS,
  setToastMessage,
  CustomModal,
} from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { Stack, Typography } from "@mui/material";
import {
  ButtonContainer,
  Card,
  CardButton,
  CardIcon,
  CardIconTextContainer,
  CardInfoContainer,
  CardInfoLabel,
  CardInfoRow,
  CardInfoValue,
  CardsContainer,
  CardSubtitle,
  CardTextContainer,
  CardTitle,
  Container,
  Heading,
} from "./styles.js";
import FaqDocUpload from "../FaqDocUpload";
import PolicyFeatureUpload from "../PolicyFeatureUpload";
import ContactMetrics from "../ContactMetrics";

const getNestedValue = (obj: any, path: string): any => {
  if (!obj || !path) return null;

  try {
    const value =
      path.split(".").reduce((acc, key) => {
        if (key === "length") return acc?.length ?? null;
        return acc?.[key];
      }, obj) ?? null;

    // ✅ Check if value is a number and format it
    if (typeof value === "number") {
      return formatNumberByLocalization(value);
    }

    return value;
  } catch {
    return null;
  }
};

const PortalConfigurationTab = ({
  policyId,
  isGMCPolicy,
  policyDetailsData,
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isChildFaqModalOpen, setIsChildFaqModalOpen] = useState(false);
  const [isPolicyFeatureModalOpen, setIsPolicyFeatureModalOpen] =
    useState(false);
  const [isContactMetricsModalOpen, setIsContactMetricsModalOpen] = useState(false);
  const [contactMetricsMode, setContactMetricsMode] = useState<'create' | 'edit' | 'view'>('create');
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [hasUploadedData, setHasUploadedData] = useState(false);
  const [isDeletingPolicyFeature, setIsDeletingPolicyFeature] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const {
    data: portalConfigData,
    refetch: refetchPortalConfigData,
  } = useApiQuery({
    url: endPoints.hospitalNetworkOverview(policyId),
    queryKey: ["portalConfigData", policyId],
    enabled: !!policyId,
  });

  const handleView = (itemId?: number) => {
    // Define the destination configuration
    if (itemId === 2) {
      navigate(`/policies/${id}/faqs`, { state: { policyDetailsData } });
    } else if (itemId === 3) {
      navigate(`/policies/${id}/policy-features`);
    } else if (itemId === 4) {
      // For now, navigate to a contact metrics page (you can update this route as needed)
      navigate(`/policies/${id}/contact-metrics`);
    } else {
      navigate(`/policies/${id}/hospitals`, { state: { policyDetailsData } });
    }
  };

  // Handle card button click based on item id
  const handleCardButtonClick = (itemId: number, hasUpdatedData: boolean) => {
    setHasUploadedData(hasUpdatedData);
    if (itemId === 1) {
      setModalOpen(true); // Open Hospital Upload modal
    } else if (itemId === 2) {
      setIsChildFaqModalOpen(true); // Open FAQ Upload modal
    } else if (itemId === 3) {
      setIsPolicyFeatureModalOpen(true); // Open Policy feature upload modal
    } else if (itemId === 4) {
      // Set mode based on whether contact metrics are already configured from API
      const isConfigured = portalConfigData?.data?.contactMatrix?.configured ?? false;
      setContactMetricsMode(isConfigured ? 'edit' : 'create');
      setIsContactMetricsModalOpen(true); // Open Contact Metrics modal
    }
  };

  const confirmDeletePolicyFeatureDocument = async () => {
    setIsDeletingPolicyFeature(true);
    try {
      const response = await apiRequest(
        endPoints.portalConfigPolicyFeatureDocument(policyId),
        { method: HTTP_METHODS.DELETE }
      );
      dispatch(
        setToastMessage({
          type: "success",
          message:
            response?.message ||
            "Policy features document deleted successfully",
        })
      );
      await refetchPortalConfigData();
      setIsDeleteConfirmOpen(false);
    } catch (error: any) {
      dispatch(
        setToastMessage({
          type: "error",
          message:
            error?.message ||
            "Failed to delete policy features document. Please try again.",
        })
      );
    } finally {
      setIsDeletingPolicyFeature(false);
    }
  };

  // Handle Contact Metrics View button
  const handleContactMetricsView = () => {
    setContactMetricsMode('view');
    setIsContactMetricsModalOpen(true);
  };

  // Filter portal configuration items based on GMC policy
  const filteredPortalItems = useMemo(() => {
    return portalConfigurationItems.filter((item) => {
      // Filter out Hospital Upload (itemId === 1) if not GMC policy
      if (item.id === 1 && !isGMCPolicy) {
        return false;
      }
      return true;
    });
  }, [isGMCPolicy]);

  return (
    
      <Container>
        <Heading>{PortalConfigurationTitle}</Heading>

        <CardsContainer>
          {filteredPortalItems.map((item) => {
            // Special handling for Contact Metrics card (id === 4)
            const isContactMetricsCard = item.id === 4;
            const p1Value = isContactMetricsCard
              ? portalConfigData?.data?.contactMatrix?.lastConfiguredAt ?? "--"
              : getNestedValue(portalConfigData?.data, item.p1Key) ?? "--";
            const p2Value = isContactMetricsCard
              ? portalConfigData?.data?.contactMatrix?.configuredBy ?? "--"
              : getNestedValue(portalConfigData?.data, item.p2Key) ?? "--";
            const p3Value = isContactMetricsCard
              ? (portalConfigData?.data?.contactMatrix?.configured ? "Configured" : "Not Configured")
              : getNestedValue(portalConfigData?.data, item.p3Key) ?? "--";
            const hasUpdatedData =
              getNestedValue(portalConfigData?.data, item?.hasUploadedData) ??
              false;
            
            const isContactMetricsConfigured = portalConfigData?.data?.contactMatrix?.configured ?? false;
            const contactMetricsHasData = isContactMetricsCard ? isContactMetricsConfigured : hasUpdatedData;
            
            const primaryButtonLabel =
              item.id === 3 && hasUpdatedData
                ? "Replace File"
                : isContactMetricsCard && isContactMetricsConfigured
                ? "Edit Contact"
                : item.buttonText;

            return (
              <Card key={item.id}>
                <CardIconTextContainer>
                  {item.icon && (
                    <CardIcon src={item.icon} alt={`${item.title} icon`} />
                  )}
                  <CardTextContainer>
                    <CardTitle>{item.title}</CardTitle>
                  </CardTextContainer>
                </CardIconTextContainer>
                <CardInfoContainer>
                  <>
                    <CardInfoRow>
                      <CardInfoLabel>{item.p1}</CardInfoLabel>
                      <CardInfoValue>
                        {/* {formatDate(hospitalNetWorkData?.uploadedAt)} */}
                        {p1Value}
                      </CardInfoValue>
                    </CardInfoRow>

                    <CardInfoRow>
                      <CardInfoLabel>{item.p2}</CardInfoLabel>
                      <CardInfoValue>{p2Value}</CardInfoValue>
                    </CardInfoRow>

                    <CardInfoRow>
                      <CardInfoLabel>{item.p3}</CardInfoLabel>
                      <CardInfoValue>{p3Value}</CardInfoValue>
                    </CardInfoRow>
                  </>
                </CardInfoContainer>

                <ButtonContainer>
                  <CardButton
                    onClick={() =>
                      handleCardButtonClick(item.id, hasUpdatedData)
                    }
                    backgroundColor={item.backgroundColor}
                  >
                    {primaryButtonLabel}
                  </CardButton>
                  <CardButton
                    onClick={() =>
                      isContactMetricsCard ? handleContactMetricsView() : handleView(item.id)
                    }
                    disabled={!contactMetricsHasData}
                  >
                    {VIEW}
                  </CardButton>
                  {item.id === 3 && hasUpdatedData && (
                    <CardButton
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      style={{ color: "#D32F2F", borderColor: "#D32F2F" }}
                    >
                      Delete
                    </CardButton>
                  )}
                </ButtonContainer>
              </Card>
            );
          })}
          {["Ecards"].map((item) => (
            <Card key={item}>
              <CardTitle>{item}</CardTitle>
              <CardInfoRow>
                <CardInfoValue>Work in progress...</CardInfoValue>
              </CardInfoRow>
            </Card>
          ))}
        </CardsContainer>
        {/* <PortalConfiguration
          open={isModalOpen}
          handleClose={() => setModalOpen(false)}
          onConfigure={() => handleConfigureClick()}
          onView={() => handleView()}
        /> */}
        {isGMCPolicy && (
          <HospitalUpload
            open={isModalOpen}
            handleClose={() => setModalOpen(false)}
            onUpload={() => {}}
            policyId={policyId}
            onView={() => handleView(1)}
            hasUploadedData={hasUploadedData}
          />
        )}

        <FaqDocUpload
          open={isChildFaqModalOpen}
          handleClose={() => setIsChildFaqModalOpen(false)}
          onUpload={() => {}}
          policyId={policyId}
          onView={() => handleView(2)}
          hasUploadedData={hasUploadedData}
        />
        <PolicyFeatureUpload
          open={isPolicyFeatureModalOpen}
          handleClose={() => setIsPolicyFeatureModalOpen(false)}
          onUpload={() => {}}
          policyId={policyId}
          onView={() => handleView(3)}
          hasUploadedData={hasUploadedData}
        />
        <ContactMetrics
          open={isContactMetricsModalOpen}
          handleClose={() => setIsContactMetricsModalOpen(false)}
          policyId={policyId}
          onView={() => handleView(4)}
          mode={contactMetricsMode}
          onSuccess={() => refetchPortalConfigData()}
        />

        <CustomModal
          open={isDeleteConfirmOpen}
          handleClose={() =>
            !isDeletingPolicyFeature && setIsDeleteConfirmOpen(false)
          }
          heading="Delete Policy Feature Document"
          modalBoxStyles={{ maxWidth: "440px", width: "100%" }}
        >
          <Stack spacing={3} sx={{ p: 1 }}>
            <Typography sx={{ fontSize: 14, color: "#4B5563", lineHeight: 1.5 }}>
              Are you sure you want to delete this policy feature document?
              Employees will no longer be able to view it.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <CardButton
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeletingPolicyFeature}
              >
                Cancel
              </CardButton>
              <CardButton
                onClick={confirmDeletePolicyFeatureDocument}
                disabled={isDeletingPolicyFeature}
                style={{ color: "#D32F2F", borderColor: "#D32F2F" }}
              >
                {isDeletingPolicyFeature ? "Deleting..." : "Delete"}
              </CardButton>
            </Stack>
          </Stack>
        </CustomModal>
      </Container>
  );
};

export default PortalConfigurationTab;
