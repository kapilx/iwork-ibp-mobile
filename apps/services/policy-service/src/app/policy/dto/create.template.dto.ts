// export class GetInceptionTemplateParamsDto {
//   policyId!: string;
// }

export interface DataTemplateField {
  fieldName: string;
  fieldType: string;
  options: string[] | null;
  example?: string | null;
}

export const MandatoryDataIntakeFields: DataTemplateField[] = [
  {
    fieldName: "Intake Type",
    fieldType: "list",
    options: ["INCEPTION", "ADDITION", "DELETION"],
  },
  { fieldName: "Employee ID", fieldType: "string", options: null },
  { fieldName: "Full Name", fieldType: "string", options: null },
  {
    fieldName: "Date of Birth",
    fieldType: "date",
    options: null,
    example: "dd/mm/yyyy or dd-mm-yyyy or yyyy-mm-dd or yyyy/mm/dd formats are only supported",
  },
  { fieldName: "Gender", fieldType: "list", options: ["Male", "Female"] },
  { fieldName: "email", fieldType: "string", options: null },
  { fieldName: "Mobile Number", fieldType: "string", options: null },
  {
    fieldName: "Effective Date",
    fieldType: "date",
    options: null,
    example: "dd/mm/yyyy or dd-mm-yyyy or yyyy-mm-dd or yyyy/mm/dd formats are only supported",
  },
  {
    fieldName: "Claim Status",
    fieldType: "list",
    options: ["Yes", "No"],
  },
  {
    fieldName: "Relation",
    fieldType: "list",
    options: ["Spouse", "Mother", "Father", "Son", "Daughter", "Self"],
  },
];

export const NonFinancialFields: DataTemplateField[] = [
    {
    fieldName: "IIRM ID",
    fieldType: "string",
    options: null
  },
    {
    fieldName: "TPA ID",
    fieldType: "string",
    options: null,
  },
]

export interface DownloadDocumentResponse {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface PolicyMetadataResponse {
  policyId: number;
}

export interface InceptionTemplateResponse {
  policy: PolicyMetadataResponse;
  document: DownloadDocumentResponse;
  fields: DataTemplateField[];
}
