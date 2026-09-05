import { useDispatch } from "react-redux";
import {
  ACKNOWLEDGE,
  GENERIC_ERROR,
  GO_TO_POLICY_DASHBOARD,
  UPLOAD_DATA,
} from "../../constants/index";
import useTableController from "@ui/ui-lib/hooks/useTableController";
import { getClosedEndorsementCols } from "./config";
import { endPoints, Table, useHasPermission, FeatureKey } from "@ui/ui-lib";
import { environment } from "@ui/ui-lib/environment";
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Container,
  StyledButton,
  StyledAckButton,
  FileName,
  ButtonsContainer,
} from "./styles";
import ChipRenderer from "@ui/ui-lib/commonComponents/Chip/index";
import { setToastMessage } from "@ui/ui-lib/redux/slice";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { endPoints as uiLibEndpoint } from "@ui/ui-lib/constants/endPoints";
import { useLocalization } from "@ui/ui-lib/hooks/useLocalization";
import Button from "@ui/ui-lib/commonComponents/Button";
import { CUSTOM_PAGE_SIZE } from "@ui/ui-lib/constants";
import CustomStepper from "../../common/CustomStepper";

interface Props {
  onClose?: () => void;
  onInsurerAcknowledge?: () => void;
}

// Renders only for cells with value "Pending Acknowledgement"
export const HoverCellRenderer = (
  props: any,
  onInsurerAcknowledge?: (data: any) => void
) => {
  const value = props.value;
  const styleMap = props.styleMap;
  const data = props.data;

  // Only render hover logic for "Pending Acknowledgement"
  if (value !== "Pending Acknowledgement" && value !== "Pending TPA Upload") {
    return <ChipRenderer value={value} data={data} styleMap={styleMap} />;
  }
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {isHovered ? (
        <StyledAckButton
          variantType="secondary"
          onClick={() => onInsurerAcknowledge?.(data)}
        >
          {ACKNOWLEDGE}
        </StyledAckButton>
      ) : (
        <ChipRenderer value={value} data={data} styleMap={styleMap} />
      )}
    </div>
  );
};

const ClosedEndorsement: React.FC<Props> = ({
  onClose,
  onInsurerAcknowledge,
}) => {
  const { id: policyId } = useParams();
  const dispatch = useDispatch();
  const hasRbacPermission = useHasPermission(FeatureKey.EXPORT_ENDORSEMENTS);
  const isDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

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
    endpoint: endPoints.endorsementBatchData(Number(policyId)),
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
      dispatch(setToastMessage("Endorsement report downloaded successfully."));
    } catch (err) {
      dispatch(setToastMessage("Download failed. Try again."));
    }
  };

  const FileRenderer = (params: any) => {
    const { data } = params;
    const endorsementFile = data?.endorsementFileDetails;

    return (
      <div>
        <FileName
          onClick={isDownloadAllowed ? () => handleDownload(endorsementFile?.endorsementFileId) : undefined}
        >
          {endorsementFile?.endorsementFileName}
        </FileName>
      </div>
    );
  };

  const { localizationData } = useLocalization();
  const getClosedEndorsementColumnss = useMemo(() => {
    return getClosedEndorsementCols(
      hoveredRowIndex ?? -1,
      onInsurerAcknowledge,
      localizationData?.data
    );
  }, [onInsurerAcknowledge, localizationData]);

  return (
    <Container>
      <Table
        columns={getClosedEndorsementColumnss}
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
        components={{ ChipRenderer, FileRenderer: FileRenderer, CustomStepper }}
        title={""}
        height={550}
      />
      <ButtonsContainer>
        <Button variantType="secondary" onClick={onClose}>
          {UPLOAD_DATA.CANCEL}
        </Button>
        <Button variantType="primary" onClick={onClose}>
          {GO_TO_POLICY_DASHBOARD}
        </Button>
      </ButtonsContainer>
    </Container>
  );
};

export default ClosedEndorsement;
