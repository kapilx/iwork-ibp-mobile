import {
  ALERT_MESSAGES,
  ActionsContainer,
  Button,
  CANCEL,
  EDIT,
  EditableEditButton,
  EditableHeaderContainer,
  EditableHeaderContent,
  FormApprovalContainer,
  FormFieldConfig,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  endPoints,
  formatDate,
  formatNumberInputByLocalization,
  setToastMessage,
  UPDATE,
  useApiMutation,
  useLocalization,
} from "@ui/ui-lib";
import { REGEX_PATTERNS } from "@ui/ui-lib/constants/regex";
import React, { useEffect, useRef, useState } from "react";
import { Visibility, VisibilityOff, WarningAmber } from "@mui/icons-material";
import { Box, CircularProgress } from "@mui/material";
import { useDispatch } from "react-redux";
import identificationCardIcon from "../../../assets/svgs/identification-card.svg";
import cakeIcon from "../../../assets/svgs/cake.svg";
import envelopeSimpleIcon from "../../../assets/svgs/envelope-simple.svg";
import phoneIcon from "../../../assets/svgs/phone.svg";
import EditIcon from "../../../assets/svgs/edit-blue-icon.svg";
import { generateEmployeeDetailsFields } from "../../../pages/Enrollment/config";
import { userDetailsFormConfig } from "./config";
import {
  EmployeeDetailsCard,
  EmployeeDetailsContainer,
  EmployeeDetailsHeaderTitle,
  EnrollmentHeading,
  FormWrapper,
  EmployeeDetailsMetaRow,
  EmployeeDetailsMetaItem,
  EmployeeDetailsMetaIcon,
  EmployeeDetailsMetaSeparator,
  EmployeeDetailsSecondaryMetaRow,
  EmployeeDetailsSecondaryMetaItem,
  EmployeeDetailsToggleButton,
  EmployeeDetailsValueRow,
} from "./styles";
import {
  AlternateInput,
  AlternateInputContainer,
  AlternateInputError,
  AlternateInputLoader,
  EditableFieldIcon,
} from "../../ContactAddressSection/styles";
import eye from "../../../assets/svgs/eye-white.svg";
import eyeSlash from "../../../assets/svgs/eye-slash.svg";
import { DATE_FORMATS, ENROLLMENT_HEADING } from "../../../constants";

interface EmployeeDetailsProps {
  isReadOnly?: boolean;
  flattenedPolicies?: any;
  policyOptions?: any;
}
// Helper function to calculate age from date of birth
const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    return age - 1;
  }
  return age;
};

// Helper function to format gender and marital status
const formatSelectValue = (
  value: { key: string; value: string } | string | null | undefined
): string => {
  if (!value) return "";
  const normalizeGenderDisplay = (input: string) => {
    const normalized = input.trim().toLowerCase();
    if (normalized === "male") {
      return "Male";
    }
    if (normalized === "female") {
      return "Female";
    }
    return input.charAt(0).toUpperCase() + input.slice(1);
  };

  if (typeof value === "object" && value.value) {
    return normalizeGenderDisplay(value.value);
  }
  if (typeof value === "string") {
    return normalizeGenderDisplay(value);
  }
  return "";
};

