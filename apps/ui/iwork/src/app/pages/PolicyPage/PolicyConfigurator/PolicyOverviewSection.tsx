import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Grid, FormControl, MenuItem } from "@mui/material";
import { CommonTextField, CommonSelect } from "@ui/ui-lib";
import { PolicyOverviewData } from "./policytypes";
import { SectionRef } from "./sectionRef";
import { fieldHighlightSx } from "./ConfiguratorFields";

interface PolicyOverviewSectionProps {
  initialData: PolicyOverviewData;
  isEditable: boolean;
  showHighlights: boolean;
}

export const PolicyOverviewSection = forwardRef<
  SectionRef,
  PolicyOverviewSectionProps
>(({ initialData, isEditable, showHighlights }, ref) => {
  const [companyName, setCompanyName] = useState(initialData.companyName);
  const [policyType, setPolicyType] = useState(initialData.policyType);
  const [policyNumber, setPolicyNumber] = useState(initialData.policyNumber);
  const [currentErrors, setCurrentErrors] = useState<{
    companyName?: string;
    policyNumber?: string;
  }>({});

  useEffect(() => {
    setCompanyName(initialData.companyName);
    setPolicyType(initialData.policyType);
    setPolicyNumber(initialData.policyNumber);
    setCurrentErrors({}); // Reset errors when initial data changes
  }, [initialData]);

  const validate = (): { isValid: boolean; errors: typeof currentErrors } => {
    const newErrors: typeof currentErrors = {};
    let isValid = true;
    if (!companyName.trim()) {
      newErrors.companyName = "Company Name is required.";
      isValid = false;
    }
    if (!policyNumber.trim()) {
      newErrors.policyNumber = "Policy ID is required.";
      isValid = false;
    }
    setCurrentErrors(newErrors);
    return { isValid, errors: newErrors };
  };

  useImperativeHandle(ref, () => ({
    async validateAndGetData() {
      const { isValid } = validate();
      if (isValid) {
        return {
          isValid: true,
          data: {
            overview: { companyName, policyType, policyNumber },
          },
        };
      }
      return { isValid: false, data: null };
    },
  }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBlurValidation = (field: keyof PolicyOverviewData) => {
    if (isEditable) {
      validate(); // Validate all fields on blur of any field for simplicity here
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid sx={{ xs: 12, sm: 6, md: 4 }}>
        <CommonTextField
          fullWidth
          label="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          onBlur={() => handleBlurValidation("companyName")}
          error={
            !!currentErrors.companyName ||
            (showHighlights && !companyName.trim())
          }
          helperText={currentErrors.companyName}
          disabled={!isEditable}
          InputProps={{ readOnly: !isEditable }}
          sx={{
            ...(showHighlights && !companyName.trim() && fieldHighlightSx),
          }}
          required // Added for clarity, though validation handles it
        />
      </Grid>
      <Grid sx={{ xs: 12, sm: 6, md: 4 }}>
        <FormControl fullWidth disabled={!isEditable} size="small">
          <CommonSelect
            size="small"
            id="policy-type-select"
            value={policyType}
            label="Policy Type"
            onChange={(e) => setPolicyType(e.target.value)}
            // Style the displayed value in the Select input
            sx={{
              ...(showHighlights &&
                !policyType && // Corrected: Highlight if policyType is empty
                fieldHighlightSx),
              "& .MuiSelect-select": {
                // Target the displayed value
                fontSize: "0.875rem", // Match other TextField inputs
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  "& .MuiMenuItem-root": {
                    // Target MenuItem components within this Menu's Paper
                    fontSize: "0.875rem", // Standard MUI body2 size, adjust as needed
                  },
                },
              },
            }}
          >
            <MenuItem value="GMC">GMC (Group Medical Coverage)</MenuItem>
            <MenuItem value="GTL">GTL (Group Term Life)</MenuItem>
            <MenuItem value="GPA">GPA (Group Personal Accident)</MenuItem>
          </CommonSelect>
        </FormControl>
      </Grid>
      <Grid sx={{ xs: 12, sm: 6, md: 4 }}>
        <CommonTextField
          fullWidth
          label="Policy ID"
          value={policyNumber}
          onChange={(e) => setPolicyNumber(e.target.value)}
          onBlur={() => handleBlurValidation("policyNumber")}
          error={
            !!currentErrors.policyNumber ||
            (showHighlights && !policyNumber.trim())
          }
          helperText={currentErrors.policyNumber}
          disabled={!isEditable}
          sx={{
            ...(showHighlights && !policyNumber.trim() && fieldHighlightSx),
          }}
          required // Added for clarity
        />
      </Grid>
    </Grid>
  );
});

PolicyOverviewSection.displayName = "PolicyOverviewSection";
