import React, { useMemo, useState } from "react";
import { Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Checkbox,
  useApiQuery,
  endPoints,
  AccordionTitles,
  Divider,
  BUTTON_LABELS,
  BUTTON_VARIANTS,
  Button,
  selectHasPermission,
  FeatureKey,
} from "@ui/ui-lib";
import noDataImage from "../../../assets/webp/no-data-found-background-image.webp";

import {
  PageContainer,
  Title,
  SubTitle,
  ContactsContainer,
  ContactsHeader,
  ContactList,
  ContactButtonsContainer,
  ContactSelectorContactName,
  NewContactTag,
  DividerContainer,
  StyledPrevButton,
  DefaultImageContainer,
  InactiveContactTag,
} from "./styles";
import {
  ADD_ANOTHER_CONTACT,
  PROCEED_TO_OPPORTUNITY,
  NO_CONTACTS_FOUND_PROMPT,
  CONTACTS_FOUND_MESSAGE,
  NEWLY_CREATED_LABEL,
  BACK,
  NO_DATA_IMAGE_ALT,
  ADD_CONTACT,
  BUSINESS_CARD_CONTACT_PROMPT,
  CREATE_QUICK_CONTACT,
  INACTIVE,
} from "../../../constants";
import { useSelector } from "react-redux";

export type EntryType = "company" | "contact" | "opportunity";

