import { capitalizeFirst } from "../../../utils";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import { Box, Typography } from "@mui/material";
import { FC } from "react";
import BaseHealthIcon from "../../../assets/svgs/gmc-claim-icion.svg";
import ColoredShieldIcon from "../../../assets/svgs/gpa-claim-icon.svg";
import ClaimDocIcon from "../../../assets/svgs/gtl-claim-icon.svg";
import {
  DependentInfoBlock,
  DependentInfoLabel,
  DependentInfoValue,
  DependentRowDetails,
  PolicyCardBody,
  PolicyCardDescription,
  PolicyCardHeader,
  PolicyCardIcon,
  PolicyCardTitle,
  PolicyDetailsBlock,
  PolicyDetailsCardsGrid,
  PolicyDetailsSectionTitle,
  PolicyRowBody,
  PolicyTypeIconContainer,
  PolicyTypeIconImage,
  PolicySectionSubtitle,
  SelectableDetailsCard,
} from "./styles";

interface PolicyItem {
  policyId: string | number;
  policyName: string;
  policyTypeKey?: string;
  employeeEnrollmentStatusKey?: string | null;
  enrollmentEndDate?: string | null;
}

interface IntimateForItem {
  id: string | number;
  name: string;
  relation: string;
  dob: string;
  enrolledPoliciesCount: number;
}

interface PolicyDetailsStepProps {
  policies: PolicyItem[];
  intimateForOptions: IntimateForItem[];
  selectedPolicyId: string | number | null;
  selectedIntimateForId: string | number | null;
  onPolicySelect: (policyId: string | number) => void;
  onIntimateForSelect: (dependentId: string | number) => void;
}

const getPolicyDescription = (policyName: string) => {
  const normalizedName = String(policyName || "").toLowerCase();
  if (normalizedName.includes("mediclaim")) {
    return "Comprehensive medical coverage for you and your family";
  }
  if (normalizedName.includes("accident")) {
    return "Protection against accidental injuries and disabilities";
  }
  if (normalizedName.includes("term life")) {
    return "Life insurance coverage for financial security";
  }
  return "Policy coverage and benefits as per enrollment configuration";
};

const getPolicyIconMeta = (policyTypeKey?: string, policyName?: string) => {
  const key = `${policyTypeKey || ""} ${policyName || ""}`.toLowerCase();
  if (
    key.includes("gmc") ||
    key.includes("mediclaim") ||
    key.includes("medical")
  ) {
    return { icon: BaseHealthIcon, tone: "gmc" as const };
  }
  if (
    key.includes("gpa") ||
    key.includes("accident") ||
    key.includes("personal")
  ) {
    return { icon: ColoredShieldIcon, tone: "gpa" as const };
  }
  if (key.includes("gtl") || key.includes("term") || key.includes("life")) {
    return { icon: ClaimDocIcon, tone: "gtl" as const };
  }
  return { icon: BaseHealthIcon, tone: "default" as const };
};

