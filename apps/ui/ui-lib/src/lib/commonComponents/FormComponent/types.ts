import {
  TextFieldProps,
  SelectProps,
  CheckboxProps,
  RadioGroupProps,
  RatingProps,
  OutlinedInputProps,
  SvgIconTypeMap,
} from "@mui/material";
import { DatePickerProps } from "@mui/x-date-pickers/DatePicker";
import { DateTimePickerProps } from "@mui/x-date-pickers/DateTimePicker";
import {
  Control,
  RegisterOptions,
  UseFormSetValue,
  UseFormTrigger,
  UseFormWatch,
} from "react-hook-form";
import { TimePickerProps } from "@mui/x-date-pickers/TimePicker";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { ButtonProps } from "../Button";
import { DynamicObject } from "../../constants/types";

export interface FileFieldProps extends OutlinedInputProps {
  accept?: string;
  multiple?: boolean;
  /**
   * Whether selecting a document type is required before upload. Defaults to
   * true to maintain backward compatibility.
   */
  requireDocumentType?: boolean;
  /**
   * Customizes the helper text shown below the upload control to describe
   * supported file formats.
   */
  supportedFormatsMessage?: string;
  /**
   * Endpoint to POST the file to. Defaults to org-service file upload API.
   */
  uploadEndpoint?: string;
  /**
   * Endpoint to PUT the file to when replacing an existing upload.
   */
  replaceEndpoint?: string;
  /**
   * HTTP method to use for replace requests. Defaults to PUT.
   */
  replaceMethod?: "POST" | "PUT";
  /**
   * Endpoint prefix used to delete uploaded files. Defaults to org-service delete API.
   */
  deleteEndpoint?: string;
  /**
   * When true, removing a file only updates local form state and skips backend delete.
   */
  deleteWithoutApi?: boolean;
  /**
   * Builds the download URL for a given uploaded file id.
   */
  getFileDownloadUrl?: (fileId: number) => string;
  /**
   * When true, use IBP upload/download behavior for this field instead of the default org-service file endpoints.
   */
  useIbpFileEndpoints?: boolean;
  /**
   * If true, no API request will be made on file selection and the File object
   * will be returned in the form values. Useful when the consumer wants to
   * handle the upload manually on form submission.
   */
  manualUpload?: boolean;
  leftIcon?:
    | React.ReactNode
    | (OverridableComponent<SvgIconTypeMap<{}, "svg">> & { muiName: string }); // Icon or element to display on the left
  rightIcon?:
    | React.ReactNode
    | (OverridableComponent<SvgIconTypeMap<{}, "svg">> & { muiName: string }); // Icon or element to display on the right
  /**
   * When true, disables the Choose File interaction while an upload request is
   * in-flight. Useful for flows that must wait for the server response before
   * allowing a new selection.
   */
  disableWhileUploading?: boolean;
  /**
   * Optional label for the download template button.
   */
  downloadTemplateLabel?: string;
  /**
   * When false, hides the download icon inside the download template button.
   * The button and its label remain visible. Defaults to true.
   */
  showDownloadIcon?: boolean;
}

export interface SegmentedControlProps {
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (value: string | number) => void;
  disabled?: boolean;
  shouldClearValue?: boolean;
}

export type FormFieldType =
  | "text"
  | "select"
  | "checkbox"
  | "radiogroup"
  | "switch"
  | "date"
  | "datetime"
  | "time"
  | "monthYear"
  | "rating"
  | "radio"
  | "file"
  | "textarea"
  | "url"
  | "richtext"
  | "number"
  | "tel"
  | "year"
  | "segmentedcontrol"
  | "multiselect"
  | "currency"
  | "button"
  | "title"
  | "daterange"
  | "timerange"
  | "documentupload"
  | "selectFieldByApi"
  | "fileupload"
  | "percentage"
  | "multiSelectFieldByApi"
  | "treeSelect"
  | "customcomponent"
  | "checkboxWithDescriptionApiField";

export type FileFieldVariant =
  | "default"
  | "primary"
  | "secondary"
  | "info"
  | "ternary"
  | "endorsementDoc";

export interface FileFieldVariantProps {
  hideDropdown?: boolean; // Used to hide the dropdown in the file upload field
  customVariant?: FileFieldVariant; // Custom variant for the file field
}

