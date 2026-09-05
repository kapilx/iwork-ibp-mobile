import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../Button";
import ContactCard, { ContactCardInfo } from "../ContactCard";
import ContactCardPolicy from "../ContactCardPolicy";
import ImageText from "../ImageText";
import backgroundImage from "../../assets/webp/no-data-found-background-image.webp";
import {
  CardsGridContainer,
  GridItem,
  NoDataBox,
  CardsGridNoDataText,
  TitleContainer,
} from "./styles";
import leadCrmImage from "../../assets/svgs/lead-crm.svg";
import { Box } from "@mui/material";
import leadCrmPolicyImage from "../../assets/svgs/lead-crm-policy.svg";
import {
  COMPANY_CONTACT,
  COMPANY,
  INSURER,
  TPA,
  TPA_CONTACT,
} from "../../constants";

// Tab key used when navigating back to a company's contact list
const COMPANY_CONTACTS_TAB = "contacts";

interface CardGridProps {
  contacts: ContactCardInfo[];
  companyName: string;
  companyId?: string;
  hideAddContact?: boolean;
  policyDetails?: boolean;
  displayName?: string;
  contactVariant?: "insurer" | "tpa" | "coInsurer" | "company";
}

const CardGrid: React.FC<CardGridProps> = ({
  contacts,
  companyName,
  companyId,
  hideAddContact = false,
  policyDetails = false,
  displayName = "",
  contactVariant,
}) => {
  let url =
    contactVariant === "tpa"
      ? "/tpa/contact/new"
      : contactVariant === "insurer"
      ? "/insurer/contact/new"
      : "/contact/new";
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(url, {
      state: {
        companyId: companyId,
        activeTabKey: COMPANY_CONTACTS_TAB,
      },
    });
  };
  const typeOfContact =
    displayName === TPA_CONTACT
      ? TPA
      : displayName === COMPANY_CONTACT
      ? COMPANY
      : INSURER;

  const containerName = displayName
    ? `card-grid-container-${displayName}`
        .replace(/[\s\-]+/g, "-")
        .toLowerCase()
    : "card-grid-container";

  return (
    <CardsGridContainer data-testid={containerName}>
      {contacts.length > 0 ? (
        <>
          <TitleContainer>
            <ImageText
              sectionImage={policyDetails ? leadCrmPolicyImage : leadCrmImage}
              sectionTitle={displayName ? displayName : "Contacts"}
              imageStyles={{
                width: policyDetails ? "24px" : "20px",
                height: "24px",
                marginTop: "-2px",
                marginLeft: "3px",
              }}
            />
            {!hideAddContact && (
              <Button
                label="Add contact"
                onClick={handleClick}
                variantType="secondary"
              />
            )}
          </TitleContainer>
          <GridItem container data-testid="contacts-container">
            {contacts.map((contact, index) =>
              policyDetails ? (
                <ContactCardPolicy
                  contact={contact}
                  typeOfContact={typeOfContact}
                  dataTestid={`policy-contact-${index}`}
                />
              ) : (
                <ContactCard
                  contact={contact}
                  dataTestid={`policy-contact-${index}`}
                />
              )
            )}
          </GridItem>
        </>
      ) : (
        <>
          <TitleContainer>
            <ImageText
              sectionImage={leadCrmImage}
              sectionTitle={"Contacts"}
              imageStyles={{
                width: "20px",
                height: "24px",
                marginTop: "-2px",
                marginLeft: "3px",
              }}
            />
            {!hideAddContact && (
              <Button
                label="Add contact"
                onClick={handleClick}
                variantType="secondary"
              />
            )}
          </TitleContainer>
          <Box>
            <NoDataBox>
              <img src={backgroundImage} alt="" />
              <CardsGridNoDataText>
                No Contacts for {companyName}!
              </CardsGridNoDataText>
            </NoDataBox>
          </Box>
        </>
      )}
    </CardsGridContainer>
  );
};

export default CardGrid;
