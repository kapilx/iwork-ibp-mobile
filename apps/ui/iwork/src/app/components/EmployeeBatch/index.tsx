import { useDispatch } from "react-redux";
import {
  EMPLOYEE_DATA_MESSAGE,
  GENERIC_ERROR,
  GO_TO_POLICY_DASHBOARD,
  UPLOAD_DATA,
} from "../../constants/index";
import useTableController from "@ui/ui-lib/hooks/useTableController";
import { employeeBatches } from "./config";
import { endPoints, Table } from "@ui/ui-lib";
import { useParams } from "react-router-dom";
import ChipRenderer from "@ui/ui-lib/commonComponents/Chip";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { endPoints as uiLibEndpoint } from "@ui/ui-lib/constants/endPoints";
import Button from "@ui/ui-lib/commonComponents/Button/index";
import { ButtonContainer, Container, EnployeeBatchStyledCard } from "./styles";
import TextRenderer from "../../common/TextRenderer";
import { setToastMessage } from "@ui/ui-lib/redux/slice";
import { CUSTOM_PAGE_SIZE } from "@ui/ui-lib/constants";
import { useEffect } from "react";

interface Props {
  onClose?: () => void;
}

const EmployeeBatch: React.FC<Props> = ({ onClose }) => {
  const { id: policyId } = useParams();
  const dispatch = useDispatch();
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
  } = useTableController({
    endpoint: endPoints.employeeBatchData(Number(policyId)),
    searchFieldName: "policyName",
    defaultPageSize: CUSTOM_PAGE_SIZE,
  });

  const handleDownload = async (errorFileUploadId: number) => {
    try {
      if (!errorFileUploadId) {
        dispatch(setToastMessage("Invalid selection."));
        return;
      }

      const downloadUrl = `${uiLibEndpoint.fileUploadDownload}/${errorFileUploadId}/download`;
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

      let filename = "error-report.xlsx"; // Default filename
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
      dispatch(setToastMessage("Error report downloaded successfully."));
    } catch (err) {
      console.error("Download error:", err);
      dispatch(setToastMessage("Download failed. Try again."));
    }
  };
  const ActionButtonRenderer = (params: any) => {
    const errorFileId = params.data?.errorFile?.id;
    if (!errorFileId) {
      return <span></span>;
    }
    return <ActionButton onClick={() => handleDownload(errorFileId)} />;
  };

  return (
    <>
      <Container>
        <EnployeeBatchStyledCard>
          <Table
            columns={employeeBatches}
            rowData={rowData}
            totalRows={totalRows}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            setPageSize={setPageSize}
            onCellClicked={() => {}}
            onPrimaryActionClick={() => {}}
            setSort={setSort}
            title={""}
            components={{
              ChipRenderer,
              ActionButton: ActionButtonRenderer,
              TextRenderer,
            }}
            height={550}
          />
        </EnployeeBatchStyledCard>
        <ButtonContainer>
          <Button variantType="secondary" onClick={onClose}>
            {UPLOAD_DATA.CANCEL}
          </Button>
          <Button onClick={onClose}>{GO_TO_POLICY_DASHBOARD}</Button>
        </ButtonContainer>
      </Container>
    </>
  );
};

export default EmployeeBatch;