type BaseFieldProps = {
  disabled?: boolean;
  minWidth?: string;
  popperDetails?: Record<string, any>;
  checkboxVariant?: "default" | "documentType";
  leftIcon?: React.ReactNode | (() => JSX.Element);
  leftIconUrl?: string;
  rightIcon?: React.ReactNode | (() => JSX.Element);
  rightIconUrl?: string;
  buttonText?: string;
  customStyles?: React.CSSProperties;
  showCharCountLimit?: number;
  customVariant?: FileFieldVariant;
  variantType?: "primary" | "secondary" | "tertiary";
  enableCopyPaste?: boolean; // When true, allows copy-paste in the field regardless of org-level settings
  companyType?: string; // Used to store the company type
  disableBrowserPasswordManager?: boolean; // When true, prevents browser password detection and autofill
  // Array of documents to prefill DocumentUploadField
  documents?: any[];
  // Lookup key to pre-select a document type in DocumentUploadField
  defaultDocumentTypeLookupKey?: string;
  iconStyles?: React.CSSProperties; // Custom styles for icons in the field
  /**
   * Callback invoked when a document upload succeeds. Consumers can use this
   * to trigger side-effects like autosaving the parent form.
   */
  onUploadSuccess?: () => void;
  controlledSearchInput?: boolean;
  disableOptionWhenTrueKey?: string;
  preventDuplicateSelections?: boolean;
  /**
   * Exclude values already selected in other form fields.
   * Accepts paths like "preferredInsurers.insurerId" or config objects.
   */
  excludeSelectedValuesFrom?:
    | Array<
        | string
        | {
            field: string;
            valuePath?: string;
          }
      >
    | undefined;
  disablePortal?: boolean;
  showAge?: boolean;
  inlineLabel?: boolean;
  labelMinWidth?: number | string;
  labelCustomStyles?: React.CSSProperties;
  /** Segmented control only: wrap options 2-per-row instead of one squeezed row. */
  wrapSegments?: boolean;
  searchOnlyMode?: boolean; // When true, shows as plain input with suggestions only when typing (YouTube-style search)
  isBold?: boolean;
  fontSize?: string;
  /** When provided, renders an action button inside the "no options" dropdown panel. */
  noOptionsAction?: { label: string; onClick: () => void };
};

export type FormFieldComponentProps =
  | (TextFieldProps & BaseFieldProps)
  | (SelectProps & BaseFieldProps)
  | (CheckboxProps & BaseFieldProps)
  | (RadioGroupProps & BaseFieldProps)
  | (DatePickerProps<any> & BaseFieldProps)
  | (DateTimePickerProps<any> & BaseFieldProps)
  | (RatingProps & BaseFieldProps)
  | (TimePickerProps<any> & BaseFieldProps)
  | (FileFieldProps & BaseFieldProps)
  | (SegmentedControlProps & BaseFieldProps)
  | (ButtonProps & BaseFieldProps);

type FieldOptions = string | number;

export interface ApiDependencies {
  endPoint?: string | ((id: number) => string) | ((...args: any[]) => string);
  showCondition?: (watch: UseFormWatch<any>) => boolean; //this case is written just for group companyId or else we dont need this field at all
  clearFieldsOnChange?: string[];
  dependentField?: string;
  utilityFunction?: (data: any, globalState?: any) => any;
  utilityDependent?: string;
  customParams?: Record<string, any>;
  // param?: string; //id of the current page(company/contact/empyoyee)
  isSmartSearch?: boolean;
  defaultValue?: string; //default value for the select field
  valueField?: string; //field to be used as value in the select field
  labelField?: string; //field to be used as label in the select field
  syncLabelTo?: string; //when set, mirrors the selected option's label into this sibling field
  storeSelectedOption?: boolean; //multiselect only: keep {value,label} so filter summaries can show labels instead of raw ids
}

