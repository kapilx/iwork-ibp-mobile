/* eslint-disable @nx/enforce-module-boundaries */
import { useDispatch } from "react-redux";
import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Box, styled } from "@mui/material";
import useTableController from "@ui/ui-lib/hooks/useTableController";
import { endPoints, Table, Button } from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { endPoints as uiLibEndpoint } from "@ui/ui-lib/constants/endPoints";
import { setToastMessage } from "@ui/ui-lib/redux/slice";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton";
import { instalmentsColumns, ActionRenderer } from "./config.js";
import InstallmentModal from "../InstallmentModal/index.js";
import downloadIcon from "../../assets/svgs/download-icon.svg";
import { TABLE_CONTROLLER_ENTITY_KEY } from "../../constants";

interface PolicyDetailsInstallmentsTabProps {
  premiumAndBrokerageDetails?: {
    netPremium?: string | number | null;
    otherAmount?: string | number | null;
  } | null;
}

const PolicyDetailsInstallmentsTab = ({
  premiumAndBrokerageDetails = null,
}: PolicyDetailsInstallmentsTabProps) => {
  const { id: policyId } = useParams();
  const dispatch = useDispatch();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  const {
    rowData,
    totalRows,
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    PAGE_SIZE_OPTIONS,
    setSort,
    refetch,
    setColumnOrder,
    columnOrder,
  } = useTableController({
    endpoint: endPoints.getInstallmentDetailsByPolicyId(Number(policyId)),
    customPathParam: `section=installmentDetails`,
    searchFieldName: "policyName",
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.installmentsEntity,
  });

  const handleAddInstallment = () => {
    setEditData(null);
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const handleEditInstallment = (data: Record<string, unknown>) => {
    setEditData(data);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditData(null);
    setIsEdit(false);
  };

  const handleSuccess = () => {
    refetch();
  };

  const handleDownload = async (fileUploadId: number) => {
    try {
      if (!fileUploadId) {
        dispatch(setToastMessage("Invalid file selection."));
        return;
      }

      const downloadUrl = `${uiLibEndpoint.fileUploadDownload}/${fileUploadId}/download`;
      const response = await apiRequest(downloadUrl, {
        method: "GET",
        responseType: "blob",
      });

      const blob = response.data as Blob;

      // Check if response is an error page
      if (blob.type.includes("text/html")) {
        const text = await blob.text();
        if (text.includes("<html")) {
          dispatch(
            setToastMessage("Download failed — server returned an error page.")
          );
          return;
        }
      }

      let filename = "installment-document";
      const contentDisposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      dispatch(setToastMessage("File downloaded successfully."));
    } catch (err) {
      console.error("Download error:", err);
      dispatch(setToastMessage("Download failed. Please try again."));
    }
  };

  const FileNameWrapper = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    color: theme.palette.primary.main,
    '&:hover': {
      textDecoration: 'underline',
    },
  }));

  const DownloadIcon = styled('img')({
    width: '16px',
    height: '16px',
    flexShrink: 0,
  });

  const FileNameRenderer = (params: any) => {
    const fileName = params.value;
    const sourceFile = params.data?.sourceFile;

    if (!fileName || !sourceFile?.id) {
      return <span>--</span>;
    }

    return (
      <FileNameWrapper onClick={() => handleDownload(sourceFile.id)}>
        <DownloadIcon
          title="Click to download file"
          src={downloadIcon}
          alt="download"
        />
        {fileName}
      </FileNameWrapper>
    );
  };

  // Create modified columns with FileNameRenderer for the fileName column
  const modifiedInstallmentColumns = useMemo(() => {
    return instalmentsColumns.map((col) => {
      if (col.field === "sourceFile.fileName") {
        return {
          ...col,
          cellRenderer: "FileNameRenderer",
        };
      }
      return col;
    });
  }, []);

  const handleCellClicked = (event: { colDef?: { field?: string }; value?: string; data?: Record<string, unknown> }) => {
    if (event.colDef?.field === 'edit') {
      // Handle edit action
      const action = event.value;
      if (action === 'edit') {
        handleEditInstallment(event.data as Record<string, unknown>);
      }
    }
  };

  return (
    <Box>
      <Table
        columns={modifiedInstallmentColumns}
        rowData={rowData}
        totalRows={totalRows}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={handleCellClicked}
        onPrimaryActionClick={handleAddInstallment}
        primaryActionLabel={"Add Installment"}
        setSort={setSort}
        title={"Installment Details"}
        enableSaveView={true}
        displaySettingsButton={true}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.installmentsEntity}
        selectedFilterValues={{}}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        components={{
          FileNameRenderer,
          ActionRenderer,
        }}
      />

      <InstallmentModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        policyId={Number(policyId)}
        editData={editData}
        isEdit={isEdit}
        premiumAndBrokerageDetails={premiumAndBrokerageDetails}
      />
    </Box>
  );
};

export default PolicyDetailsInstallmentsTab;
