import { FormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";
import { requiredErrorMessage } from "@ui/ui-lib/constants/errors";
import dayjs from "dayjs";

export const InsurerAcknowledgementConfig = [
  {
    key: "insurerEndorsementId",
    name: "insurerEndorsementId",
    label: "Insurer endorsement Id",

    gridColumn: 9,
    type: "text",
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Insurer endorsement Id"),
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "acknowledgementReceivedDate",
    name: "acknowledgementReceivedDate",
    label: "Acknowledgement received date",
    gridColumn: 9,
    type: "date",
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Acknowledgement received date"),
      },
    },
    componentProps: {
      fullWidth: true,
      maxDate: dayjs(),
    },
  },
  {
    key: "uploadEndorsementFile",
    name: "uploadEndorsementFile",
    label: "Upload Endorsement File*",
    type: "documentupload",
    hideDropdown: true, // no document type dropdown
    companyId: -1,
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      companyType: "endorsement",
      placeholder: "Upload files...",
      multiple: true,
      accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png,  .xlsx,.xls, .csv",
      formFieldName: "uploadEndorsementFile",
      customVariant: "ternary",
    },
  },
];

export const InsurerAcknowledgementDefaultValues = {
  acknowledgementReceivedDate: dayjs().format("YYYY-MM-DD"),
  uploadEndorsementFile: [],
};