const getFieldIcon = (key: string) => {
  const normalizedKey = String(key ?? "").toLowerCase();

  if (normalizedKey === "displayname") return identificationCardIcon;
  if (normalizedKey === "dateofbirth") return cakeIcon;
  if (normalizedKey === "email") return envelopeSimpleIcon;
  if (normalizedKey === "phone") return phoneIcon;

  return identificationCardIcon;
};

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({
  isReadOnly = false,
  flattenedPolicies,
  policyOptions,
}) => {
  const { localizationData } = useLocalization();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDobVisible, setIsDobVisible] = useState(false);
  const [isAlternateUpdating, setIsAlternateUpdating] = useState(false);
  const [activeAlternateField, setActiveAlternateField] = useState<
    "alternatePhone" | "alternateEmail" | null
  >(null);
  const [alternatePhoneDraft, setAlternatePhoneDraft] = useState("");
  const [alternateEmailDraft, setAlternateEmailDraft] = useState("");
  const [alternatePhoneError, setAlternatePhoneError] = useState("");
  const [alternateEmailError, setAlternateEmailError] = useState("");

  const dispatch = useDispatch();

  const innerRef = useRef<NestedGroupedDataCollectionHandle | null>(null);
  const alternatePhoneContainerRef = useRef<HTMLDivElement | null>(null);
  const alternateEmailContainerRef = useRef<HTMLDivElement | null>(null);
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");

  useEffect(() => {
    if (isEditing && innerRef?.current && userDetails) {
      innerRef?.current?.resetForms?.({
        employeeDetails: {
          employeeName: userDetails.employeeName || "",
          email: userDetails.email || "",
          phone: userDetails.phone || "",
          designation: userDetails.designation || "",
          gender: userDetails.gender?.value || userDetails.gender || "",
          dateOfBirth: userDetails.dateOfBirth || "",
          companyEmployeeId: userDetails.companyEmployeeId || "",
          employeeCompanyId: userDetails.employeeCompanyId || "",
          age: userDetails.dateOfBirth
            ? calculateAge(userDetails.dateOfBirth)
            : "",
          maritalStatus:
            userDetails.maritalStatus?.value || userDetails.maritalStatus || "",
        },
      });
    }
  }, [isEditing, userDetails]);

  // Helper function to determine which name to display
  const getDisplayName = () => {
    // If both employeeName and fullName exist, prioritize employeeName
    if (userDetails?.employeeName && userDetails?.fullName) {
      return userDetails.employeeName;
    }
    // Otherwise, return whichever one exists
    return userDetails?.employeeName || userDetails?.fullName || "";
  };

  // Helper function to get designation from additionalDetails or fallback to main designation
  const getDesignation = () => {
    return (
      userDetails?.additionalDetails?.Designation ||
      userDetails?.designation ||
      ""
    );
  };

  // Helper function to get marital status from additionalDetails or fallback to main maritalStatus
  const getMaritalStatus = () => {
    if (userDetails?.additionalDetails?.["Marital Status"]) {
      return userDetails.additionalDetails["Marital Status"];
    }
    return formatSelectValue(userDetails?.maritalStatus) || "";
  };

  // Generate dynamic employee data including additionalDetails
  const generateEmployeeData = () => {
    const alternatePhone =
      userDetails?.alternatePhoneNumber ||
      userDetails?.additionalDetails?.["Alternate Phone"] ||
      userDetails?.additionalDetails?.alternatePhone ||
      "";
    const alternateEmail =
      userDetails?.alternateEmail ||
      userDetails?.additionalDetails?.["Alternate Email"] ||
      userDetails?.additionalDetails?.alternateEmail ||
      "";

    const baseData = {
      displayName: getDisplayName(),
      companyEmployeeId: userDetails?.companyEmployeeId || "",
      employeeCompanyId: userDetails?.employeeCompanyId || "",
      email: userDetails?.email || "",
      phone: userDetails?.phone || "",
      alternatePhone,
      alternateEmail,
      designation: getDesignation(),
      dateOfBirth: userDetails?.dateOfBirth || "",
      gender: formatSelectValue(userDetails?.gender) || "",
      maritalStatus: getMaritalStatus(),
    };

    // Add dynamic fields from additionalDetails (excluding only "Relation")
    if (userDetails?.additionalDetails) {
      Object.entries(userDetails.additionalDetails).forEach(([key, value]) => {
        if (key !== "Relation") {
          // Format date fields using formatDate
          if (key === "Effective Date" && value) {
            baseData[`additionalDetails_${key}` as keyof typeof baseData] =
              formatDate(value as string);
          } else {
            // Check if value is numeric and format with currency
            const numericValue = Number(value);
            if (
              !isNaN(numericValue) &&
              value !== "" &&
              value !== null &&
              value !== undefined
            ) {
              baseData[`additionalDetails_${key}` as keyof typeof baseData] =
                formatNumberInputByLocalization(
                  numericValue,
                  localizationData?.data
                );
            } else {
              baseData[`additionalDetails_${key}` as keyof typeof baseData] =
                (value as string) || "";
            }
          }
        }
      });
    }

    return baseData;
  };

  const employeeData = generateEmployeeData();
  const [isAlternateFormVisible, setIsAlternateFormVisible] = useState(false);
  const employeeHeaderTitle = `${
    employeeData.displayName || "Employee"
  }, choose your benefits to complete enrolment.`;
  const metaItems = [
    {
      key: "companyEmployeeId",
      icon: getFieldIcon("identificationCardIcon"),
      value: employeeData.companyEmployeeId || "--",
    },
    {
      key: "dateOfBirth",
      icon: getFieldIcon("dateOfBirth"),
      value: employeeData.dateOfBirth
        ? formatDate(
            employeeData.dateOfBirth,
            DATE_FORMATS.DAY_SHORT_MONTH_YEAR
          )
        : "--",
    },
    {
      key: "phone",
      icon: getFieldIcon("phone"),
      value: employeeData.phone || "--",
    },
    {
      key: "email",
      icon: getFieldIcon("email"),
      value: employeeData.email || "--",
    },
  ];

  const handleCancel = () => {
    setIsEditing(false);
  };

  const { mutate: updateEmployeeDetails } = useApiMutation({
    config: {
      onSuccess: (updatedData) => {
        setIsLoading(false);
        // Update sessionStorage with the updated user data
        const storedData = sessionStorage.getItem("user");

        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const updatedUserData = { ...parsedData, ...updatedData?.data };
          sessionStorage.setItem("user", JSON.stringify(updatedUserData));
        }
        dispatch(
          setToastMessage(
            updatedData?.message || "Employee details updated successfully."
          )
        );
        setIsEditing(false);
      },
      onError: (error: any) => {
        setIsLoading(false);
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const { mutate: updateAlternateContact } = useApiMutation({
    config: {
      onSuccess: (updatedData: any) => {
        const storedData = sessionStorage.getItem("user");

        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const updatedUserData = {
            ...parsedData,
            ...updatedData?.data,
          };
          sessionStorage.setItem("user", JSON.stringify(updatedUserData));
        }

        setIsAlternateUpdating(false);
        setIsAlternateFormVisible(false);
        setActiveAlternateField(null);
        dispatch(
          setToastMessage(
            updatedData?.message || "Alternate contact updated successfully."
          )
        );
      },
      onError: (error: any) => {
        setIsAlternateUpdating(false);
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleUpdate = async () => {
    const formData = await innerRef?.current?.submitAll?.();

    if (!formData?.isAllValid) {
      return;
    }

    const employeeDetailsForm = formData?.result?.employeeDetails;
    if (!employeeDetailsForm) {
      return;
    }

    const { employeeName, email, phone } = employeeDetailsForm;

    if (userDetails) {
      if (
        phone === userDetails.phone &&
        employeeName === userDetails.employeeName &&
        email === userDetails.email
      ) {
        dispatch(
          setToastMessage("Please update at least one field to save changes.")
        );
        return;
      }
    }

    if (userDetails?.id) {
      setIsLoading(true);
      updateEmployeeDetails({
        endpoint: endPoints.updateEmployeeDetails(userDetails?.id),
        method: "PUT",
        data: {
          employeeName,
          email,
          phone,
        },
      });
    }
  };

  const handleAlternateContactEdit = (
    fieldKey: "alternatePhone" | "alternateEmail",
    _fieldLabel: string
  ) => {
    if (isAlternateUpdating) return;
    setActiveAlternateField(fieldKey);
    setIsAlternateFormVisible(true);

    setTimeout(() => {
      const currentValue =
        (employeeData[fieldKey as keyof typeof employeeData] as string) || "";
      if (fieldKey === "alternatePhone") {
        setAlternatePhoneError("");
        setAlternatePhoneDraft(currentValue === "--" ? "" : currentValue);
      } else {
        setAlternateEmailError("");
        setAlternateEmailDraft(currentValue === "--" ? "" : currentValue);
      }
    }, 0);
  };

  const handleAlternateContactSubmit = async (options?: {
    fallbackField?: "alternatePhone" | "alternateEmail";
    silentNoChanges?: boolean;
  }) => {
    if (isAlternateUpdating) return;
    const targetField = activeAlternateField || options?.fallbackField;
    if (!targetField) return;

    const normalizedValue = String(
      targetField === "alternatePhone"
        ? alternatePhoneDraft
        : alternateEmailDraft
    ).trim();
    if (!normalizedValue) {
      setIsAlternateFormVisible(false);
      setActiveAlternateField(null);
      return;
    }
    if (
      targetField === "alternatePhone" &&
      (!REGEX_PATTERNS.PHONE.test(normalizedValue) ||
        normalizedValue.replace(/\D/g, "").length < 10)
    ) {
      setAlternatePhoneError("Please enter a valid phone number.");
      return;
    }
    if (
      targetField === "alternateEmail" &&
      !REGEX_PATTERNS.EMAIL.test(normalizedValue)
    ) {
      setAlternateEmailError("Please enter a valid email address.");
      return;
    }
    if (targetField === "alternatePhone") {
      setAlternatePhoneError("");
    } else {
      setAlternateEmailError("");
    }

    const currentValue =
      (employeeData[targetField as keyof typeof employeeData] as string) || "";

    if (normalizedValue === currentValue) {
      if (!options?.silentNoChanges) {
        dispatch(setToastMessage("No changes detected."));
      }
      setIsAlternateFormVisible(false);
      setActiveAlternateField(null);
      return;
    }

    const employeeId = JSON.parse(sessionStorage.getItem("user") || "{}")?.id;
    if (!employeeId) {
      dispatch(setToastMessage("Employee ID not found."));
      return;
    }

    setIsAlternateUpdating(true);
    updateAlternateContact({
      endpoint: endPoints.updateEmployeeDetails(employeeId),
      method: "PUT",
      data: {
        employeeName: userDetails?.employeeName || userDetails?.fullName || "",
        email: userDetails?.email || "",
        phone: userDetails?.phone || "",
        alternatePhoneNumber:
          targetField === "alternatePhone"
            ? normalizedValue
            : employeeData.alternatePhone || "",
        alternateEmail:
          targetField === "alternateEmail"
            ? normalizedValue
            : employeeData.alternateEmail || "",
      },
    });
  };

  return (
    <EmployeeDetailsContainer data-testid="ibp-employee-details-card">
      {!isEditing ? (
        <EmployeeDetailsCard>
          {policyOptions.length > 0 &&
            (() => {
              const firstPolicy = flattenedPolicies.find(
                (p) => p.policyId === policyOptions[0]?.policyId
              );
              return firstPolicy?.startDate && firstPolicy?.dueDate ? (
                <EnrollmentHeading>
                  {" "}
                  {ENROLLMENT_HEADING}{" "}
                  {formatDate(
                    firstPolicy.startDate,
                    DATE_FORMATS.DAY_SHORT_MONTH_YEAR
                  )}{" "}
                  -{" "}
                  {formatDate(
                    firstPolicy.dueDate,
                    DATE_FORMATS.DAY_SHORT_MONTH_YEAR
                  )}
                </EnrollmentHeading>
              ) : null;
            })()}
          <EditableHeaderContainer>
            <EmployeeDetailsHeaderTitle>
              {employeeHeaderTitle}
            </EmployeeDetailsHeaderTitle>
            {/* *** Uncomment the below code when we need the edit option for employee details */}
            {/* {!isReadOnly && (
              <ActionsContainer>
                <EditableEditButton
                  variantType="secondary"
                  onClick={() => {
                    setIsEditing(true);
                  }}
                  sizeType="small"
                >
                  <img src={EditIcon} alt="Edit" /> {EDIT}
                </EditableEditButton>
              </ActionsContainer>
            )} */}
          </EditableHeaderContainer>
          <EmployeeDetailsMetaRow>
            {metaItems.map((item, index) => (
              <React.Fragment key={item.key}>
                <EmployeeDetailsMetaItem>
                  <EmployeeDetailsMetaIcon src={item.icon} alt="" />
                  <span>{item.value}</span>
                </EmployeeDetailsMetaItem>
                {index < metaItems.length - 1 && (
                  <EmployeeDetailsMetaSeparator>|</EmployeeDetailsMetaSeparator>
                )}
              </React.Fragment>
            ))}
          </EmployeeDetailsMetaRow>
          <EmployeeDetailsSecondaryMetaRow>
            {employeeData.maritalStatus && (
              <>
                <EmployeeDetailsSecondaryMetaItem>
                  Marital Status: {employeeData.maritalStatus}
                </EmployeeDetailsSecondaryMetaItem>
                {(employeeData.alternateEmail ||
                  employeeData.alternatePhone) && (
                  <EmployeeDetailsMetaSeparator>|</EmployeeDetailsMetaSeparator>
                )}
              </>
            )}
            <EmployeeDetailsSecondaryMetaItem>
              <EmployeeDetailsValueRow>
                <span>Alternative Email:&nbsp;</span>
                {isAlternateFormVisible && activeAlternateField === "alternateEmail" ? (
                  <AlternateInputContainer
                    ref={alternateEmailContainerRef}
                    sx={{ flex: 1, position: "relative" }}
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
                        if (alternateEmailError) setAlternateEmailError("");
                      }}
                    />
                    {isAlternateUpdating &&
                    activeAlternateField === "alternateEmail" ? (
                      <AlternateInputLoader>
                        <CircularProgress size={16} sx={{ color: "#1B4F95" }} />
                      </AlternateInputLoader>
                    ) : null}
                    {alternateEmailError ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px", justifyContent: "flex-start" }}>
                        <WarningAmber sx={{ color: "#FFC107", fontSize: "16px" }} />
                        <AlternateInputError sx={{ marginTop: 0, color: "#fff" }}>
                          Error: {alternateEmailError}
                        </AlternateInputError>
                      </Box>
                    ) : null}
                  </AlternateInputContainer>
                ) : (
                  <span>{employeeData.alternateEmail || "--"}</span>
                )}
                <EmployeeDetailsToggleButton
                  onClick={() =>
                    handleAlternateContactEdit("alternateEmail", "Alternative Email")
                  }
                  aria-label="Edit alternate email"
                  size="small"
                  disabled={isAlternateUpdating}
                >
                  <EditableFieldIcon src={EditIcon} alt="Edit alternate email" />
                </EmployeeDetailsToggleButton>
              </EmployeeDetailsValueRow>
            </EmployeeDetailsSecondaryMetaItem>
            <EmployeeDetailsMetaSeparator>|</EmployeeDetailsMetaSeparator>
            <EmployeeDetailsSecondaryMetaItem>
              <EmployeeDetailsValueRow>
                <span>Alternative Phone:&nbsp;</span>
                {isAlternateFormVisible && activeAlternateField === "alternatePhone" ? (
                  <AlternateInputContainer
                    ref={alternatePhoneContainerRef}
                    sx={{ flex: 1, position: "relative" }}
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
                        setAlternatePhoneDraft(event.target.value);
                        if (alternatePhoneError) setAlternatePhoneError("");
                      }}
                    />
                    {isAlternateUpdating &&
                    activeAlternateField === "alternatePhone" ? (
                      <AlternateInputLoader>
                        <CircularProgress size={16} sx={{ color: "#1B4F95" }} />
                      </AlternateInputLoader>
                    ) : null}
                    {alternatePhoneError ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                        <WarningAmber sx={{ color: "#FFC107", fontSize: "15px" }} />
                        <AlternateInputError sx={{ marginTop: 0, color: "#fff" }}>
                          Error: {alternatePhoneError}
                        </AlternateInputError>
                      </Box>
                    ) : null}
                  </AlternateInputContainer>
                ) : (
                  <span>{employeeData.alternatePhone || "--"}</span>
                )}
                <EmployeeDetailsToggleButton
                  onClick={() =>
                    handleAlternateContactEdit("alternatePhone", "Alternative Phone")
                  }
                  aria-label="Edit alternate phone"
                  size="small"
                  disabled={isAlternateUpdating}
                >
                  <EditableFieldIcon src={EditIcon} alt="Edit alternate phone" />
                </EmployeeDetailsToggleButton>
              </EmployeeDetailsValueRow>
            </EmployeeDetailsSecondaryMetaItem>
          </EmployeeDetailsSecondaryMetaRow>
        </EmployeeDetailsCard>
      ) : (
        <FormWrapper>
          {policyOptions.length > 0 &&
            (() => {
              const firstPolicy = flattenedPolicies.find(
                (p) => p.policyId === policyOptions[0]?.policyId
              );
              return firstPolicy?.startDate && firstPolicy?.dueDate ? (
                <EnrollmentHeading>
                  {" "}
                  {ENROLLMENT_HEADING}{" "}
                  {formatDate(
                    firstPolicy.startDate,
                    DATE_FORMATS.DAY_SHORT_MONTH_YEAR
                  )}{" "}
                  -{" "}
                  {formatDate(
                    firstPolicy.dueDate,
                    DATE_FORMATS.DAY_SHORT_MONTH_YEAR
                  )}
                </EnrollmentHeading>
              ) : null;
            })()}
          <EmployeeDetailsHeaderTitle isEdit={isEditing}>
            {employeeHeaderTitle}
          </EmployeeDetailsHeaderTitle>

          <NestedDynamicForm ref={innerRef} config={userDetailsFormConfig} />

          {/* <FormApprovalContainer> */}
          {/* <Button
              variantType="secondary"
              onClick={handleCancel}
              type="button"
              sizeType="small"
            >
              {CANCEL}
            </Button>
            <Button
              variantType="primary"
              type="button"
              onClick={handleUpdate}
              sizeType="small"
              loading={isLoading}
            >
              {UPDATE}
            </Button> */}
          {/* </FormApprovalContainer> */}
        </FormWrapper>
      )}
    </EmployeeDetailsContainer>
  );
};

export default EmployeeDetails;
