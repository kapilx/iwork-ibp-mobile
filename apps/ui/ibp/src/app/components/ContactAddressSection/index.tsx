import React from "react";
import { CircularProgress } from "@mui/material";
import {
  ALERT_MESSAGES,
  endPoints,
  setToastMessage,
  useApiMutation,
} from "@ui/ui-lib";
import { REGEX_PATTERNS } from "@ui/ui-lib/constants/regex";
import {
  SectionContainer,
  ContactSection,
  SectionHeader,
  SectionTitle,
  SubSection,
  SubSectionTitle,
  DividerLine,
  ContactInfoGrid,
  InfoItem,
  InfoLabel,
  InfoValue,
  ContactsWrapper,
  ContactColumn,
  InfoEditableField,
  AlternateInputOuter,
  AlternateInputContainer,
  AlternateInput,
  AlternateInputLoader,
  AlternateInputError,
  EditableFieldIcon,
} from "./styles";
import editBlueIcon from "../../assets/svgs/edit-blue-color-icon.svg";
import { useDispatch } from "react-redux";

interface ContactAddressSectionProps {
  primaryContactInfo: {
    phone?: string;
    email?: string;
  };
}
const ContactAddressSection: React.FC<ContactAddressSectionProps> = ({
  primaryContactInfo,
}) => {
  const dispatch = useDispatch();
  const [isAlternateUpdating, setIsAlternateUpdating] = React.useState(false);
  const [activeAlternateField, setActiveAlternateField] = React.useState<
    "alternatePhone" | "alternateEmail" | null
  >(null);
  const [isAlternateFormVisible, setIsAlternateFormVisible] =
    React.useState(false);
  const [alternatePhoneDraft, setAlternatePhoneDraft] = React.useState("");
  const [alternateEmailDraft, setAlternateEmailDraft] = React.useState("");
  const [alternatePhoneError, setAlternatePhoneError] = React.useState("");
  const [alternateEmailError, setAlternateEmailError] = React.useState("");
  const alternatePhoneContainerRef = React.useRef<HTMLDivElement | null>(null);
  const alternateEmailContainerRef = React.useRef<HTMLDivElement | null>(null);

  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const alternatePhone =
    userDetails?.alternatePhoneNumber ||
    userDetails?.additionalDetails?.["Alternate Phone"] ||
    userDetails?.additionalDetails?.alternatePhone ||
    "--";
  const alternateEmail =
    userDetails?.alternateEmail ||
    userDetails?.additionalDetails?.["Alternate Email"] ||
    userDetails?.additionalDetails?.alternateEmail ||
    "--";

  const { mutate: updateAlternateContact } = useApiMutation({
    config: {
      onSuccess: (updatedData: unknown) => {
        const response = updatedData as { data?: Record<string, unknown>; message?: string };
        const storedData = sessionStorage.getItem("user");

        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const updatedUserData = {
            ...parsedData,
            ...(response?.data || {}),
          };
          sessionStorage.setItem("user", JSON.stringify(updatedUserData));
          window.dispatchEvent(new Event("ibp:user-updated"));
        }

        setIsAlternateUpdating(false);
        setIsAlternateFormVisible(false);
        setActiveAlternateField(null);
        dispatch(
          setToastMessage(
            response?.message || "Alternate contact updated successfully.",
          ),
        );
      },
      onError: (error: unknown) => {
        const apiError = error as { message?: string | string[] };
        setIsAlternateUpdating(false);
        const errorMessage = Array.isArray(apiError?.message)
          ? apiError.message[0]
          : apiError?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleAlternateContactEdit = (
    fieldKey: "alternatePhone" | "alternateEmail",
  ) => {
    if (isAlternateUpdating) return;
    setActiveAlternateField(fieldKey);
    setIsAlternateFormVisible(true);

    setTimeout(() => {
      const currentValue = fieldKey === "alternatePhone" ? alternatePhone : alternateEmail;
      if (fieldKey === "alternatePhone") {
        setAlternatePhoneError("");
        setAlternatePhoneDraft(currentValue === "--" ? "" : currentValue);
      }
      if (fieldKey === "alternateEmail") {
        setAlternateEmailError("");
        setAlternateEmailDraft(currentValue === "--" ? "" : currentValue);
      }
    }, 0);
  };

  const handleAlternateContactSubmit = async (
    options?: { fallbackField?: "alternatePhone" | "alternateEmail"; silentNoChanges?: boolean },
  ) => {
    if (isAlternateUpdating) return;
    const targetField = activeAlternateField || options?.fallbackField;
    if (!targetField) return;

    let normalizedValue = "";
    if (targetField === "alternateEmail") {
      normalizedValue = String(alternateEmailDraft || "").trim();
      if (!normalizedValue) {
        setIsAlternateFormVisible(false);
        setActiveAlternateField(null);
        return;
      }
      if (!REGEX_PATTERNS.EMAIL.test(normalizedValue)) {
        setAlternateEmailError("Please enter a valid email address.");
        return;
      }
      setAlternateEmailError("");
    } else if (targetField === "alternatePhone") {
      normalizedValue = String(alternatePhoneDraft || "").trim();
      if (!normalizedValue) {
        setIsAlternateFormVisible(false);
        setActiveAlternateField(null);
        return;
      }
      if (
        !REGEX_PATTERNS.PHONE.test(normalizedValue) ||
        normalizedValue.replace(/\D/g, "").length < 10
      ) {
        setAlternatePhoneError("Please enter a valid phone number.");
        return;
      }
      setAlternatePhoneError("");
    }

    const currentValue =
      targetField === "alternatePhone" ? alternatePhone : alternateEmail;
    if (normalizedValue === currentValue) {
      setIsAlternateFormVisible(false);
      setActiveAlternateField(null);
      return;
    }

    const employeeId = userDetails?.id;
    if (!employeeId) {
      dispatch(setToastMessage("Employee ID not found."));
      return;
    }

    setIsAlternateUpdating(true);
    updateAlternateContact({
      endpoint: endPoints.updateEmployeeDetails(employeeId),
      method: "PUT",
      data: {
        ...(userDetails?.employeeName || userDetails?.fullName
          ? { employeeName: userDetails?.employeeName || userDetails?.fullName }
          : {}),
        ...(userDetails?.email ? { email: userDetails.email } : {}),
        ...(userDetails?.phone ? { phone: userDetails.phone } : {}),
        alternatePhoneNumber:
          targetField === "alternatePhone"
            ? normalizedValue
            : alternatePhone === "--"
              ? ""
              : alternatePhone,
        alternateEmail:
          targetField === "alternateEmail"
            ? normalizedValue
            : alternateEmail === "--"
              ? ""
              : alternateEmail,
      },
    });
  };

  // Single data structure containing both primary and secondary contact details
  const contactData = {
    primary: [
      {
        label: "Mobile Number",
        value: primaryContactInfo.phone || "--",
      },
      {
        label: "Primary Email",
        value: primaryContactInfo.email || "--",
      },
    ],
    secondary: [
      {
        label: "Alternate Phone Number",
        value: alternatePhone,
        edit: true,
        type: "number",
        fieldKey: "alternatePhone" as const,
      },
      {
        label: "Alternate Email",
        value: alternateEmail,
        edit: true,
        type: "email",
        fieldKey: "alternateEmail" as const,
      },
    ],
  };

  const hasSecondaryContact = contactData.secondary && contactData.secondary.length > 0;
  // const hasSecondaryAddress = addressData.secondary && addressData.secondary.length > 0;

  return (
    <SectionContainer>
      <ContactSection>
        <SectionHeader>
          <SectionTitle>Contact Information</SectionTitle>
        </SectionHeader>
        
        {hasSecondaryContact ? (
          <ContactsWrapper>
            <ContactColumn>
              <SubSectionTitle>Primary Contact</SubSectionTitle>
              <DividerLine />
              <ContactInfoGrid>
                {contactData.primary.map((item) => (
                  <InfoItem key={item.label}>
                    <InfoLabel>{item.label}</InfoLabel>
                    <InfoValue>{item.value || "--"}</InfoValue>
                  </InfoItem>
                ))}
              </ContactInfoGrid>
            </ContactColumn>
            
            <ContactColumn>
              <SubSectionTitle>Alternate Contact</SubSectionTitle>
              <DividerLine />
              <ContactInfoGrid>
                {contactData.secondary.map((item) => (
                  <InfoItem key={item.label}>
                    <InfoLabel>{item.label}</InfoLabel>
                    <InfoEditableField>
                      {isAlternateFormVisible &&
                      activeAlternateField === item.fieldKey ? (
                        <>
                          <AlternateInputOuter>
                            {activeAlternateField === "alternateEmail" ? (
                              <AlternateInputContainer
                                ref={alternateEmailContainerRef}
                                onBlurCapture={(event) => {
                                  const nextTarget = event.relatedTarget as Node | null;
                                  if (
                                    alternateEmailContainerRef.current &&
                                    nextTarget &&
                                    alternateEmailContainerRef.current.contains(nextTarget)
                                  ) {
                                    return;
                                  }
                                  void handleAlternateContactSubmit({
                                    fallbackField: "alternateEmail",
                                    silentNoChanges: true,
                                  });
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    void handleAlternateContactSubmit({
                                      fallbackField: "alternateEmail",
                                      silentNoChanges: true,
                                    });
                                  }
                                }}
                              >
                                <AlternateInput
                                  type="email"
                                  value={alternateEmailDraft}
                                  autoFocus
                                  hasError={Boolean(alternateEmailError)}
                                  hasLoader={
                                    isAlternateUpdating &&
                                    activeAlternateField === "alternateEmail"
                                  }
                                  onChange={(event) => {
                                    setAlternateEmailDraft(event.target.value);
                                    if (alternateEmailError) {
                                      setAlternateEmailError("");
                                    }
                                  }}
                                />
                                {isAlternateUpdating &&
                                activeAlternateField === "alternateEmail" ? (
                                  <AlternateInputLoader>
                                    <CircularProgress
                                      size={16}
                                      sx={{ color: "#1B4F95" }}
                                    />
                                  </AlternateInputLoader>
                                ) : null}
                                {alternateEmailError ? (
                                  <AlternateInputError>
                                    {alternateEmailError}
                                  </AlternateInputError>
                                ) : null}
                              </AlternateInputContainer>
                            ) : (
                              <AlternateInputContainer
                                ref={alternatePhoneContainerRef}
                                onBlurCapture={(event) => {
                                  const nextTarget = event.relatedTarget as Node | null;
                                  if (
                                    alternatePhoneContainerRef.current &&
                                    nextTarget &&
                                    alternatePhoneContainerRef.current.contains(nextTarget)
                                  ) {
                                    return;
                                  }
                                  void handleAlternateContactSubmit({
                                    fallbackField: "alternatePhone",
                                    silentNoChanges: true,
                                  });
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    void handleAlternateContactSubmit({
                                      fallbackField: "alternatePhone",
                                      silentNoChanges: true,
                                    });
                                  }
                                }}
                              >
                                <AlternateInput
                                  type="tel"
                                  value={alternatePhoneDraft}
                                  autoFocus
                                  hasError={Boolean(alternatePhoneError)}
                                  hasLoader={
                                    isAlternateUpdating &&
                                    activeAlternateField === "alternatePhone"
                                  }
                                  onChange={(event) => {
                                    setAlternatePhoneDraft(
                                      event.target.value.replace(/[^0-9+]/g, ""),
                                    );
                                    if (alternatePhoneError) {
                                      setAlternatePhoneError("");
                                    }
                                  }}
                                />
                                {isAlternateUpdating &&
                                activeAlternateField === "alternatePhone" ? (
                                  <AlternateInputLoader>
                                    <CircularProgress
                                      size={16}
                                      sx={{ color: "#1B4F95" }}
                                    />
                                  </AlternateInputLoader>
                                ) : null}
                                {alternatePhoneError ? (
                                  <AlternateInputError>
                                    {alternatePhoneError}
                                  </AlternateInputError>
                                ) : null}
                              </AlternateInputContainer>
                            )}
                          </AlternateInputOuter>
                        </>
                      ) : (
                        <>
                          <InfoValue>{item.value || "--"}</InfoValue>
                          <EditableFieldIcon
                            src={editBlueIcon}
                            alt="Edit"
                            onClick={() =>
                              handleAlternateContactEdit(item.fieldKey)
                            }
                          />
                        </>
                      )}
                      {isAlternateFormVisible && activeAlternateField === item.fieldKey && (
                        <EditableFieldIcon
                          src={editBlueIcon}
                          alt="Edit"
                          onClick={() => handleAlternateContactEdit(item.fieldKey)}
                          style={{ opacity: 0.5, cursor: isAlternateUpdating ? "not-allowed" : "pointer" }}
                        />
                      )}
                    </InfoEditableField>
                  </InfoItem>
                ))}
              </ContactInfoGrid>
            </ContactColumn>
          </ContactsWrapper>
        ) : (
          <SubSection>
            <SubSectionTitle>Primary Contact</SubSectionTitle>
            <DividerLine />
            <ContactInfoGrid>
              {contactData.primary.map((item) => (
                <InfoItem key={item.label}>
                  <InfoLabel>{item.label}</InfoLabel>
                  <InfoValue>{item.value || "--"}</InfoValue>
                </InfoItem>
              ))}
            </ContactInfoGrid>
          </SubSection>
        )}
      </ContactSection>

      {/* <AddressSection>
        <SectionHeader>
          <SectionTitle>Address Information</SectionTitle>
          <SectionAction
            startIcon={
              hasSecondaryAddress ? (
                <EditableFieldIcon src={editBlueIcon} alt="Edit" />
              ) : (
                <AddCircleOutlineIcon />
              )
            }
          >
            {hasSecondaryAddress ? "Edit" : "Add Secondary Address"}
          </SectionAction>
        </SectionHeader>
        <AddressSectionContainer>
        <SubSection>
          <SubSectionTitle>Current Address</SubSectionTitle>
          <DividerLine />
          <AddressGrid>
            {addressData.current.map((item) => (
              <InfoItem key={item.label}>
                <InfoLabel>{item.label}</InfoLabel>
                <InfoValue>{item.value || "--"}</InfoValue>
              </InfoItem>
            ))}
          </AddressGrid>
        </SubSection>

        {hasSecondaryAddress && (
          <SubSection>
            <SubSectionTitle>Secondary Address</SubSectionTitle>
            <DividerLine />
            <AddressGrid>
              {addressData.secondary!.map((item) => (
                <InfoItem key={item.label}>
                  <InfoLabel>{item.label}</InfoLabel>
                  <InfoValue>{item.value || "--"}</InfoValue>
                </InfoItem>
              ))}
            </AddressGrid>
          </SubSection>
        )}
        </AddressSectionContainer>
      </AddressSection> */}
    </SectionContainer>
  );
};

export default ContactAddressSection;
