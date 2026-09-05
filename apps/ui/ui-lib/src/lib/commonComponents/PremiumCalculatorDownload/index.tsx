import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import DownloadIcon from "../../assets/svgs/download-icon.svg";
import { endPoints } from "@ui/ui-lib/constants";
import { apiRequest } from "@ui/ui-lib/utils";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setToastMessage } from "@ui/ui-lib/redux";
import { DownLoadIconHolder } from "../EndorsementDocument/styles";
import { environment } from "@ui/ui-lib/environment";

const PremiumCalculatorDownload: React.FC<any> = ({}) => {
  const { policyId, endorsementId } = useParams<{
    policyId?: string;
    endorsementId?: string;
  }>();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const isPremiumCalculatorEnabled = environment.featureFlag.FF_PREMIUM_CALCULATOR;

  useEffect(() => {
    if (!isPremiumCalculatorEnabled) return;

    const fetchPremiumCalculation = async () => {
      if (!policyId || !endorsementId) {
        dispatch(setToastMessage("Policy ID or Endorsement ID not found."));
        return;
      }
      setIsLoading(true);
      try {
        const result = await apiRequest(
          endPoints.premiumCalculationDownload(
            Number(policyId),
            Number(endorsementId),
          ),
          { method: "GET" },
        );
        setResponse(result.data);
      } catch(err: any) {
        const message = err.message ?? "Failed to fetch premium calculation. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPremiumCalculation();
  }, []);

  const handlePremiumCalculatorDownload = () => {
    if (!response) return;
    const { fileName, mimeType, buffer } = response;
    const uint8Array = new Uint8Array(buffer.data);
    const blob = new Blob([uint8Array], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName ?? "premium-calculations.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <Typography variant="body1">
        {isLoading
          ? "Premium calculations for enrolled employees are being prepared. Please wait..."
          : error
            ? error
            : "Click the download icon to view the premium calculations for enrolled employees."}
      </Typography>
      {isLoading ? (
        <CircularProgress size={20} />
      ) : (
        <DownLoadIconHolder
          src={DownloadIcon}
          alt="Download Icon"
          onClick={handlePremiumCalculatorDownload}
          enableDownloadIcon={!!response}
        />
      )}
    </Box>
  );
};

export default PremiumCalculatorDownload;