const formatDob = (value: string) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const PolicyDetailsStep: FC<PolicyDetailsStepProps> = ({
  policies,
  intimateForOptions,
  selectedPolicyId,
  selectedIntimateForId,
  onPolicySelect,
  onIntimateForSelect,
}) => {
  const isSinglePolicy = policies.length === 1;

  return (
    <>
      <PolicyDetailsBlock sx={{ mb: "30px" }}>
        <PolicyDetailsSectionTitle>
          Select Policy Type
        </PolicyDetailsSectionTitle>
        <PolicySectionSubtitle>
          Choose the policy type for which you want to file a claim
        </PolicySectionSubtitle>
        <PolicyDetailsCardsGrid cardType="policy" policyCount={policies.length}>
          {policies.map((policy) => {
            const isSelected =
              String(selectedPolicyId ?? "") === String(policy.policyId);
            const { icon, tone } = getPolicyIconMeta(
              policy.policyTypeKey,
              policy.policyName
            );
            const isEnrolled =
              !policy.employeeEnrollmentStatusKey ||
              policy.employeeEnrollmentStatusKey === "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED";
            const endDate = policy.enrollmentEndDate
              ? new Date(policy.enrollmentEndDate)
              : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isWindowOpen =
              endDate && !isNaN(endDate.getTime()) && today <= endDate;
            const enrollmentMessage = isWindowOpen
              ? "Enrollment window is not yet completed"
              : "Enrollment is not completed";
            return (
              <Box
                key={policy.policyId}
                sx={{
                  display: "flex", flexDirection: "column", gap: "6px",
                  ...((!isEnrolled) && { pointerEvents: "none", cursor: "not-allowed" }),
                }}
              >
              <SelectableDetailsCard
                selected={isSelected && isEnrolled}
                onClick={isEnrolled ? () => onPolicySelect(policy.policyId) : undefined}
                type="button"
                layoutType={isSinglePolicy ? "policyRow" : "default"}
                sx={!isEnrolled ? { opacity: 0.55, cursor: "not-allowed" } : {}}
              >
                {isSinglePolicy ? (
                  <>
                    <PolicyCardIcon selected={isSelected}>
                      {isSelected ? (
                        <CheckCircleRoundedIcon fontSize="small" />
                      ) : (
                        <RadioButtonUncheckedRoundedIcon fontSize="small" />
                      )}
                    </PolicyCardIcon>
                    <PolicyRowBody>
                      <PolicyCardTitle>{policy.policyName}</PolicyCardTitle>
                      <PolicyCardDescription>
                        {getPolicyDescription(policy.policyName)}
                      </PolicyCardDescription>
                    </PolicyRowBody>
                    <PolicyTypeIconContainer tone={tone}>
                      <PolicyTypeIconImage
                        src={icon}
                        alt={`${policy.policyName} icon`}
                      />
                    </PolicyTypeIconContainer>
                  </>
                ) : (
                  <>
                    <PolicyCardHeader>
                      <PolicyTypeIconContainer tone={tone}>
                        <PolicyTypeIconImage
                          src={icon}
                          alt={`${policy.policyName} icon`}
                        />
                      </PolicyTypeIconContainer>
                      <PolicyCardIcon selected={isSelected}>
                        {isSelected ? (
                          <CheckCircleRoundedIcon fontSize="small" />
                        ) : (
                          <RadioButtonUncheckedRoundedIcon fontSize="small" />
                        )}
                      </PolicyCardIcon>
                    </PolicyCardHeader>
                    <PolicyCardBody>
                      <PolicyCardTitle>{policy.policyName}</PolicyCardTitle>
                      <PolicyCardDescription>
                        {getPolicyDescription(policy.policyName)}
                      </PolicyCardDescription>
                    </PolicyCardBody>
                  </>
                )}
              </SelectableDetailsCard>
              {!isEnrolled && (
                <Box sx={{
                  display: "flex", alignItems: "center", gap: "6px",
                  px: "10px", py: "6px",
                  background: "#E0F2FE",
                  border: "1px solid #BAE6FD",
                  borderRadius: "6px",
                }}>
                  <ErrorOutlineIcon sx={{ fontSize: 13, color: "#F87171", flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 11, color: "#B91C1C", lineHeight: 1.4 }}>
                    {enrollmentMessage}
                  </Typography>
                </Box>
              )}
              </Box>
            );
          })}
        </PolicyDetailsCardsGrid>
      </PolicyDetailsBlock>

      <PolicyDetailsBlock>
        <PolicyDetailsSectionTitle>Dependent Details</PolicyDetailsSectionTitle>
        <PolicySectionSubtitle>Who is the claim for?</PolicySectionSubtitle>
        <PolicyDetailsCardsGrid cardType="intimateFor">
          {intimateForOptions.map((option) => {
            const isSelected =
              String(selectedIntimateForId ?? "") === String(option.id);
            return (
              <SelectableDetailsCard
                key={option.id}
                selected={isSelected}
                onClick={() => onIntimateForSelect(option.id)}
                type="button"
                layoutType="row"
              >
                <PolicyCardIcon selected={isSelected}>
                  {isSelected ? (
                    <CheckCircleRoundedIcon fontSize="small" />
                  ) : (
                    <RadioButtonUncheckedRoundedIcon fontSize="small" />
                  )}
                </PolicyCardIcon>
                <DependentRowDetails>
                  <DependentInfoBlock>
                    <DependentInfoLabel>Dependent</DependentInfoLabel>
                    <DependentInfoValue>{option.name}</DependentInfoValue>
                  </DependentInfoBlock>
                  <DependentInfoBlock>
                    <DependentInfoLabel>Relation</DependentInfoLabel>
                    <DependentInfoValue>{capitalizeFirst(option.relation)}</DependentInfoValue>
                  </DependentInfoBlock>
                  <DependentInfoBlock>
                    <DependentInfoLabel>Date of Birth</DependentInfoLabel>
                    <DependentInfoValue>
                      {formatDob(option.dob)}
                    </DependentInfoValue>
                  </DependentInfoBlock>
                  <DependentInfoBlock>
                    <DependentInfoLabel>Enrolled Policies</DependentInfoLabel>
                    <DependentInfoValue>
                      {String(option.enrolledPoliciesCount).padStart(2, "0")}
                    </DependentInfoValue>
                  </DependentInfoBlock>
                </DependentRowDetails>
              </SelectableDetailsCard>
            );
          })}
        </PolicyDetailsCardsGrid>
      </PolicyDetailsBlock>
    </>
  );
};
