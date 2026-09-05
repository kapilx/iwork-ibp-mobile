import { useFormContext, UseFormReturn } from "react-hook-form";
import FormFieldRenderer from "./FormFieldRenderer";
import { Box, Grid } from "@mui/material";
import { StyledFormContainer } from "./Fields/styles";
import { FormFieldConfig } from "./types";
import { RANGE_PICKER_TYPE } from "../../constants";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface DynamicFormProps {
  formConfig: FormFieldConfig[];
  defaultValues?: any;
  sx?: React.CSSProperties;
  formMethods?: (methods: UseFormReturn<any>) => void;
  isEditMode?: boolean;
  prefix?: string; // 🆕 Accept prefix for nested names
  disableAllFields?: boolean;
  unregisterSection?: boolean; // For unregistering section fields
  externalWatch?: (path: string) => any;
}

const DynamicFormMultipleCases = ({
  formConfig,
  sx,
  isEditMode = false,
  prefix = "", // 🆕 Default prefix to empty string
  disableAllFields = false,
  unregisterSection = false, // For unregistering section fields
  externalWatch,
}: DynamicFormProps) => {
  const methods = useFormContext();
  const { watch, setValue, control, trigger } = methods;
  // const watchFn = externalWatch || watch;
  const watchFn = (path: string) => externalWatch?.(path) ?? watch(path);

  return (
    <StyledFormContainer customStyles={sx}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Grid
          container
          spacing={2}
          sx={{
            columnGap: "60px",
            rowGap: "32px",
            "&&": {
              marginLeft: "0px",
            },
          }}
        >
          {formConfig?.map((field, index) => {
            const isDisabled = disableAllFields
              ? true
              : field.disabledInEditMode && isEditMode
              ? true
              : (field.componentProps as { disabled?: boolean })?.disabled ??
                false;

            // 🆕 Prefix the name for nested useFieldArray
            const fieldName = prefix ? `${prefix}.${field.name}` : field.name;

            const prefixDep = (dep: string) => (prefix ? `${prefix}.${dep}` : dep);

            let enhancedField: FormFieldConfig = {
              ...field,
              name: fieldName,
              componentProps: {
                ...field.componentProps,
                disabled: isDisabled,
              },
              inputDependentField: field.inputDependentField
                ? Array.isArray(field.inputDependentField)
                  ? field.inputDependentField.map(prefixDep)
                  : prefixDep(field.inputDependentField)
                : undefined,
              dependentFieldsOnBlur: field.dependentFieldsOnBlur
                ? prefixDep(field.dependentFieldsOnBlur)
                : undefined,
            };

            if (
              field.type === RANGE_PICKER_TYPE.DATE_RANGE ||
              field.type === RANGE_PICKER_TYPE.TIME_RANGE
            ) {
              enhancedField = {
                ...enhancedField,
                fromName:
                  prefix && field.fromName
                    ? `${prefix}.${field.fromName}`
                    : field.fromName,
                toName:
                  prefix && field.toName
                    ? `${prefix}.${field.toName}`
                    : field.toName,
              };
            }

            // Row-aware watcher: when iterating a MultipleSections row,
            // this prepends the row's `retArray.{idx}` prefix so a field can
            // observe sibling values within its own row.
            const rowWatch = prefix
              ? (path: string) => watchFn(`${prefix}.${path}`)
              : watchFn;

            // Row-aware override: when a field declares `getDynamicConfig`,
            // call it with the row-scoped watcher so the returned partial
            // (label, rules, etc.) reflects this row's state.
            if (typeof field.getDynamicConfig === "function") {
              enhancedField = {
                ...enhancedField,
                ...field.getDynamicConfig(rowWatch),
              };
            }

            let shouldShowField = true;
            if (typeof field.showField === "function") {
              shouldShowField = field.showField(rowWatch);
            } else if (typeof field.showField === "boolean") {
              shouldShowField = field.showField;
            }
            return shouldShowField ? (
              <Grid
                item
                xs={12}
                sm={12}
                md={field.gridColumn || 12}
                lg={field.gridColumn || 12}
                key={`${fieldName}-${index}-grid`}
                data-testid={`form-field-${field.type}-${fieldName}`}
                sx={{
                  maxWidth:
                    field.gridColumn === 5
                      ? "400px !important"
                      : field.gridColumn === 9
                      ? "830px"
                      : undefined,
                  width: "100%",
                  flexBasis: "auto",
                  "&&": {
                    paddingTop: 0,
                    paddingLeft: 0,
                  },
                }}
              >
                <FormFieldRenderer
                  field={enhancedField}
                  watch={watchFn}
                  setValue={setValue}
                  control={control}
                  trigger={trigger}
                  isFormAnArray={true} //means multiple sections
                  disableAllFields={disableAllFields} // For disabling all fields in the form
                  unregisterSection={unregisterSection} // For unregistering section fields
                />
              </Grid>
            ) : null;
          })}
        </Grid>
      </Box>
    </StyledFormContainer>
  );
};

export default DynamicFormMultipleCases;
