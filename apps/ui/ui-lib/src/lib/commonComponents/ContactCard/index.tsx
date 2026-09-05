import { Box } from "@mui/material";
import React from "react";

import cardBg from "../../assets/svgs/card-bg.svg";
import {
  CardFooter,
  CardImage,
  ContactInfoItem,
  ContactName,
  ContactCardIconWrapper,
  InfoText,
  ContactStyledCard,
  StyledCardContent,
  StyledDivider,
  TagText,
} from "./styles";
import mailIcon from "../../assets/svgs/mail.svg";
import phoneIcon from "../../assets/svgs/phone.svg";
import { useLocation, useNavigate } from "react-router-dom";
import {
  buildBreadcrumbState,
  createBreadcrumbEntry,
  getBreadcrumbsFromState,
} from "@ui/ui-lib/utils";
import { BREADCRUMB_KEYS } from "@ui/ui-lib";
// Define types for the contact information
export interface ContactCardInfo {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  displayName: string;
  salutation?: {
    id: number;
    lookUpValue: string;
  };
  status?: {
    id: number;
    lookUpValue: string;
  };
  communicationDetails?: Array<{
    id: number;
    communicationType: string;
    communicationDetails: string;
    isPrimary: boolean;
  }>;
  owner?: {
    userId: number;
    firstName: string;
    lastName: string;
  };
  department?: string;
  designation?: string;
}

// Define props for the card component
interface ContactCardProps {
  contact: ContactCardInfo;
  dataTestid?: string; // Optional prop for testing purposes
}

// Component implementation
const ContactCard: React.FC<ContactCardProps> = ({ contact, dataTestid }) => {
  // Extract salutation from contact if available or use empty string
  const salutation = contact.salutation?.lookUpValue || "";
  const navigate = useNavigate();
  const location = useLocation();

  // Find primary email and phone with null check
  const primaryEmail =
    contact.communicationDetails?.find(
      (comm) => comm.communicationType === "email" && comm.isPrimary
    )?.communicationDetails || "";

  const primaryPhone =
    contact.communicationDetails?.find(
      (comm) => comm.communicationType === "phone" && comm.isPrimary
    )?.communicationDetails || "";

  // Format the name with salutation if available
  const formattedName = `${salutation} ${contact.firstName} ${contact.lastName}`;

  // Format position and company
  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const companyBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: `${contact?.firstName ?? "Contact"}`,
            path: `/contact/${contact?.id}`,
            key: BREADCRUMB_KEYS.CONTACT_DETAILS,
          }),
        ];

  return (
    <ContactStyledCard data-testid={dataTestid}>
      <CardImage src={cardBg} alt="Add" />
      <StyledCardContent>
        <ContactName
          variant="h5"
          title={formattedName}
          onClick={() => {
            // navigate(`/contact/${contact.id}`);
            const destinationConfig = {
              label: `${contact?.firstName ?? "Contact"}`,
              path: `/contact/${contact.id}`,
              key: BREADCRUMB_KEYS.CONTACT_DETAILS,
            };
            const destinationState = buildBreadcrumbState({
              breadcrumbs: companyBreadcrumb,
              crumb: destinationConfig,
            });

            navigate(destinationConfig.path, {
              state: destinationState,
            });
          }}
        >
          {formattedName}
        </ContactName>
        <Box>
          <ContactInfoItem>
            <ContactCardIconWrapper>
              <img src={mailIcon} alt="Mail" />
            </ContactCardIconWrapper>
            <InfoText title={primaryEmail ?? primaryEmail}>
              {primaryEmail ? primaryEmail : "-"}
            </InfoText>
          </ContactInfoItem>

          <ContactInfoItem>
            <ContactCardIconWrapper>
              <img src={phoneIcon} alt="Phone" />
            </ContactCardIconWrapper>
            <InfoText>{primaryPhone ? primaryPhone : "-"}</InfoText>
          </ContactInfoItem>
        </Box>

        <CardFooter>
          <StyledDivider />

          <TagText>{contact.designation ? contact.designation : "-"}</TagText>
        </CardFooter>
      </StyledCardContent>
    </ContactStyledCard>
  );
};

export default ContactCard;
