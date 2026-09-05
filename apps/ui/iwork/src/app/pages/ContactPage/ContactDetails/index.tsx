import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Typography } from "@mui/material";
import { ContactDetailsContainer, ButtonContainer } from "./styles";
import {
  contactBreadcrumbs,
  contactTabsConfig,
  contactInformation,
  relationships,
  contactSummaryCard,
  childInfo,
  professional,
  qualification,
  achievements,
  CommunicatonDetails,
} from "./detailsConfig";
import {
  endPoints,
  Button,
  useApi,
  CustomTabs,
  CommonBreadcrumb,
  CommonDetailsSection,
  NO_DATA_AVAILABLE,
  NOT_AVAILABLE,
  SummaryCard,
  theme,
  selectHasPermission,
  FeatureKey,
} from "@ui/ui-lib";
import editIcon from "../../../assets/svgs/edit-icon.svg";
import { DESIGNAION, EDIT } from "../../../constants";
import AddressSection from "../../../components/AddressSection";
import { OverviewCardBackground } from "../../CompanyPage/CompanyDetails/styles";
import { useSelector } from "react-redux";
import ContactSalesOpportunities from "../../../components/ContactOpportunities";
import ContactRenewalOpportunities from "../../../components/ContactOpportunities/ContactRenewalOpportunities";
import ContactPolicyList from "../../../components/PolicyList/contactPoliciyList";

