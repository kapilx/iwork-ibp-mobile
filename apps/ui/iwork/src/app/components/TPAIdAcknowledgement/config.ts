import { requiredErrorMessage } from "@ui/ui-lib/constants/errors";
import dayjs from "dayjs";

export const TPAAcknowledgementConfig = [
  {
    key: "tpaAcknowledgedDate",
    name: "tpaAcknowledgedDate",
    label: "TPA ID's Acknowledgement Received Date",
    gridColumn: 9,
    type: "date",
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("TPA ID's Acknowledgement Received Date"),
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
      accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png, .xlsx,.xls, .csv",
      formFieldName: "uploadEndorsementFile",
      maxLimit: 1,
      customVariant: "ternary",
    },
  },
];

export const TPAAcknowledgementFormDefaultValues = {
  tpaAcknowledgedDate: dayjs().format("YYYY-MM-DD"),
  uploadEndorsementFile: [],
};
