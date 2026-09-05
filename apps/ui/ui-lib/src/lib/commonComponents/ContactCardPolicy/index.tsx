import { Box } from "@mui/material";
import React from "react";

import cardBg from "../../assets/svgs/card-bg.svg";
import {
  IconWrapper,
  PolicyContacytStyledCard,
  ContactPolicyCardStyledDivider,
  PolicyCardTagText,
} from "./styles.js";
import map from "../../assets/pngs/map.png";
import phoneIcon from "../../assets/svgs/phone.svg";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CardFooter,
  CardImage,
  ContactInfoItem,
  ContactName,
  InfoText,
  StyledCardContent,
} from "../ContactCard/styles";
import {
  buildBreadcrumbState,
  createBreadcrumbEntry,
  getBreadcrumbsFromState,
} from "@ui/ui-lib/utils";
import {
  BREADCRUMB_KEYS,
  DETAILS_KEYS,
  DETAILS_LABELS,
} from "@ui/ui-lib/constants";

// Define types for the contact information
export interface PolicyContactInfo {
  id: number;
  displayName: string;
  communicationDetails?: Array<{
    id: number;
    communicationType: string;
    communicationDetails: string;
    isPrimary: boolean;
  }>;
  location?: string;
}

// Define props for the card component
interface ContactCardProps {
  contact: PolicyContactInfo;
  typeOfContact?: "insurer" | "tpa" | "company"; //add
  dataTestid?: string; // Optional prop for testing purposes
}

// Component implementation
const ContactCardPolicy: React.FC<ContactCardProps> = ({
  contact,
  typeOfContact = "company",
  dataTestid,
}) => {
  // Find primary email and phone with null check
  const address =
    contact.communicationDetails?.find(
      (comm) => comm.communicationType === "map" && comm.isPrimary
    )?.communicationDetails || "";

  const primaryPhone =
    contact.communicationDetails?.find(
      (comm) => comm.communicationType === "phone" && comm.isPrimary
    )?.communicationDetails || "";

  // Format the name with salutation if available

  //to navigate
  const navigate = useNavigate();
  const location = useLocation();
  const { id: policyId } = useParams();

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const existingPolicyBreadcrumbs =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: DETAILS_LABELS.POLICY,
            path: `/policies/${policyId}`,
            key: BREADCRUMB_KEYS.POLICY,
          }),
        ];

  const handleContactClick = (
    contactId: number,
    typeOfContact: string,
    contactName: string
  ) => {
    if (
      contactId === undefined ||
      typeOfContact === undefined ||
      contactId === null
    )
      return;

    if (typeOfContact === "company") {
      const destinationConfig = {
        label: contactName || DETAILS_LABELS.CONTACT,
        path: `/contact/${contactId}`,
        key: DETAILS_KEYS.CONTACT,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: existingPolicyBreadcrumbs,
        crumb: destinationConfig,
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/contact/${contactId}`);
    } else {
      const destinationConfig = {
        label: contactName || DETAILS_LABELS.CONTACT,
        path: `/${typeOfContact}/contact/${contactId}`,
        key: DETAILS_KEYS.CONTACT,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: existingPolicyBreadcrumbs,
        crumb: destinationConfig,
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/${typeOfContact}/contact/${contactId}`);
    }
  };

  return (
    <PolicyContacytStyledCard data-testid={dataTestid}>
      <CardImage src={cardBg} alt="Add" />
      <StyledCardContent>
        <ContactName
          variant="h5"
          title={contact.displayName}
          onClick={() => {
            handleContactClick(contact.id, typeOfContact, contact.displayName);
          }}
          data-testid={`${dataTestid}-title`}
        >
          {contact.displayName}
        </ContactName>
        <Box>
          <ContactInfoItem>
            <IconWrapper>
              <img src={phoneIcon} alt="Phone" />
            </IconWrapper>
            <InfoText>{primaryPhone ? primaryPhone : "-"}</InfoText>
          </ContactInfoItem>

          <ContactInfoItem>
            <IconWrapper>
              <img src={map} alt="Map" className="map" />
            </IconWrapper>
            <InfoText title={address ?? address}>
              {address ? address : "-"}
            </InfoText>
          </ContactInfoItem>
        </Box>

        <CardFooter>
          <ContactPolicyCardStyledDivider />

          <PolicyCardTagText>
            {contact.location ? contact.location : "-"}
          </PolicyCardTagText>
        </CardFooter>
      </StyledCardContent>
    </PolicyContacytStyledCard>
  );
};

export default ContactCardPolicy;
