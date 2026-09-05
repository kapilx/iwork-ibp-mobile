import { Box, TextField, Typography } from "@mui/material";
import { UseFormReturn } from "react-hook-form";
import { endPoints, useApiQuery } from "@ui/ui-lib";
import { ClaimsIntimationFormValues } from "./types";

type ExtraField = {
  name: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
};

type TpaExtraFieldsSectionProps = {
  formMethods: UseFormReturn<ClaimsIntimationFormValues>;
  policyId?: string | number | null;
  apiType: "INTIMATE_CLAIM" | "SUBMIT_CLAIM";
  // Which form field this instance writes into — kept separate per stage so Step 4
  // never touches whatever Step 1-3 already collected, and vice versa.
  formFieldName: "intimateExtraFields" | "submitExtraFields";
};

// Renders whatever extra fields a TPA needs that our own system can't source —
// admin-configured as sourceType = USER_INPUT on tpa_payload_field_mapping (iWork's
// Default Field Mappings UI), fetched here instead of every new TPA-specific field
// requiring a new hardcoded form field. Renders nothing when the TPA needs none.
export const TpaExtraFieldsSection = ({
  formMethods,
  policyId,
  apiType,
  formFieldName,
}: TpaExtraFieldsSectionProps) => {
  const { data } = useApiQuery({
    queryKey: ["claimExtraFields", policyId, apiType],
    url: policyId ? endPoints.claimExtraFields(policyId, apiType) : "",
    enabled: Boolean(policyId),
  });

  const fields: ExtraField[] = (data as any)?.data?.data ?? (data as any)?.data ?? [];
  if (!Array.isArray(fields) || fields.length === 0) return null;

  const values = (formMethods.watch(formFieldName) || {}) as Record<string, any>;

  const handleChange = (name: string, value: string) => {
    formMethods.setValue(
      formFieldName,
      { ...formMethods.getValues(formFieldName), [name]: value },
      { shouldValidate: true, shouldDirty: true },
    );
  };

  const toInputType = (fieldType: string) => {
    if (fieldType === "date") return "date";
    if (fieldType === "number") return "number";
    return "text";
  };

  return (
    <Box sx={{ border: "2px dashed #C4C4C4", borderRadius: "12px", p: 3, mt: 2 }}>
      <Typography sx={{ mb: 2, fontWeight: 600, fontSize: 16 }}>
        Additional Details Required by TPA
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {fields.map((field) => (
          <TextField
            key={field.name}
            label={field.label}
            required={field.isRequired}
            type={toInputType(field.fieldType)}
            value={values[field.name] ?? ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            size="small"
            fullWidth
            sx={{ minWidth: 220, flex: "1 1 260px" }}
            InputLabelProps={toInputType(field.fieldType) === "date" ? { shrink: true } : undefined}
          />
        ))}
      </Box>
    </Box>
  );
};
