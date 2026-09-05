import {
  CardBackground,
  CustomModal,
  endPoints,
  SEARCH,
  setToastMessage,
  SmartSearch,
  Table,
  Button,
  BULK_DOWNLOAD,
  LIST_OF_DOCUMENTS,
  CONFIRM_DOWNLOAD,
  BULK_DOWNLOAD_MESSAGES,
  DOWNLOAD_MESSAGES,
  FeatureKey,
  selectHasPermission,
  environment,
} from "@ui/ui-lib";
import { useFormWatcher, useTableController } from "@ui/ui-lib/hooks";
import { axiosInstance } from "@ui/ui-lib/utils";
import { useDispatch, useSelector } from "react-redux";
import {
  BulkDownloadButtonContainer,
  DisplayDocsStyledContainer,
  DocumentDownloadContainer,
  DocumentInfo,
} from "./styles";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { columns, defaultValues, smartSearchConfig } from "./config";
import { useForm } from "react-hook-form";
import { CellClickedEvent } from "ag-grid-community";
import { Typography } from "@mui/material";

interface SelectedFileInfo {
  id: string;
  fileName?: string;
  [key: string]: any;
}

interface DisplayDocumentsProps {
  endPoint: string;
  customColumns?: (handleFileDownload: (item: any) => void) => any[];
  emptyDataMessage?: string;
  onCellClicked?: (event: CellClickedEvent) => void;
  smartSearchConfig?: any;
  downloadModuleKey?: string;
  fileNamePrefix?: string;
  permissionFeatureKey?: FeatureKey;
  onUpload?: () => void;
  refreshKey?: number;
  isExportFeatureEnabled?: boolean;
}