const ContactSelector = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const entry: EntryType = useMemo(() => {
    const cta = location.state?.cta;
    if (cta === "addContact") return "contact";
    if (cta === "createOpportunity") return "opportunity";
    return "company";
  }, [location.state]);

  const companyInfo = location.state?.[AccordionTitles.COMPANY_SELECTION] || {};
  const companyId = companyInfo.id;
  const companyName = companyInfo.label || "";
  const isCreated = location.state?.isCreated || false;
  const newContactIds: number[] = location.state?.newContactIds || [];

  const { data } = useApiQuery({
    url: endPoints.companyDetailsById(Number(companyId)),
    queryKey: ["companyDetails", companyId],
    enabled: Boolean(companyId),
  });

  const contacts: { id: number; label: string }[] =
    data?.data?.contacts?.map((c: any) => ({
      id: c.id,
      label: c.displayName || `${c.firstName} ${c.lastName}`,
      status: c.status,
    })) || [];

  const [selected, setSelected] = useState<string[]>(newContactIds);
  const handleCheck = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Header messages
  let title = "";
  let subTitle: string | undefined;
  if (isCreated) {
    if (entry === "company") {
      title = `Company "${companyName}" created successfully!`;
      subTitle =
        "Would you like to now add a contact? (Required to create an opportunity).";
    } else if (entry === "contact") {
      title = `Company "${companyName}" created successfully! Let us now continue to create a contact.`;
    } else {
      title = `Company "${companyName}" created successfully! Let me help you create an opportunity also.`;
      subTitle =
        "But first, contacts need to be added before creating an Opportunity";
    }
  } else {
    if (entry === "company") {
      title = `Company "${companyName}" selected`;
      subTitle =
        "Would you like to now add a contact? (Required to create an opportunity).";
    } else if (entry === "contact") {
      title = `Company "${companyName}" selected. Let us now continue to create a contact.`;
    } else {
      title = `Company "${companyName}" selected! Let me help you create an opportunity also.`;
      subTitle =
        "But first, contacts need to be selected/added before creating an opportunity";
    }
  }

  const prompt = contacts.length
    ? `${contacts.length} ${CONTACTS_FOUND_MESSAGE}`
    : NO_CONTACTS_FOUND_PROMPT;

  const handleBack = () => {
    navigate("/create", { state: location.state });
  };

  const handleCancel = () => {
    const path = location.state?.originPath || "/dashboard";
    navigate(path, {
      state: {
        activeTabKey: location.state?.activeTabKey,
      },
    });
  };

  const businessCardInfo =
    location.state?.[AccordionTitles.COMPANY_SELECTION]?.businessCardInfo;

  const handleAddContact = () => {
    const baseState = { ...location.state };

    baseState[AccordionTitles.COMPANY_SELECTION] = {
      id: companyId,
      label: companyName,
      businessCardInfo: businessCardInfo,
    };

    baseState.newContactIds = newContactIds;

    navigate("/contact/new", { state: baseState });
  };

  const handleAddQuickContact = () => {
    const baseState = { ...location.state };

    baseState[AccordionTitles.COMPANY_SELECTION] = {
      id: companyId,
      label: companyName,
      businessCardInfo: businessCardInfo,
      isQuickContactCreation: true,
    };

    baseState.newContactIds = newContactIds;

    navigate("/smart-assist-create", { state: baseState });
  };

  const handleProceed = () => {
    const state: any = {
      ...location.state,
    };
    state[AccordionTitles.COMPANY_SELECTION] = {
      id: companyId,
      label: companyName,
    };
    state[AccordionTitles.CONTACT_SELECTION] = { values: selected };
    state.newContactIds = newContactIds;
    navigate("/opportunities/new", { state });
  };

  const hasCreateContactPermission = useSelector(
    selectHasPermission(FeatureKey.CREATE_CONTACT)
  );

  const hasCreateOpportunityPermission = useSelector(
    selectHasPermission(FeatureKey.CREATE_OPPORTUNITY)
  );

  const proceedDisabled =
    contacts.length === 0 ||
    selected.length === 0 ||
    !hasCreateOpportunityPermission;

  return (
    <PageContainer>
      <Title variant="h4" title={title}>
        {title}
      </Title>
      {subTitle && <SubTitle>{subTitle}</SubTitle>}
      <ContactsContainer>
        <ContactsHeader variant="h6">
          Contacts ({String(selected.length).padStart(2, "0")} Selected)
        </ContactsHeader>
        <Typography>{prompt}</Typography>
        {businessCardInfo && (
          <Typography>
            {BUSINESS_CARD_CONTACT_PROMPT(
              businessCardInfo?.name,
              contacts?.length > 0
            )}
          </Typography>
        )}
        <DividerContainer>
          <Divider />
        </DividerContainer>
        {contacts.length === 0 ? (
          <DefaultImageContainer>
            <img src={noDataImage} alt={NO_DATA_IMAGE_ALT} width="100%" />
          </DefaultImageContainer>
        ) : (
          <ContactList data-testid="contacts-list">
            {contacts.map((c) => {
              const isInactive = c.status === INACTIVE;
              return (
                <Checkbox
                  key={c.id}
                  label={
                    <>
                      <ContactSelectorContactName
                        highlight={newContactIds.includes(c.id)}
                        isInactive={isInactive}
                      >
                        {c.label}
                      </ContactSelectorContactName>
                      {isInactive && (
                        <InactiveContactTag>(Inactive)</InactiveContactTag>
                      )}
                      {newContactIds.includes(c.id) && (
                        <NewContactTag> {NEWLY_CREATED_LABEL}</NewContactTag>
                      )}
                    </>
                  }
                  isChecked={selected.includes(c.id)}
                  onChange={() => handleCheck(c.id)}
                  disabled={isInactive}
                />
              );
            })}
          </ContactList>
        )}
      </ContactsContainer>
      <ContactButtonsContainer>
        <StyledPrevButton
          variantType={BUTTON_VARIANTS.SECONDARY}
          onClick={handleBack}
          label={BACK}
        />

        <StyledPrevButton
          variantType={BUTTON_VARIANTS.SECONDARY}
          onClick={handleCancel}
          label={BUTTON_LABELS.CANCEL}
        />
        <Button
          variantType={BUTTON_VARIANTS.PRIMARY}
          onClick={handleAddQuickContact}
          disabled={!hasCreateContactPermission}
        >
          {CREATE_QUICK_CONTACT}
        </Button>
        {contacts?.length > 0 ? (
          <Button
            variantType={BUTTON_VARIANTS.PRIMARY}
            onClick={handleAddContact}
            disabled={!hasCreateContactPermission}
          >
            {ADD_ANOTHER_CONTACT}
          </Button>
        ) : (
          <Button
            variantType={BUTTON_VARIANTS.PRIMARY}
            onClick={handleAddContact}
            disabled={!hasCreateContactPermission}
          >
            {ADD_CONTACT}
          </Button>
        )}
        <Button
          variantType={BUTTON_VARIANTS.PRIMARY}
          onClick={handleProceed}
          disabled={proceedDisabled}
        >
          {PROCEED_TO_OPPORTUNITY}
        </Button>
      </ContactButtonsContainer>
    </PageContainer>
  );
};

export default ContactSelector;
