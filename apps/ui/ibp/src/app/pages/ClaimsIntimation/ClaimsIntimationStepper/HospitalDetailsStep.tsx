import { Box } from "@mui/material";
import { UseFormReturn } from "react-hook-form";
import { ClaimsIntimationFormValues } from "./types";
import { HospitalSearchSelector } from "./HospitalSearchSelector";
import { ClaimDocumentsSection } from "./ClaimDocumentsSection";

type HospitalDetailsStepProps = {
  selectedPolicyId?: string | number | null;
  hospitalPolicyIds?: (string | number)[];
  formMethods?: UseFormReturn<ClaimsIntimationFormValues>;
  showMedicalFields: boolean;
  claimType?: string;
  // MULTI-flow TPAs don't accept documents at intimation — they're collected later
  // in Step 4 (Submit Claim) instead, once the user actually has bills in hand.
  hideDocuments?: boolean;
};

export const HospitalDetailsStep = ({
  selectedPolicyId,
  hospitalPolicyIds,
  formMethods,
  showMedicalFields,
  claimType,
  hideDocuments,
}: HospitalDetailsStepProps) => {
  return (
    <Box>
      {showMedicalFields && (
        <HospitalSearchSelector
          selectedPolicyId={selectedPolicyId}
          hospitalPolicyIds={hospitalPolicyIds}
          formMethods={formMethods}
          claimType={claimType}
        />
      )}
      {formMethods && !hideDocuments && (
        <ClaimDocumentsSection
          formMethods={formMethods}
          claimType={claimType}
          title="Claim Documents"
        />
      )}
    </Box>
  );
};
