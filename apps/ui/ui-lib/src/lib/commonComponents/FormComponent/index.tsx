import { Box, Grid } from "@mui/material";
import { useEffect } from "react";
import { FormProvider, useForm, UseFormReturn } from "react-hook-form";
import { StyledFormContainer } from "./Fields/styles";
import FormFieldRenderer from "./FormFieldRenderer";
import {
  dynamicFormSectionBoxSx,
  getDynamicFormGridContainerSx,
} from "./styles";
import { FormFieldConfig } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface DynamicFormProps {
  formConfig: FormFieldConfig[];
  defaultValues?: any;
  sx?: React.CSSProperties;
  formMethods?: (methods: UseFormReturn<any>) => void; // Add this prop
  existingMethods?: UseFormReturn<any>;
  onValuesChange?: (values: any) => void;
  isEditMode?: boolean;
  disableAllFields?: boolean;
  onActionMap?: { [actionName: string]: () => void };
  enableSmartSearch?: boolean; // New prop for enabling smart search
  shouldReset?: boolean; // New prop to control reset behavior
  onFileUpload?: (files: File[] | File, isApiRes?: boolean) => void;
  unregisterSection?: boolean;
  variant?: "iwork" | "ibp"; // new prop to toggle layout styles
  showValue?: boolean;
  renderAsTable?: boolean;
  renderOnlyFields?: boolean;
  externalMethods?: UseFormReturn<any>; // shared form instance
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const DynamicForm = ({
  formConfig,
  defaultValues,
  formMethods,
  existingMethods,
  onValuesChange,
  sx,
  isEditMode = false,
  disableAllFields = false,
  onActionMap,
  enableSmartSearch,
  shouldReset = false, // New prop to control reset behavior
  onFileUpload,
  unregisterSection = false,
  variant = "iwork", // default fallback
  showValue = false,
  renderAsTable = false,
  renderOnlyFields = false,
  externalMethods,
}: DynamicFormProps) => {
  const internalMethods = useForm({
    defaultValues: defaultValues || {},
    mode: "onBlur", // Validate on blur
  });

  const methods = existingMethods || externalMethods || internalMethods;

  useEffect(() => {
    if (formMethods) {
      formMethods(methods); // Pass methods to parent
    }
  }, [formMethods, methods]);

  useEffect(() => {
    if (defaultValues && shouldReset) {
      // Reset the form with default values, keeping dirty and touched states
      // This allows the form to reset without losing user input

      methods.reset(defaultValues, {
        keepDirtyValues: true,
        keepTouched: true,
      });
    }
  }, [defaultValues, methods, shouldReset]);

  useEffect(() => {
    if (!onValuesChange) return;

    onValuesChange(methods.getValues());

    const subscription = methods.watch((values) => {
      onValuesChange(values);
    });

    return () => subscription.unsubscribe();
  }, [methods, onValuesChange]);

  const { watch, setValue, control, trigger } = methods;

  const getGridItemSx = (field: FormFieldConfig) => {
    const defaultMaxWidth =
      field.gridColumn === 5
        ? variant === "ibp"
          ? "300px"
          : "400px"
        : field.gridColumn === 9
        ? "860px"
        : field.gridColumn && field.gridColumn > 9
        ? "100%"
        : undefined;

    return {
      "&&": {
        maxWidth: defaultMaxWidth,
        width: "100%",
        flexBasis: "auto",
        paddingTop: 0,
        paddingLeft: 0,
        ...(field.gridItemSx || {}),
      },
    };
  };

  const isSectionBoxTitle = (field: FormFieldConfig) =>
    field?.type === "title" &&
    Boolean((field?.componentProps as { sectionBox?: boolean })?.sectionBox);

  const hasSectionBoxLayout = formConfig?.some((field) =>
    isSectionBoxTitle(field)
  );
  const shouldRenderOutsideSectionBox = (field: FormFieldConfig) =>
    Boolean(
      (field?.componentProps as { outsideSectionBox?: boolean })
        ?.outsideSectionBox
    );

  const renderField = (
    field: FormFieldConfig,
    index: number,
    keyPrefix = ""
  ) => {
    const isDisabled = disableAllFields
      ? true
      : field.disabled
      ? true
      : field.disabledInEditMode && isEditMode
      ? true
      : (field.componentProps as { disabled?: boolean })?.disabled ?? false;
    let shouldShowField = true;
    if (typeof field.showField === "function") {
      shouldShowField = field.showField(watch);
    }
    return shouldShowField ? (
      <Grid
        item
        xs={12}
        sm={12}
        md={field.gridColumn || 12}
        lg={field.gridColumn || 12}
        key={`${keyPrefix}${field.name}-${index}-grid'`}
        data-testid={`form-field-${field.type}-${field.name}`}
        sx={getGridItemSx(field)}
      >
        <FormFieldRenderer
          field={{
            ...field,
            componentProps: {
              ...field.componentProps,
              disabled: isDisabled,
            },
          }}
          watch={watch}
          setValue={setValue}
          control={control}
          trigger={trigger}
          onActionMap={onActionMap}
          disableAllFields={disableAllFields}
          showValue={showValue}
          enableSmartSearch={enableSmartSearch}
          onFileUpload={onFileUpload}
          unregisterSection={unregisterSection}
          renderAsTable={renderAsTable}
        />
      </Grid>
    ) : null;
  };

  const renderGrid = (
    fields: FormFieldConfig[],
    keyPrefix = "",
    containerSx: Record<string, any> = {}
  ) => (
    <Grid
      container
      spacing={2}
      sx={getDynamicFormGridContainerSx(renderAsTable, containerSx)}
    >
      {fields.map((field, index) => renderField(field, index, keyPrefix))}
    </Grid>
  );

  const orderedBlocks: Array<
    | { type: "plain"; fields: FormFieldConfig[] }
    | { type: "section"; title: FormFieldConfig; fields: FormFieldConfig[] }
  > = [];

  if (hasSectionBoxLayout) {
    let plainFields: FormFieldConfig[] = [];
    let currentBlock: {
      title: FormFieldConfig;
      fields: FormFieldConfig[];
    } | null = null;

    formConfig.forEach((field) => {
      if (isSectionBoxTitle(field)) {
        if (plainFields.length) {
          orderedBlocks.push({ type: "plain", fields: plainFields });
          plainFields = [];
        }
        if (currentBlock) {
          orderedBlocks.push({
            type: "section",
            title: currentBlock.title,
            fields: currentBlock.fields,
          });
        }
        currentBlock = { title: field, fields: [] };
        return;
      }

      if (currentBlock && !shouldRenderOutsideSectionBox(field)) {
        currentBlock.fields.push(field);
      } else {
        if (currentBlock) {
          orderedBlocks.push({
            type: "section",
            title: currentBlock.title,
            fields: currentBlock.fields,
          });
          currentBlock = null;
        }
        plainFields.push(field);
      }
    });

    if (currentBlock) {
      orderedBlocks.push({
        type: "section",
        title: currentBlock.title,
        fields: currentBlock.fields,
      });
    }
    if (plainFields.length) {
      orderedBlocks.push({ type: "plain", fields: plainFields });
    }
  }

  const formContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {!hasSectionBoxLayout && renderGrid(formConfig || [])}

      {hasSectionBoxLayout && (
        <>
          {orderedBlocks.map((block, index) => {
            if (block.type === "plain") {
              return (
                <Box key={`plain-block-${index}`}>
                  {renderGrid(block.fields, `plain-${index}-`)}
                </Box>
              );
            }

            return (
              <Box
                key={`section-box-${block.title.key || index}`}
                sx={dynamicFormSectionBoxSx}
              >
                {renderGrid(
                  [block.title, ...block.fields],
                  `section-${index}-`,
                  {
                    rowGap: renderAsTable ? "0" : "24px",
                  }
                )}
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );

  if (renderOnlyFields) {
    return <StyledFormContainer customStyles={sx}>{formContent}</StyledFormContainer>;
  }

  return (
    <StyledFormContainer customStyles={sx}>
      <FormProvider {...methods}>
        <form
          onSubmit={(e) => {
            e.preventDefault(); // Prevent default form submission
            e.stopPropagation(); // Stop event propagation
          }}
        >
          {formContent}
        </form>
      </FormProvider>
    </StyledFormContainer>
  );
};

export default DynamicForm;