const DisplayDocuments: React.FC<DisplayDocumentsProps> = ({
  endPoint,
  customColumns,
  emptyDataMessage,
  onCellClicked,
  smartSearchConfig: propSmartSearchConfig,
  downloadModuleKey,
  fileNamePrefix,
  permissionFeatureKey,
  onUpload,
  refreshKey,
}) => {
  const isBulkDownloadAllowed = useSelector((state: any) =>
    selectHasPermission(FeatureKey.BULK_DOWNLOAD_ENABLE)(state),
  );
  const isFileDownloadAllowedByRbac = useSelector((state: any) =>
    selectHasPermission(permissionFeatureKey ?? FeatureKey.EXPORT_DOCUMENTS)(state)
  );
  const isFileDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || isFileDownloadAllowedByRbac;
  const {
    rowData,
    totalRows,
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    PAGE_SIZE_OPTIONS,
    setSearchTerm,
    setSort,
    setSmartSearch,
    refetch,
  } = useTableController({
    endpoint: endPoint,
    searchFieldName: "fileName",
    defaultFieldName: "createdAt",
  });

  useEffect(() => {
    if (refreshKey) refetch();
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);
  const [bulkDownloadModalOpen, setBulkDownloadModalOpen] =
    useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(
    null,
  );
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<
    Array<string | number>
  >([]);
  const [selectedDocumentCount, setSelectedDocumentCount] = useState(0);
  const [bulkDownloadLoading, setBulkDownloadLoading] =
    useState<boolean>(false);
  const tableSelectionApiRef = useRef<{ clearSelection: () => void } | null>(
    null,
  );

  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchFieldName: "companyName",
    searchDefaultValues: defaultValues,
  });

  const handleRun = () => {
    setSmartSearch(selectedValues);
  };
  const dispatch = useDispatch();

  const handleOpenDownloadConfirm = useCallback(
    (item: SelectedFileInfo): void => {
      setSelectedFile(item);
      setDownloadModalOpen(true);
    },
    [],
  );

  const handleCloseDownloadModal = useCallback((): void => {
    setDownloadModalOpen(false);
    setSelectedFile(null);
  }, []);

  const handleOpenBulkDownloadConfirm = useCallback((): void => {
    if (!isBulkDownloadAllowed || selectedDocumentCount === 0) {
      return;
    }
    if (selectedDocumentIds.length === 0) {
      dispatch(setToastMessage(BULK_DOWNLOAD_MESSAGES.SELECT_AT_LEAST_ONE));
      return;
    }
    setBulkDownloadModalOpen(true);
  }, [isBulkDownloadAllowed,selectedDocumentCount, selectedDocumentIds.length, dispatch]);

  const handleCloseBulkDownloadModal = useCallback((): void => {
    setBulkDownloadModalOpen(false);
  }, []);

  const buildDownloadUrl = (fileId: number | string) => {
    const baseUrl = `${endPoints.fileUploadDownload}/${fileId}/download`;
    if (!downloadModuleKey) return baseUrl;
    return `${baseUrl}?moduleKey=${encodeURIComponent(downloadModuleKey)}`;
  };

  const handleFileDownload = async (item: any) => {
    try {
      const response = await axiosInstance(
        buildDownloadUrl(item.id),
        {
          method: "GET",
          responseType: "blob",
        },
      );

      const blob = response.data as Blob;

      // Only check for HTML if the blob is actually HTML
      if (blob.type.includes("text/html")) {
        const text = await blob.text();
        console.error("Received HTML instead of file:", text);
        dispatch(setToastMessage(DOWNLOAD_MESSAGES.FAILED_HTML));
        return;
      }

      let filename = item?.fileName || "download";

      const contentDisposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"\n]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      // Create a URL for the Blob and trigger the download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      dispatch(setToastMessage(DOWNLOAD_MESSAGES.FAILED));
    }
  };

  const confirmDownload = async (): Promise<void> => {
    if (selectedFile) {
      await handleFileDownload(selectedFile);
    }
    handleCloseDownloadModal();
  };

  const confirmBulkDownload = async (): Promise<void> => {
    handleCloseBulkDownloadModal();
    setBulkDownloadLoading(true);
    try {
      const response = await axiosInstance(endPoints.fileUploadBulkDownload, {
        method: "POST",
        data: {
          documentIds: selectedDocumentIds,
          moduleKey: downloadModuleKey,
        },
        responseType: "blob",
      });

      const blob = response.data as Blob;

      // Check if response is an error HTML page
      if (blob.type.includes("text/html")) {
        const text = await blob.text();
        console.error("Received HTML instead of ZIP:", text);
        dispatch(setToastMessage(BULK_DOWNLOAD_MESSAGES.DOWNLOAD_FAILED_HTML));
        return;
      }

      const contentType =
        response.headers?.["content-type"] || "application/zip";

      const now = new Date();
      const fallbackDate = `${String(now.getDate()).padStart(2, "0")}-${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}-${String(now.getFullYear()).slice(-2)}`;
      const fallbackName = fileNamePrefix
        ? `${fileNamePrefix}_documents_${fallbackDate}.zip`
        : `documents-${fallbackDate}.zip`;
      const filename = fallbackName;

      const downloadBlob = new Blob([blob], { type: contentType });

      // Create download link
      const url = URL.createObjectURL(downloadBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Clear selection after successful download
      tableSelectionApiRef.current?.clearSelection?.();
      setSelectedDocumentIds([]);
      setSelectedDocumentCount(0);
      dispatch(
        setToastMessage(
          BULK_DOWNLOAD_MESSAGES.DOWNLOAD_SUCCESS(selectedDocumentCount),
        ),
      );
    } catch (err: any) {
      console.error("Bulk download error:", err);
      const errorMessage =
        err?.response?.data?.message || BULK_DOWNLOAD_MESSAGES.DOWNLOAD_FAILED;
      dispatch(setToastMessage(errorMessage));
    } finally {
      setBulkDownloadLoading(false);
    }
  };

  const handleRowSelectionChange = useCallback(
    (selection: {
      selectedRowIds: Array<string | number>;
      isAllSelected: boolean;
      selectedCount: number;
      includedRowIds: Array<string | number>;
      excludedRowIds: Array<string | number>;
    }) => {
      // Use selectedCount as the source of truth, not the array length
      setSelectedDocumentCount(selection.selectedCount);
      if (selection.selectedCount === 0) {
        setSelectedDocumentIds([]);
      } else {
        setSelectedDocumentIds(selection.selectedRowIds);
      }
    },
    [],
  );

  // Memoize columns to prevent recreation on every render
  const tableColumns = useMemo(
    () => (customColumns || columns)(handleOpenDownloadConfirm, isFileDownloadAllowed),
    [customColumns, handleOpenDownloadConfirm, isBulkDownloadAllowed, isFileDownloadAllowed],
  );

  // Memoize cell click handler
  const handleCellClick = useCallback(
    (event: CellClickedEvent) => {
      if (onCellClicked) {
        onCellClicked(event);
      }
    },
    [onCellClicked],
  );

  // Use provided smartSearchConfig or fall back to default
  const resolvedSmartSearchConfig = propSmartSearchConfig || smartSearchConfig;

  return (
    <DisplayDocsStyledContainer>
      <CardBackground>
        <SmartSearch
          searchFormConfig={resolvedSmartSearchConfig}
          searchDefaultValues={defaultValues}
          searchFormMethods={setFormMethods}
          selectedValues={selectedValues}
          onReset={handleReset}
          formMethods={formMethods}
          searchFieldName="fileName"
          placeholder={SEARCH}
          enableSmartSearch={true}
          onRunFilters={handleRun}
        />
      </CardBackground>
      <DocumentInfo>
        <BulkDownloadButtonContainer>
          <Typography variant="h1">{LIST_OF_DOCUMENTS}</Typography>
          <div style={{ display: "flex", gap: "8px", alignItems: "center",marginRight: "10px" }}>
            {onUpload && (
              <Button
                variantType="primary"
                onClick={onUpload}
                label="Upload Document"
               
              />  
            )}
            {selectedDocumentCount > 0 && isBulkDownloadAllowed && selectedDocumentIds.length > 0 && (
              <Button
                variantType="secondary"
                onClick={handleOpenBulkDownloadConfirm}
                disabled={bulkDownloadLoading}
                label={BULK_DOWNLOAD}
                loading={bulkDownloadLoading}
              />
            )}
          </div>
        </BulkDownloadButtonContainer>

        <Table
          columns={tableColumns}
          rowData={rowData}
          totalRows={totalRows}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          loading={loading}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          setPageSize={setPageSize}
          onCellClicked={handleCellClick}
          setSort={setSort}
          height={450}
          emptyDataMessage={emptyDataMessage}
          enableRowSelection={isBulkDownloadAllowed}
          rowSelectionIdKey="id"
          onRowSelectionChange={handleRowSelectionChange}
          selectionApiRef={tableSelectionApiRef}
          rowSelectionLimit={
            isBulkDownloadAllowed
              ? environment.bulkDownloadSelectionLimit
              : undefined
          }
          displaySettingsButton={false}
          showSelectAllEntriesCta={false}
        />
      </DocumentInfo>
      <CustomModal
        open={downloadModalOpen}
        handleClose={handleCloseDownloadModal}
        heading={CONFIRM_DOWNLOAD}
        buttons={[
          {
            label: "Yes",
            variant: "primary",
            onClick: confirmDownload,
          },
          {
            label: "No",
            variant: "secondary",
            onClick: handleCloseDownloadModal,
          },
        ]}
        modalBoxStyles={{ width: "30%" }}
      >
        <DocumentDownloadContainer>
          {DOWNLOAD_MESSAGES.CONFIRM_MESSAGE(
            selectedFile?.fileName || "this file",
          )}
        </DocumentDownloadContainer>
      </CustomModal>

      <CustomModal
        open={bulkDownloadModalOpen}
        handleClose={handleCloseBulkDownloadModal}
        heading={CONFIRM_DOWNLOAD}
        buttons={[
          {
            label: "Yes",
            variant: "primary",
            onClick: confirmBulkDownload,
          },
          {
            label: "No",
            variant: "secondary",
            onClick: handleCloseBulkDownloadModal,
          },
        ]}
        modalBoxStyles={{ width: "30%" }}
      >
        <div>
          {`Do you want to download ${selectedDocumentIds.length} document${
            selectedDocumentIds.length > 1 ? "s" : ""
          } as a ZIP file?`}
        </div>
      </CustomModal>
    </DisplayDocsStyledContainer>
  );
};

export default DisplayDocuments;