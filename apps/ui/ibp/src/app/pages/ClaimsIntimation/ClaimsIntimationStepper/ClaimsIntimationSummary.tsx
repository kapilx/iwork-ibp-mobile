import { policyTypeKeys } from "../../../components/WelllnessBenefitSection/constants";
import { Box, Divider } from "@mui/material";
import { ClaimsSummaryState } from "./types";
import claimsIntimationIllustration from "../../../assets/pngs/enrollment-end-days.png";
import {
  SummaryAmountLabel,
  SummaryAmountRow,
  SummaryAmountValue,
  SummaryBlock,
  SummaryBlockTitle,
  SummaryCard,
  SummaryFooter,
  SummaryInlineLabel,
  SummaryInlineRow,
  SummaryInlineValue,
  SummaryLabel,
  SummarySection,
  SummaryValue,
  SummaryTitle,
} from "./styles";

type ClaimsIntimationSummaryProps = {
  summary: ClaimsSummaryState;
  activeStep?: number;
  policyTypeKey?: string;
  isClaimTypeRequired?: boolean;
};

const hasValue = (value?: string | number) =>
  !(value === undefined || value === null || String(value).trim() === "");

const row = (label: string, value: string) =>
  hasValue(value) ? (
    <SummarySection key={label}>
      <SummaryLabel>{label}</SummaryLabel>
      <SummaryValue>{value}</SummaryValue>
    </SummarySection>
  ) : null;

const inlineRow = (label: string, value: string) =>
  hasValue(value) ? (
  <SummaryInlineRow key={label}>
    <SummaryInlineLabel>{label}</SummaryInlineLabel>
    <SummaryInlineValue>: {value}</SummaryInlineValue>
  </SummaryInlineRow>
  ) : null;

const inlineRowWithFallback = (label: string, value: string, fallback = "--") => (
  <SummaryInlineRow key={label}>
    <SummaryInlineLabel>{label}</SummaryInlineLabel>
    <SummaryInlineValue>: {hasValue(value) ? value : fallback}</SummaryInlineValue>
  </SummaryInlineRow>
);

export const ClaimsIntimationSummary = ({
  summary,
  activeStep = 0,
  policyTypeKey,
  isClaimTypeRequired = true,
}: ClaimsIntimationSummaryProps) => {
  const showIntro = activeStep === 0;
  const isGpaPolicy = policyTypeKey === policyTypeKeys.GPA;

  // if (showIntro) {
  //   return (
  //     <SummaryCard sx={{ padding: 0, overflow: "hidden" }}>
  //       <div style={{ background: "#EAF3FF", padding: "16px 18px" }}>
  //         <SummaryTitle style={{ marginBottom: 0 }}>Claim Summary</SummaryTitle>
  //       </div>
  //       <Divider />
  //       <div style={{ padding: "18px" }}>
  //         <div style={{ display: "flex", justifyContent: "center" }}>
  //           <img
  //             src={claimsIntimationIllustration}
  //             alt="Claim Summary"
  //             style={{ width: "100%", maxWidth: 300, height: "auto" }}
  //           />
  //         </div>
  //         <div
  //           style={{
  //             marginTop: 18,
  //             textAlign: "center",
  //             color: "#4B5563",
  //             fontSize: 14,
  //             lineHeight: 1.5,
  //           }}
  //         >
  //           Begin the Claim process to secure your medical coverage and benefits
  //         </div>
  //       </div>
  //     </SummaryCard>
  //   );
  // }

  const diagnosisRows = [
    isClaimTypeRequired
      ? inlineRowWithFallback("Claim Type", summary.claimTypeLabel)
      : null,
    inlineRowWithFallback(
      isGpaPolicy ? "Accident Details" : "Diagnosis",
      summary.diagnosis
    ),
    inlineRowWithFallback(
      isGpaPolicy ? "Date of accident" : "Date of Admission",
      summary.dateOfAdmission
    ),
    inlineRowWithFallback(
      isGpaPolicy ? "Place of accident" : "Date of Release",
      isGpaPolicy
        ? summary.placeOfAccident || summary.proposedDischargeDate
        : summary.proposedDischargeDate
    ),
  ].filter(Boolean);

  const hospitalRows = [
    inlineRow("Hospital", summary.hospitalName),
    inlineRow("Location", summary.hospitalLocation),
    summary.documentsCount
      ? inlineRow("Documents", `${summary.documentsCount} uploaded`)
      : null,
  ].filter(Boolean);

  return (
    <SummaryCard>
      {/* Sticky header */}
      <Box sx={{ flexShrink: 0, padding: "20px 20px 0px", background: "linear-gradient(180deg, #F7FBFF 0%, #E7F1FB 100%)" }}>
        <SummaryTitle>Claim Summary</SummaryTitle>
        <Divider />
      </Box>

      {/* Scrollable body */}
      <Box sx={{ flex: 1, overflowY: "auto", padding: "12px 20px 0px" }}>
        <SummaryBlock>
          <SummaryBlockTitle>Policy Details</SummaryBlockTitle>
          {row("", summary.policyLabel)}
          {inlineRow("Name", summary.claimantName)}
          {inlineRow("Relation", summary.claimantRelation)}
        </SummaryBlock>

        {activeStep >= 1 && (
          <>
            <Divider />
            <SummaryBlock>
              <SummaryBlockTitle>
                {isGpaPolicy ? "Accident Details" : "Diagnosis & Claim"}
              </SummaryBlockTitle>
              {diagnosisRows}
            </SummaryBlock>
          </>
        )}

        {hospitalRows.length > 0 && (
          <>
            <Divider />
            <SummaryBlock>
              <SummaryBlockTitle>
                {isClaimTypeRequired ? "Hospital Details" : "Claim Documents"}
              </SummaryBlockTitle>
              {hospitalRows}
            </SummaryBlock>
          </>
        )}
      </Box>

      {/* Fixed footer */}
      {hasValue(summary.estimatedClaimAmount) && (
        <SummaryFooter>
          <SummaryAmountRow>
            <SummaryAmountLabel>Estimated Claim Amount:</SummaryAmountLabel>
            <SummaryAmountValue>{summary.estimatedClaimAmount}</SummaryAmountValue>
          </SummaryAmountRow>
        </SummaryFooter>
      )}
    </SummaryCard>
  );
};
