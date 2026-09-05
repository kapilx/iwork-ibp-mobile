import {
  ButtonContainer,
  Container,
  LabelTypography,
  LinkTypography,
  LogoLabelContainer,
  MainContainer,
  Styledspan,
} from "./styles";
import CareerProfileIcon from "../../assets/svgs/career-profile.svg";
import ReviewIcon from "../../assets/svgs/review-icon.svg";
import DownLoadIcon from "../../assets/svgs/download-icon.svg";
import { CREATE_ENDORSEMENT, GO_BACK, UPLOAD_DATA } from "../../constants";
import { useDispatch } from "react-redux";
import { NumberFilterModel } from "ag-grid-community";
import { useParams } from "react-router-dom";
import {
  setToastMessage,
  endPoints,
  apiRequest,
  Button,
  formatNumberByLocalization,
} from "@ui/ui-lib";
import { useState, useEffect } from "react";

interface CreateEndorsementProps {
  employeeCount: number;
  onClose: () => void;
  insurerId: number;
  sendEndorsement?: () => void;
}

const CreateEndorsement: React.FC<CreateEndorsementProps> = ({
  employeeCount,
  onClose,
  insurerId,
  sendEndorsement,
}) => {
  const dispatch = useDispatch();
  const { id: policyId } = useParams<{ id: string }>();
  const [readyCount, setReadyCount] = useState<number>(employeeCount);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Update readyCount when employeeCount prop changes
  useEffect(() => {
    setReadyCount(employeeCount);
  }, [employeeCount]);

  const handleDownload = async (): Promise<void> => {
    if (!policyId) {
      dispatch(setToastMessage("Policy ID is required for download."));
      return;
    }

    setIsDownloading(true);

    try {
      // 1. Hit the dynamic URL
      const url = endPoints.endorsementDownload(policyId, insurerId);
      const response = await apiRequest(url, {
        method: "GET",
      });

      // 2. Check if file URL is returned
      if (response.status === 200 && response?.data) {
        const fileUrl = response.data; // should be a direct download link

        // 3. Trigger download
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `endorsement_${policyId}.pdf`; // or .xlsx based on type
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        dispatch(
          setToastMessage("Endorsement report downloaded successfully.")
        );

        // Update state to 0 after successful download
        setReadyCount(0);
      } else {
        const errorMessage = response?.message || "Download failed";
        dispatch(setToastMessage(`Download failed: ${errorMessage}`));
      }
    } catch (error: unknown) {
      const errorMessage = error ? error.message : "Unknown error occurred";
      dispatch(setToastMessage(`Download failed: ${errorMessage}`));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Container>
        <MainContainer>
          <LogoLabelContainer>
            <img src={CareerProfileIcon} alt="Career Profile Icon" />
            <LabelTypography>
              {"You have "}
              <Styledspan>
                {formatNumberByLocalization(readyCount)} employees
              </Styledspan>
              {CREATE_ENDORSEMENT.MAIN_MESSAGE}
            </LabelTypography>
          </LogoLabelContainer>
          <LabelTypography>{CREATE_ENDORSEMENT.SAVED_MESSAGE}</LabelTypography>
          <LogoLabelContainer disable={true}>
            <img src={ReviewIcon} alt="Review Icon" />
            <LinkTypography>
              {CREATE_ENDORSEMENT.REVIEW_ENDORSEMENT}
            </LinkTypography>
          </LogoLabelContainer>
          <LogoLabelContainer
            disable={readyCount === 0}
            onClick={readyCount > 0 ? handleDownload : undefined}
          >
            <img src={DownLoadIcon} alt="Download Icon" />
            <LinkTypography>
              {isDownloading
                ? "Downloading..."
                : CREATE_ENDORSEMENT.DOWNLOAD_FILE}
            </LinkTypography>
          </LogoLabelContainer>
        </MainContainer>
        <ButtonContainer>
          <Button
            variantType="secondary"
            data-testid="create-endorsement-cancel-button"
            loadingPosition="start"
            className="button"
            sizeType="small"
            onClick={onClose}
          >
            {UPLOAD_DATA.CANCEL}
          </Button>
          <Button
            variantType="primary"
            data-testid="create-endorsement-create-button"
            loadingPosition="center"
            className="button"
            sizeType="small"
            onClick={sendEndorsement}
          >
            {CREATE_ENDORSEMENT.SUBMIT_BUTTON}
          </Button>
        </ButtonContainer>
      </Container>
    </>
  );
};

export default CreateEndorsement;