// Map sections to their respective configurations
const sectionMap = {
  contactInformation,
  relationships,
  professional,
  qualification,
  achievements,
};
const ContactDetails: React.FC = () => {
  const [contactData, setContactData] = useState<T | null>(null);
  const { data, doFetch, error } = useApi();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canUpdateContact = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EDIT_CONTACT)(state)
  );

  const location = useLocation();

  // Fetch contact details by ID
  useEffect(() => {
    if (id) {
      doFetch(endPoints.contactById(Number(id)));
    }
  }, [id]);

  // Set contact data when API response is received
  useEffect(() => {
    if (data) {
      setContactData(data.data);
    }
  }, [data]);

  // Handle API errors
  // useEffect(() => {
  //   if (error) {
  //     console.error("Error fetching contact details:", error);
  //   }
  // }, [error]);
  useEffect(() => {
    if (error?.status === 403) {
      navigate("/unauthorized", { replace: true });
    }
  }, [error, navigate]);

  const canViewPolicy = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_POLICY)(state)
  );

  const filteredTabs = contactTabsConfig.filter(
    (tab) =>
      canViewPolicy ||
      (tab.componentKey !== "ContactSalesOpportunities" &&
        tab.componentKey !== "ContactRenewalOpportunities" &&
        tab.componentKey !== "PolicyList")
  );
  // Navigate to the edit page
  const handleUpdateContact = () => {
    if (id) {
      navigate(`/contact/${id}/edit`);
    }
  };

  // Render a message if no contact data is available
  if (!contactData) {
    return (
      <ContactDetailsContainer>
        <Typography variant="h6" align="center" color="textSecondary">
          {NO_DATA_AVAILABLE}
        </Typography>
      </ContactDetailsContainer>
    );
  }
  // Generate tabs dynamically based on the configuration
  const tabs = filteredTabs.map((tab) => {
    if (tab.sectionKey === "contactInformation") {
      const allSections = [...contactInformation, ...CommunicatonDetails];
      return {
        ...tab,
        content: (
          <div>
            {allSections.map((section, index) => (
              <OverviewCardBackground key={`section-${index}`}>
                <CommonDetailsSection sections={[section]} data={contactData} />
              </OverviewCardBackground>
            ))}
            <AddressSection companyAddresses={contactData?.address} />
          </div>
        ),
      };
    }
    if (tab.sectionKey === "relationships") {
      const allSections = [...relationships, ...childInfo]; // Combine all sections

      return {
        ...tab,
        content: (
          <div>
            {allSections.map((section, index) => (
              <OverviewCardBackground key={`section-${index}`}>
                <CommonDetailsSection sections={[section]} data={contactData} />
              </OverviewCardBackground>
            ))}
          </div>
        ),
      };
    }
    if (tab.sectionKey === "professional") {
      const section = sectionMap[tab.sectionKey];
      return {
        ...tab,
        content: (
          <div>
            <OverviewCardBackground>
              <CommonDetailsSection sections={section} data={contactData} />
            </OverviewCardBackground>
          </div>
        ),
      };
    }
    if (tab.sectionKey === "qualification") {
      const section = sectionMap[tab.sectionKey];
      return {
        ...tab,
        content: (
          <div>
            <OverviewCardBackground>
              <CommonDetailsSection sections={section} data={contactData} />
            </OverviewCardBackground>
          </div>
        ),
      };
    }
    if (tab.sectionKey === "achievements") {
      const section = sectionMap[tab.sectionKey];
      return {
        ...tab,
        content: (
          <div>
            <OverviewCardBackground>
              <CommonDetailsSection sections={section} data={contactData} />
            </OverviewCardBackground>
          </div>
        ),
      };
    }
    if (tab.componentKey === "ContactSalesOpportunities") {
      return {
        ...tab,
        content: (
          <ContactSalesOpportunities
            contactData={{
              displayName: contactData?.displayName,
              contactId: contactData?.id,
              companyId: contactData?.company?.id,
              companyName: contactData?.company?.companyName,
            }}
          />
        ),
      };
    }
    if (tab.componentKey === "ContactRenewalOpportunities") {
      return {
        ...tab,
        content: <ContactRenewalOpportunities />,
      };
    }
    if (tab.componentKey === "PolicyList") {
      return {
        ...tab,
        content: (
          <ContactPolicyList
            values={{
              companyName: contactData?.company?.companyName,
              companyId: contactData?.company?.id,
            }}
          />
        ),
      };
    }
    if (tab.sectionKey) {
      const section = sectionMap[tab.sectionKey];
      return {
        ...tab,
        content: (
          <div>
            <CommonDetailsSection sections={section} data={contactData} />
          </div>
        ),
      };
    }
  });
  const getPrimaryEmail = (communicationDetails: any[]) => {
    const primaryEmail = communicationDetails?.find(
      (detail) => detail.communicationType === "email"
    );
    return primaryEmail ? primaryEmail.communicationDetails : NOT_AVAILABLE;
  };

  const getPrimaryPhone = (communicationDetails: any[]) => {
    const primaryPhone = communicationDetails?.find(
      (detail) => detail.communicationType === "phone"
    );
    return primaryPhone ? primaryPhone.communicationDetails : NOT_AVAILABLE;
  };

  return (
    <ContactDetailsContainer>
      <ButtonContainer>
        <CommonBreadcrumb
        crumbs={contactBreadcrumbs(
          (
            contactData?.firstName +
            (contactData?.middleName ? ` ${contactData.middleName}` : "") +
            " " +
            (contactData?.lastName ?? "")
          ).trim(),
          location.state?.from ? location.state?.from : null,
          location.state?.filters ? location.state?.filters : null
        )}
        />
        {canUpdateContact &&
          (contactData?.editable === undefined || contactData?.editable) && (
            <Button
              variantType="secondary"
              onClick={handleUpdateContact}
              className="edit-button"
            >
              <img src={editIcon} alt={EDIT} /> {EDIT}
            </Button>
          )}
      </ButtonContainer>
      <SummaryCard
        data={{
          displayName:
            contactData?.displayName ||
            `${contactData?.firstName ?? ""} ${
              contactData?.lastName ?? ""
            }`.trim(),
          company: {
            companyName: contactData.company.companyName as string,
            companyId: contactData.company.id as number,
          },
          linkedInUrl: contactData?.linkedInUrl as string,
          designation: contactData?.designation || (NOT_AVAILABLE as string),
          status: contactData?.status?.lookUpValue as string,
          phone: getPrimaryPhone(contactData?.communicationDetails) as string,
          email: getPrimaryEmail(contactData?.communicationDetails) as string,
        }}
        sections={contactSummaryCard}
        headerConfig={{
          titleKey: "displayName",
          chip: [
            {
              key: "designation",
              labelPrefix: DESIGNAION,
              labelStyles: "designation-label",
              ChipStyles: {
                backgroundColor: theme.palette.background.default,
                color: theme.palette.text.primary,
              },
            },
          ],
          linkedInButton: {
            onClick: () => {
              if (contactData?.linkedInUrl) {
                window.open(contactData.linkedInUrl, "_blank");
              }
            },
          },
        }}
      />
      <CustomTabs tabs={tabs} />
    </ContactDetailsContainer>
  );
};

export default ContactDetails;
