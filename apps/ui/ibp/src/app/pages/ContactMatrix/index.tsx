import React, { useEffect, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import { fetchCompanyTemplate } from "../../redux/companyTemplateSlice";
import { ContactDetail } from "./config";
import {
  ContactMatrixContainer,
  PageHeader,
  PageTitle,
  SupportTimingRow,
  AccordionContainer,
  ContactAccordionWrapper,
  AccordionAnswer,
  ContactSection,
  ContactCard,
  ContactTitle,
  ContactDivider,
  ContactField,
  ContactLabel,
  ContactValue,
  SectionBlock,
  SectionHeader,
  SectionHeaderTitle,
} from "./styles";
import { Box, Tooltip } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const ContactMatrixPage = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const companyId = userDetails?.companyId;

  const companyTemplate = useSelector(
    (state: RootState) => state.companyTemplate.data
  );
  const contactMatrixConfig =
    (companyTemplate as any)?.config?.contactMatrix ??
    (companyTemplate as any)?.contactMatrix ??
    {};

  // const { data: contactMatrixData, isLoading } = useApiQuery({
  //   url: employeeId ? endPoints.employeeContactMatrix(employeeId) : "",
  //   queryKey: ["employeeContactMatrix", employeeId],
  //   enabled: Boolean(employeeId),
  // });

  useEffect(() => {
    if (companyId) {
      dispatch(fetchCompanyTemplate(companyId));
    }
  }, [companyId, dispatch]);

  // useEffect(() => {
  //   if (!contactMatrixData?.data?.policies) return;
  //   ...
  // }, [contactMatrixData, theme]);

  const companyContacts = useMemo(() => {
    const accentColor =
      (theme.palette.text as any)?.deepOrangeColor ||
      (theme.palette.text as any)?.Deeporange ||
      theme.palette.border.secondary;

    const toContactDetails = (contact: any, prefix: string): ContactDetail[] => {
      const safeContact = contact || {};
      return [
        { label: `${prefix} Name`, value: safeContact.name || "--" },
        { label: `${prefix} Phone Number`, value: safeContact.phone || "--" },
        { label: `${prefix} Email`, value: safeContact.email || "--" },
      ];
    };

    const buildSection = (config: any, title: string, id: number) => ({
      id,
      title,
      bgColor: "transparent",
      textColor: accentColor,
      isRequired: config?.isRequired,
      primaryEscalation: toContactDetails(config?.primaryEscalation, "Primary"),
      secondaryEscalation: toContactDetails(config?.secondaryEscalation, "Secondary"),
    });

    return [
      buildSection(contactMatrixConfig?.tpa, "TPA", 1),
      buildSection(contactMatrixConfig?.broker, "Broker", 2),
      buildSection(contactMatrixConfig?.hrContacts, "HR Contacts", 3),
      buildSection(contactMatrixConfig?.dpoContacts, "DPO Contacts", 4),
      buildSection(contactMatrixConfig?.grievanceContacts, "Grievance Contacts", 5),
      // Hide a section only when explicitly marked not required (isRequired === false).
      // Missing/undefined (legacy data) stays visible.
    ].filter((section) => section.isRequired !== false);
  }, [contactMatrixConfig, theme]);

  const getPolicyIcon = (policyTitle: string) => {
    const title = policyTitle.toLowerCase();
    if (title.includes("term life") || title.includes("gtl")) {
      return groupTermPolicyIcon;
    } else if (title.includes("personal accident") || title.includes("gpa")) {
      return groupPersonalAccidentIcon;
    } else if (title.includes("medical") || title.includes("mediclaim") || title.includes("gmc")) {
      return groupMedicalPolicyIcon;
    }
    return groupMedicalPolicyIcon; // default
  };

  const renderContactCard = (contacts: ContactDetail[], title: string) => (
    <ContactCard>
      {title && <ContactTitle>{title}</ContactTitle>}
      {contacts.map((contact, index) => (
        <ContactField key={index}>
          <ContactLabel>{contact.label}</ContactLabel>
          <Tooltip title={contact.value !== "--" ? contact.value : ""} placement="top">
            <ContactValue>{contact.value}</ContactValue>
          </Tooltip>
        </ContactField>
      ))}
    </ContactCard>
  );

  return (
    <ContactMatrixContainer>
      <PageHeader>
        <PageTitle>Contacts</PageTitle>
        {contactMatrixConfig?.supportTimings && (
          <SupportTimingRow>
            <AccessTimeIcon sx={{ fontSize: 20, flexShrink: 0 }} />
            <span>{contactMatrixConfig.supportTimings}</span>
          </SupportTimingRow>
        )}
        {/* <CloseButton onClick={() => navigate(-1)}>
          <img src={supportCancelButton} alt="Close" />
        </CloseButton> */}
      </PageHeader>

      <ContactAccordionWrapper>
        <AccordionContainer>
          {/* {isLoading && <CommonLoader />} */}
          {/* {!isLoading && policyContactData.length === 0 && (
            <EmptyState>No contact details available.</EmptyState>
          )} */}
          {/* {policyContactData.map((policy, policyIndex) => (
            <Box key={policy.title}>
              <AccordionAnswer>
                {policy.contacts.map((section) => (
                  <SectionBlock key={section.id}>
                    <SectionHeader
                      bgColor={section.bgColor}
                      textColor={section.textColor}
                    >
                      <SectionHeaderTitle>{section.title}</SectionHeaderTitle>
                    </SectionHeader>
                    <ContactSection>
                      {renderContactCard(
                        section.primaryEscalation,
                        "Primary Escalation"
                      )}
                      {renderContactCard(
                        section.nextLevelEscalation,
                        "Secondary Escalation"
                      )}
                    </ContactSection>
                  </SectionBlock>
                ))}
              </AccordionAnswer>
            </Box>
          ))} */}

          {companyContacts.length > 0 && (
            <Box>
              <AccordionAnswer>
                {companyContacts.map((section) => (
                  <SectionBlock key={section.id}>
                    <SectionHeader
                      bgColor={section.bgColor}
                      textColor={section.textColor}
                    >
                      <SectionHeaderTitle>{section.title}</SectionHeaderTitle>
                    </SectionHeader>
                    <ContactSection>
                      {renderContactCard(section.primaryEscalation, "Primary Escalation")}
                      {renderContactCard(section.secondaryEscalation, "Secondary Escalation")}
                    </ContactSection>
                  </SectionBlock>
                ))}
              </AccordionAnswer>
            </Box>
          )}
        </AccordionContainer>
      </ContactAccordionWrapper>
    </ContactMatrixContainer>
  );
};

export default ContactMatrixPage;