export interface CaluculationDependencies {
  calculateAmount: string[];
}
export interface FormFieldConfig {
  key: string;
  name: string;
  label: string;
  type: FormFieldType;
  syncFieldName?: string;
  companyId?: string | number; // Used to store the company ID
  opportunityId?: string; // Used to store the opportunity ID
  opportunityActivityId?: string; // Used to store the opportunity activity ID
  policyId?: string | number; // Used to store the policy ID
  claimActivityId?: string | number; // Used to store the claim activity ID
  endorsementId?: string | number; // Used to store the endorsement/inception ID
  uploadCategory?: string; // Storage namespace for the upload (e.g., "insurer_ack")
  editMode?: boolean;
  componentProps?: FormFieldComponentProps;
  rules?: RegisterOptions;
  requiredWhenVisible?: boolean;
  options?: { value: FieldOptions; label: string }[];
  gridColumn?: number;
  /** Extra sx merged onto the field's Grid item wrapper (e.g. alignSelf) */
  gridItemSx?: Record<string, any>;
  apiDependencies?: ApiDependencies;
  inputDependentField?: string[];
  disabledInEditMode?: boolean;
  dependentFieldsOnBlur?: string;
  textTransform?: "uppercase" | "lowercase"; //used to enter the text in upper case or lower case
  /** If true, format numeric input with thousand separators based on localization */
  formatNumber?: boolean;
  leftIcon?: React.ReactNode; // Icon or element to display on the left
  rightIcon?: React.ReactNode; // Icon or element to display on the right
  UploadIcon?: string;
  disabled?: boolean;
  defaultValue?: string | number; //default value for the select field
  width?: number; //width of the field
  placeholder?: string; //placeholder for the field
  enableSearch?: boolean; //enable search for the field
  noOptionsText?: React.ReactNode; //custom empty-state for searchable selects
  helperText?: React.ReactNode; //informational helper text below the field
  subLabel?: React.ReactNode; //secondary line under the label, above the input
  subFields?: FormFieldConfig[]; //used to enter the text in upper case or lower case
  onClick?: string | ((key: any) => void);
  fromName?: string; //used to get the value from the form
  toName?: string; //used to set the value to the form
  fromLabel?: string; //used to get the label from the form
  hideDropdown?: boolean;
  toLabel?: string; //used to set the label to the form
  showField?: (watch: UseFormWatch<any>) => boolean; //used to show or hide the field
  // Row-aware config override for fields rendered inside MultipleSections.
  // The framework calls this with a watcher scoped to the current row's
  // prefix and merges the returned partial onto the field's enhanced config
  // before render — useful for per-row label / rules / disabled state.
  getDynamicConfig?: (
    watch: (path: string) => unknown
  ) => Partial<FormFieldConfig>;
  localizationKey?: string; //used to get the label from the localization file
  isDecimal?: boolean; //used to check if the field is decimal or not
  allowNegative?: boolean; //allow negative numbers for number fields
  percentageFields?: [string, string]; //used to calculate the percentage of two fields
  calculations?: CaluculationDependencies;
  labelStyles?: React.CSSProperties;
  fieldStyles?: React.CSSProperties;
  disablePortal?: boolean;
}

export interface FieldComponentProps {
  field: FormFieldConfig;
  control: Control;
  watch: UseFormWatch<any>; // Add watch
  setValue: UseFormSetValue<any>; // Add setValue
  buttonText?: string;
  trigger?: UseFormTrigger<any>;
  isFormAnArray?: boolean; //Multiple sections like addresses
  onActionMap?: { [actionName: string]: () => void };
  disableAllFields?: boolean; // For disabling all fields in the form
  enableSmartSearch?: boolean; // For enabling smart search functionality
  selectedDocumentType?: string | undefined; // Used to store the selected document type
  companyId?: string; // Used to store the company ID
  opportunityId?: string; // Used to store the opportunity ID
  opportunityActivityId?: string; // Used to store the opportunity activity ID
  policyId?: string | number; // Used to store the policy ID
  claimActivityId?: string | number; // Used to store the claim activity ID
  endorsementId?: string | number; // Used to store the endorsement/inception ID
  uploadCategory?: string; // Storage namespace for the upload (e.g., "insurer_ack")
  onUploadingChange?: (isUploading: boolean) => void; // Callback to handle uploading state
  onFileUploaded?: (fileData: any) => void;
  companyType?: string;
  onFileUpload?: (files: File[] | File, isApiRes?: boolean) => void;
  onUploadSuccess?: () => void;
  unregisterSection?: boolean; // New prop to control unregistering sections
  percentageFields?: [string, string];
  showValue?: boolean; // New prop to control value display
  renderAsTable?: boolean; // New prop to control table rendering
  popperDetails?: any;
  disablePortal?: boolean;
}

export interface NestedFormFieldConfig {
  key: string;
  title?: string;
  config: FormFieldConfig[];
  defaultValues?: Record<string, any>[] | Record<string, any>;
  isMultiple?: boolean; //if true then it will be rendered as a multiple section
  isButtons?: boolean; //if true then it will be rendered as a button section
  containerStyles?: React.CSSProperties;
  renderAction?: DynamicObject[];
  disableAllFields?: boolean | string; //if true then all fields will be disabled
  showSection?: (watch: UseFormWatch<any>) => boolean;
  enableSmartSearch: boolean;
}
