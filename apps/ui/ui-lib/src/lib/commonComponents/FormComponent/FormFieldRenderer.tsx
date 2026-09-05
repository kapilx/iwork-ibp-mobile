import React, { useEffect } from "react";
import { FieldComponentProps } from "./types";
import TextField from "./Fields/TextField";
import SelectField from "./Fields/SelectField";
import CheckboxField from "./Fields/CheckboxField";
import RadioGroupField from "./Fields/RadioGroupField";
import SwitchField from "./Fields/SwitchField";
import DateField from "./Fields/DateField";
import RatingField from "./Fields/RatingField";
import FileField from "./Fields/FileField";
import RichText from "./Fields/RichText";
import SegmentedControl from "./Fields/SegmentedControl";
import TextAreaFieldComponent from "./Fields/TextAreaField";
import MultiSelectField from "./Fields/MultiSelect";
import ButtonField from "./Fields/ButtonField";
import { Typography } from "@mui/material";
import { StyledTitle } from "./Fields/styles";
import DateRange from "./Fields/DateRange";
import NumberField from "./Fields/NumberField";
import CurrencyInput from "../CurrencyInput";
import TimeRange from "./Fields/TimeRange";
import DocumentUploadField from "./Fields/DocumentUploadField";
import TreeSelect from "./Fields/TreeSelect";
import SelectFieldByApi from "./Fields/SelectFieldByApi";
import FileUpload from "./Fields/FileUpload";
import PercentageFieldComponent from "./Fields/PercentageField";
import MultiSelectByApi from "./Fields/MultiSelectByApi";
import EndorsementDocument from "../EndorsementDocument";
import DocumentTableField from "../DocumentTableField";
import { CUSTOMCOMPONENT } from "@ui/ui-lib";
import EndorsementSummary from "../EndorsementSummary";
import CheckboxWithDescriptionApiField from "./Fields/CheckboxWithDescriptionApiField";
import EndorsementDataDownload from "../EndorsementDataDownload";
import PremiumCalculatorDownload from "../PremiumCalculatorDownload";

// Map for custom (non-field) react components referenced by config.componentProps.componentKey
// Extend this as new custom components are introduced.
const customComponentMap: Record<string, React.ComponentType<any>> = {
  EndorsementDocument,
  EndorsementSummary,
  EndorsementDataDownload,
  DocumentTableField,
  PremiumCalculatorDownload,
};

type FieldComponentType = React.ComponentType<FieldComponentProps>;

const componentMap: { [key: string]: FieldComponentType } = {
  text: TextField as FieldComponentType,
  select: SelectField as FieldComponentType,
  checkbox: CheckboxField as FieldComponentType,
  radiogroup: RadioGroupField as FieldComponentType,
  switch: SwitchField as FieldComponentType,
  date: DateField as FieldComponentType,
  datetime: DateField as FieldComponentType,
  time: DateField as FieldComponentType,
  rating: RatingField as FieldComponentType,
  file: FileField as FieldComponentType,
  richtext: RichText as FieldComponentType,
  year: DateField as FieldComponentType,
  monthYear: DateField as FieldComponentType,
  segmentedcontrol: SegmentedControl as FieldComponentType,
  textarea: TextAreaFieldComponent as FieldComponentType,
  multiselect: MultiSelectField as FieldComponentType,
  currency: CurrencyInput as FieldComponentType,
  button: ButtonField as FieldComponentType,
  title: Typography as FieldComponentType,
  daterange: DateRange as FieldComponentType, // Assuming you have a DateRange component
  timerange: TimeRange as FieldComponentType,
  selectFieldByApi: SelectFieldByApi as FieldComponentType,
  multiSelectFieldByApi: MultiSelectByApi as FieldComponentType,
  checkboxWithDescriptionApiField:
    CheckboxWithDescriptionApiField as FieldComponentType,
  number: NumberField as FieldComponentType, // Assuming number fields are handled by TextField
  fileupload: FileUpload as FieldComponentType, // Assuming you have a FileField component
  documentupload: DocumentUploadField as FieldComponentType, // Assuming you have a DocumentUploadField component
  treeSelect: TreeSelect as FieldComponentType,
  percentage: PercentageFieldComponent as FieldComponentType, // Assuming you have a PercentageFieldComponent
};

const FormFieldRenderer = ({
  field,
  watch,
  setValue,
  control,
  trigger,
  isFormAnArray = false, //like multiple addresses sections
  onActionMap, // for button fields
  disableAllFields = false,
  enableSmartSearch,
  onFileUpload,
  unregisterSection = false,
  showValue = false,
  renderAsTable = false,
}: FieldComponentProps) => {
  if (field.type === "title") {
    return (
      <StyledTitle isBold={field?.componentProps?.isBold} fontSize={field?.componentProps?.fontSize}>
        {field.label}
      </StyledTitle>
    );
  }

  if (field.type === CUSTOMCOMPONENT) {
    const key = field?.componentProps?.componentKey as string | undefined;
    const CustomComp = key ? customComponentMap[key] : undefined;
    if (!CustomComp) {
      return null;
    }
    const { componentKey, ...rest } = field.componentProps || {};
    return <CustomComp {...rest} disableAllFields={disableAllFields} />;
  }

  const Component = componentMap[field.type as string] || TextField;

  useEffect(() => {
    if (disableAllFields && unregisterSection) {
      control.unregister(field.name); //unregistering the field
    }
  }, [
    disableAllFields,
    unregisterSection,
    field.name,
    setValue,
    watch,
    control,
  ]);

  return (
    <Component
      disableAllFields={disableAllFields}
      field={field}
      control={control}
      watch={watch}
      setValue={setValue}
      trigger={trigger}
      isFormAnArray={isFormAnArray}
      onActionMap={onActionMap}
      enableSmartSearch={enableSmartSearch}
      onFileUpload={onFileUpload}
      {...(field.componentProps || {})}
      showValue={showValue}
      renderAsTable={renderAsTable}
    />
  );
};

export default FormFieldRenderer;
