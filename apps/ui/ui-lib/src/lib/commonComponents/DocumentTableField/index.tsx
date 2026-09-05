/* eslint-disable react/jsx-no-useless-fragment */
import AddIcon from "@mui/icons-material/Add";
import {
  CircularProgress,
  Table,
  TableBody,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import Button from "@ui/ui-lib/commonComponents/Button";
import {
  ENDORSEMENT_DOCUMENT_REPLACED,
  FAILED_TO_DELETE_FILE,
  FILE_URL_OR_BUFFER_IS_MISSING,
} from "@ui/ui-lib/constants";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { HTTP_METHODS } from "@ui/ui-lib/constants/types";
import { useFileUpload } from "@ui/ui-lib/hooks/useFileUpload";
import { useApiMutation } from "@ui/ui-lib/hooks/useMutation";
import { setToastMessage } from "@ui/ui-lib/redux/slice";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { useDispatch } from "react-redux";
import useHasPermission from "../../rbac/useHasPermission";
import { environment } from "@ui/ui-lib/environment";
import { FeatureKey } from "../../rbac/permissionMap";
import DeleteBinSvg from "../../assets/svgs/delete-bin.svg";
import DownloadIconSvg from "../../assets/svgs/download-icon.svg";
import RefreshIconSvg from "../../assets/svgs/refresh-icon.svg";
import DateField from "../FormComponent/Fields/DateField";
import TextFieldComponent from "../FormComponent/Fields/TextField";
import { FormFieldConfig } from "../FormComponent/types";
import {
  ActionButton,
  ActionsCell,
  AddRowContainer,
  BodyCell,
  FilePlaceholder,
  HeaderCell,
  StyledIconContainer,
  TableWrapper,
  UploadButton,
  UploadCellContent,
  UploadedFileName,
} from "./styles";

export interface DocumentTableRow {
  id?: string | number;
  documentName?: string;
  receivedDate?: string | null;
  uploadDate?: string | null;
  status?: string;
  documentupload?: any;
  documentType?: string | number;
  companyType?: string;
  companyId?: string | number;
  policyId?: string | number;
  claimActivityId?: string | number;
  isCustom?: boolean;
  [key: string]: any;
}

export interface DocumentTableFieldProps {
  name: string;
  rows?: DocumentTableRow[];
  uploadLabel?: string;
  accept?: string;
  addButtonLabel?: string;
  disableAllFields?: boolean;
  companyType?: string;
  companyId?: string | number;
  showAdditionalColumns?: boolean;
  policyId?: string | number;
  claimActivityId?: string | number;
  onDownload?: (row: DocumentTableRow, index: number) => void;
  onDelete?: (row: DocumentTableRow, index: number) => void;
  onReplace?: (row: DocumentTableRow, index: number) => void;
  isDownloadAllowed?: boolean;
}

const DEFAULT_DOCUMENT_ROWS = [
  "Policy Copy",
  "FIR",
  "Invoices",
  "Photos",
  "Estimate",
];

const DEFAULT_DOCUMENT_SET = new Set(
  DEFAULT_DOCUMENT_ROWS.map((value) => value.toLowerCase())
);

const ensureRowShape = (row: Partial<DocumentTableRow>): DocumentTableRow => ({
  documentName: row.documentName ?? "",
  receivedDate: row.receivedDate ?? null,
  uploadDate: row.uploadDate ?? null,
  status: row.status ?? "Pending",
  documentupload: row.documentupload ?? null,
  documentType: row.documentType ?? "",
  companyType: row.companyType,
  companyId: row.companyId,
  policyId: row.policyId,
  claimActivityId: row.claimActivityId,
  id: row.id,
  isCustom: row.isCustom ?? false,
});

const mergeInitialRows = (
  current: DocumentTableRow[] | undefined,
  provided: DocumentTableRow[] | undefined
): DocumentTableRow[] => {
  const byName = (rows?: DocumentTableRow[]) =>
    rows?.reduce<Record<string, DocumentTableRow>>((acc, item) => {
      if (!item) return acc;
      const key = (item.documentName ?? "").toLowerCase();
      if (!key) {
        acc[`__${Object.keys(acc).length}`] = ensureRowShape({
          ...item,
          isCustom: item.isCustom ?? true,
        });
        return acc;
      }
      if (!acc[key]) {
        acc[key] = ensureRowShape(item);
      }
      return acc;
    }, {}) ?? {};

  const currentMap = byName(current);
  const providedMap = byName(provided);

  const defaults = DEFAULT_DOCUMENT_ROWS.map((label) => {
    const key = label.toLowerCase();
    const row = currentMap[key] ?? providedMap[key];
    return ensureRowShape({
      ...row,
      documentName: label,
      isCustom: false,
    });
  });

  const combinedCustomSources = [
    ...(current ?? []),
    ...(provided ?? []),
  ].filter((row) => {
    if (!row) return false;
    const nameKey = (row.documentName ?? "").toLowerCase();
    return nameKey && !DEFAULT_DOCUMENT_SET.has(nameKey);
  });

  const seenCustom = new Set<string>();
  const customRows = combinedCustomSources
    .map((row) => ensureRowShape({ ...row, isCustom: true }))
    .filter((row) => {
      const nameKey = (row.documentName ?? "").toLowerCase();
      if (!nameKey) {
        const idKey = String(row.id ?? Math.random());
        if (seenCustom.has(idKey)) return false;
        seenCustom.add(idKey);
        return true;
      }
      if (seenCustom.has(nameKey)) return false;
      seenCustom.add(nameKey);
      return true;
    });

  return [...defaults, ...customRows];
};

const toOptionalString = (value?: string | number | null) =>
  value === undefined || value === null ? "" : String(value);

const resolveUploadValue = (value: any) => {
  if (!value) return null;
  if (value.fileUpload) return value.fileUpload;
  return value;
};

interface RowProps {
  index: number;
  name: string;
  uploadLabel: string;
  accept?: string;
  disableAllFields: boolean;
  showAdditionalColumns?: boolean;
  onDownload?: (row: DocumentTableRow, index: number) => void;
  onDelete?: (row: DocumentTableRow, index: number) => void;
  onReplace?: (row: DocumentTableRow, index: number) => void;
  defaults: Pick<
    DocumentTableFieldProps,
    "companyType" | "companyId" | "policyId" | "claimActivityId"
  >;
  field: any;
  isDownloadAllowed: boolean;
}

const DocumentTableRowFields: React.FC<RowProps> = ({
  index,
  name,
  uploadLabel,
  accept,
  disableAllFields,
  showAdditionalColumns,
  onDownload,
  onDelete,
  onReplace,
  defaults,
  field,
}) => {
  const dispatch = useDispatch();
  const { control, setValue, watch, trigger } = useFormContext();
  const rowPath = `${name}.${index}`;
  const fieldValue =
    (useWatch({ control, name: rowPath }) as DocumentTableRow) || {};

  const mergedRow = useMemo(() => ensureRowShape(fieldValue), [fieldValue]);

  const fileInfo = resolveUploadValue(mergedRow.documentupload);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { handleFileChange, loading: isUploading } = useFileUpload(
    fileInfo ?? undefined,
    endPoints.fileUpload
  );
  const { mutate: deleteFile, isPending: isDeleting } = useApiMutation({});
  const [isDownloading, setIsDownloading] = useState(false);

  const triggerFileDialog = () => {
    if (!disableAllFields) {
      fileInputRef.current?.click();
    }
  };
  const hasRbacPermissionDownload = useHasPermission(FeatureKey.EXPORT_DOCUMENT_TABLE);
  const permissionDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermissionDownload;
  const isFileDownloadAllowed = hasRbacPermissionDownload??permissionDownloadAllowed;

  const updateUploadField =
    (onChange: (value: any) => void) => (uploadedData: any) => {
      const hadExistingFile = Boolean(fileInfo?.id);
      const normalized = {
        ...uploadedData,
        fileUpload: uploadedData,
        documentType: mergedRow.documentType ?? "",
        documentName: mergedRow.documentName?.trim().length
          ? mergedRow.documentName
          : uploadedData?.fileName ?? mergedRow.documentName ?? "",
      };

      onChange(normalized);
      setValue(`${rowPath}.documentupload`, normalized, {
        shouldValidate: true,
        shouldDirty: true,
      });

      if (!mergedRow.documentName?.trim().length) {
        setValue(`${rowPath}.documentName`, normalized.documentName, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (hadExistingFile) {
        dispatch(setToastMessage(ENDORSEMENT_DOCUMENT_REPLACED));
        onReplace?.({ ...mergedRow, documentupload: normalized }, index);
      }
    };

  const handleDeleteFile = (
    onChange: (value: any) => void,
    currentRow: DocumentTableRow
  ) => {
    const currentFile = resolveUploadValue(currentRow.documentupload);
    const fileId = currentFile?.id;

    const clearFile = () => {
      onChange(null);
      setValue(`${rowPath}.documentupload`, null, {
        shouldDirty: true,
        shouldValidate: true,
      });
      onDelete?.({ ...currentRow, documentupload: null }, index);
    };

    if (!fileId) {
      clearFile();
      return;
    }

    deleteFile(
      {
        endpoint: `${endPoints.fileUploadDelete}/${fileId}`,
        method: HTTP_METHODS.DELETE,
      },
      {
        onSuccess: () => {
          clearFile();
        },
        onError: (error) => {
          dispatch(
            setToastMessage(
              `${FAILED_TO_DELETE_FILE}: ${error?.message ?? ""}`.trim()
            )
          );
        },
      }
    );
  };

  const handleDownloadFile = async (row: DocumentTableRow) => {
    // if (disableAllFields) return;

    if (typeof window === "undefined" || typeof document === "undefined") {
      dispatch(
        setToastMessage("Download is not supported in this environment.")
      );
      return;
    }

    const file = resolveUploadValue(row.documentupload);
    const fileId = file?.id;
    const fileUrl = file?.url || file?.fileUrl;
    const fileBuffer = file?.fileBuffer;

    if (!fileId && !fileUrl && !fileBuffer) {
      dispatch(setToastMessage(FILE_URL_OR_BUFFER_IS_MISSING));
      return;
    }

    try {
      setIsDownloading(true);

      if (fileId) {
        const response = await apiRequest(
          endPoints.fileUploadDownloadById(fileId),
          {
            method: HTTP_METHODS.GET,
            responseType: "blob",
          }
        );
        const blob = response.data as Blob;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file?.fileName ?? row.documentName ?? "document";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (fileUrl) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = file?.fileName ?? row.documentName ?? "document";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (fileBuffer) {
        const byteCharacters = window.atob(fileBuffer);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i += 1) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file?.fileName ?? row.documentName ?? "document";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      onDownload?.(row, index);
    } catch (error: any) {
      dispatch(setToastMessage(error?.message ?? "Unable to download file"));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <TableRow>
      <BodyCell>
        {mergedRow.isCustom ? (
          <TextFieldComponent
            control={control}
            watch={watch}
            setValue={setValue}
            trigger={trigger}
            field={
              {
                key: `${rowPath}.documentName`,
                name: `${rowPath}.documentName`,
                type: "text",
                componentProps: {
                  fullWidth: true,
                  placeholder: "Enter document name",
                  disabled: disableAllFields,
                },
              } as FormFieldConfig
            }
          />
        ) : (
          <Typography variant="body2">{field.documentName}</Typography>
        )}
      </BodyCell>
      {showAdditionalColumns && (
        <BodyCell>
          <Typography variant="body2">{mergedRow.status}</Typography>
        </BodyCell>
      )}
      <BodyCell fromDateField={true}>
        <DateField
          control={control}
          watch={watch}
          setValue={setValue}
          trigger={trigger}
          field={
            {
              key: `${rowPath}.receivedDate`,
              name: `${rowPath}.receivedDate`,
              type: "date",
              componentProps: {
                fullWidth: true,
                disabled: disableAllFields,
              },
            } as FormFieldConfig
          }
          popperDetails={{
            placement: "right-start", // opens calendar on right side
            modifiers: [
              {
                name: "offset",
                options: {
                  offset: [0, 10], // small gap between icon and popup
                },
              },
            ],
          }}
        />
      </BodyCell>
      {showAdditionalColumns && (
        <BodyCell fromDateField={true}>
          <DateField
            control={control}
            watch={watch}
            setValue={setValue}
            trigger={trigger}
            field={
              {
                key: `${rowPath}.uploadDate`,
                name: `${rowPath}.uploadDate`,
                type: "date",
                componentProps: {
                  fullWidth: true,
                  disabled: disableAllFields,
                },
              } as FormFieldConfig
            }
            popperDetails={{
              placement: "right-start", // opens calendar on right side
              modifiers: [
                {
                  name: "offset",
                  options: {
                    offset: [0, 10], // small gap between icon and popup
                  },
                },
              ],
            }}
          />
        </BodyCell>
      )}
      <BodyCell>
        <Controller
          name={`${rowPath}.documentupload`}
          control={control}
          render={({ field }) => {
            const hasFile = Boolean(resolveUploadValue(field.value));
            return (
              <UploadCellContent>
                <input
                  ref={fileInputRef}
                  hidden
                  type="file"
                  accept={accept}
                  onChange={(event) => {
                    if (disableAllFields) {
                      event.preventDefault();
                      return;
                    }
                    handleFileChange(
                      event,
                      mergedRow.companyType ?? defaults.companyType ?? "",
                      toOptionalString(
                        mergedRow.companyId ?? defaults.companyId ?? ""
                      ),
                      toOptionalString(mergedRow.documentType ?? ""),
                      updateUploadField(field.onChange),
                      undefined,
                      undefined,
                      toOptionalString(
                        mergedRow.policyId ?? defaults.policyId ?? ""
                      ),
                      toOptionalString(
                        mergedRow.claimActivityId ??
                          defaults.claimActivityId ??
                          ""
                      )
                    );
                  }}
                />
                {hasFile ? (
                  <UploadedFileName>
                    {resolveUploadValue(field.value)?.fileName ||
                      mergedRow.documentName ||
                      "Uploaded file"}
                  </UploadedFileName>
                ) : disableAllFields ? (
                  <FilePlaceholder>Pending file upload</FilePlaceholder>
                ) : (
                  <UploadButton
                    onClick={triggerFileDialog}
                    variant="outlined"
                    disabled={disableAllFields || isUploading}
                  >
                    {isUploading ? <CircularProgress size={20} /> : uploadLabel}
                  </UploadButton>
                )}
              </UploadCellContent>
            );
          }}
        />
      </BodyCell>
      <ActionsCell>
        <Controller
          name={`${rowPath}.documentupload`}
          control={control}
          render={({ field }) => {
            const hasFile = Boolean(resolveUploadValue(field.value));
            if (!hasFile) {
              return null;
            }

            const currentRow = {
              ...mergedRow,
              documentupload: field.value,
            } as DocumentTableRow;

            return (
              <>
                {isUploading || isDeleting || isDownloading ? (
                  <CircularProgress size={20} />
                ) : (
                  <StyledIconContainer>
                    {isFileDownloadAllowed && (
                      <Tooltip title="Download">
                        <span>
                          <ActionButton
                            onClick={() => handleDownloadFile(currentRow)}
                          >
                            <img src={DownloadIconSvg} alt="Download Icon" />
                          </ActionButton>
                        </span>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <span>
                        <ActionButton
                          disabled={disableAllFields}
                          onClick={() =>
                            handleDeleteFile(field.onChange, currentRow)
                          }
                        >
                          <img src={DeleteBinSvg} alt="Delete Icon" />
                        </ActionButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Replace">
                      <span>
                        <ActionButton
                          disabled={disableAllFields}
                          onClick={triggerFileDialog}
                        >
                          <img src={RefreshIconSvg} alt="Replace Icon" />
                        </ActionButton>
                      </span>
                    </Tooltip>
                  </StyledIconContainer>
                )}
              </>
            );
          }}
        />
      </ActionsCell>
    </TableRow>
  );
};

const DocumentTableField: React.FC<DocumentTableFieldProps> = ({
  name,
  rows,
  uploadLabel = "Upload file",
  accept = ".pdf,.doc,.docx",
  addButtonLabel = "Add other document",
  disableAllFields = false,
  showAdditionalColumns = false,
  onDownload,
  onDelete,
  onReplace,
  companyType,
  companyId,
  policyId,
  claimActivityId,
}) => {
  const { control, getValues } = useFormContext();
  const { fields, append, replace } = useFieldArray({ control, name });
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (initialised) return;
    const current = getValues(name) as DocumentTableRow[] | undefined;
    replace(mergeInitialRows(current, rows));
    setInitialised(true);
  }, [getValues, name, replace, rows, initialised]);

  const defaults = useMemo(
    () => ({
      companyType,
      companyId,
      policyId,
      claimActivityId,
    }),
    [companyType, companyId, policyId, claimActivityId]
  );

  const handleAddRow = () => {
    append(
      ensureRowShape({
        documentName: "",
        receivedDate: null,
        uploadDate: null,
        status: "Pending",
        documentupload: null,
        isCustom: true,
      })
    );
  };

  return (
    <TableWrapper>
      <Table size="small">
        <TableHead>
          <TableRow>
            <HeaderCell>Document Name</HeaderCell>
            {showAdditionalColumns && <HeaderCell>Status</HeaderCell>}
            <HeaderCell>Received Date</HeaderCell>
            {showAdditionalColumns && <HeaderCell>Upload Date</HeaderCell>}
            <HeaderCell>File</HeaderCell>
            <HeaderCell align="center">Actions</HeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fields.map((field, index) => (
            <DocumentTableRowFields
              key={field.id ?? `${name}-${index}`}
              index={index}
              name={name}
              uploadLabel={uploadLabel}
              accept={accept}
              disableAllFields={disableAllFields}
              showAdditionalColumns={showAdditionalColumns}
              onDownload={onDownload}
              onDelete={onDelete}
              onReplace={onReplace}
              defaults={defaults}
              field={field}
            />
          ))}
        </TableBody>
      </Table>
      <AddRowContainer>
        <Button
          startIcon={<AddIcon />}
          variantType="secondary"
          onClick={handleAddRow}
          disabled={disableAllFields}
        >
          {addButtonLabel}
        </Button>
      </AddRowContainer>
    </TableWrapper>
  );
};

export default DocumentTableField;
