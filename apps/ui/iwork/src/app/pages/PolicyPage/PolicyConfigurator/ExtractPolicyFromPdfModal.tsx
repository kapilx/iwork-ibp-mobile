import React, { useRef, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { CustomModal, endPoints } from "@ui/ui-lib";
import {
  POLICY_CONFIGURATOR_MODALS,
} from "../../../constants";
import { PolicyConfiguration } from "./policytypes";

type ExtractionStatus = "SUCCESS" | "PARTIAL" | "FAILED";

interface ExtractionApiResult {
  policyConfiguration: PolicyConfiguration["configuration"];
  extractionStatus: ExtractionStatus;
  warnings: string[];
  message?: string;
}

type Phase = "pick" | "loading" | "result";

interface ExtractPolicyFromPdfModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (extractedConfig: PolicyConfiguration["configuration"]) => void;
  policyId?: string | number;
}

const ExtractPolicyFromPdfModal: React.FC<ExtractPolicyFromPdfModalProps> = ({
  open,
  onClose,
  onConfirm,
  policyId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("pick");
  const [result, setResult] = useState<ExtractionApiResult | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setFileError(null);
    setPhase("pick");
    setResult(null);
    setNetworkError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.type !== "application/pdf" && !selected.name.endsWith(".pdf")) {
      setFile(null);
      setFileError(POLICY_CONFIGURATOR_MODALS.EXTRACT_PDF_FILE_TYPE_ERROR);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(selected);
  };

  const handleExtract = async () => {
    if (!file) return;
    setPhase("loading");
    setNetworkError(null);
    const token = sessionStorage.getItem("user")
        ? JSON.parse(sessionStorage.getItem("user") as string)?.accessToken
            ?.accessToken
        : null;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const url = policyId
        ? `${endPoints.extractPolicyConfiguration}?policyId=${policyId}`
        : endPoints.extractPolicyConfiguration;
      const response = await axios.post(url, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }        
      });
      const apiData: ExtractionApiResult = response.data?.data;
      setResult(apiData);
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        POLICY_CONFIGURATOR_MODALS.EXTRACT_PDF_FAILED_DEFAULT;
      setNetworkError(message);
    } finally {
      setPhase("result");
    }
  };

  const handleLoad = () => {
    if (result?.policyConfiguration) {
      onConfirm(result.policyConfiguration);
      handleClose();
    }
    resetState();
  };

  const isLoadDisabled =
    !result ||
    result.extractionStatus === "FAILED" ||
    !!networkError;

  const buttons =
    phase === "pick"
      ? [
          {
            label: POLICY_CONFIGURATOR_MODALS.EXTRACT_PDF_BUTTON_EXTRACT,
            onClick: handleExtract,
            variant: "primary" as const,
            disabled: !file || !!fileError,
          },
          {
            label: POLICY_CONFIGURATOR_MODALS.EXTRACT_PDF_BUTTON_CANCEL,
            onClick: handleClose,
            variant: "secondary" as const,
          },
        ]
      : phase === "loading"
      ? []
      : [
          {
            label: POLICY_CONFIGURATOR_MODALS.EXTRACT_PDF_BUTTON_LOAD,
            onClick: handleLoad,
            variant: "primary" as const,
            disabled: isLoadDisabled,
          },
          {
            label: POLICY_CONFIGURATOR_MODALS.EXTRACT_PDF_BUTTON_CANCEL,
            onClick: handleClose,
            variant: "secondary" as const,
          },
        ];

  return (
    <CustomModal
      open={open}
      handleClose={handleClose}
      heading={POLICY_CONFIGURATOR_MODALS.EXTRACT_PDF_HEADING}
      buttons={buttons}
      modalBoxStyles={{ minWidth: 480, maxWidth: 600 }}
    >
      {phase === "pick" && (
        <Stack spacing={2}>
          <Typography variant="body2" sx = {{color: "text.grey"}} >
            {POLICY_CONFIGURATOR_MODALS.EXTRACT_PDF_SELECT_LABEL}
          </Typography>

          <Box
            component="label"
            htmlFor="extract-pdf-input"
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              border: "2px dashed",
              borderColor: fileError ? "error.main" : "divider",
              borderRadius: 2,
              p: 3,
              cursor: "pointer",
              "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
              transition: "border-color 0.2s, background-color 0.2s",
            }}
          >
            <UploadFileOutlinedIcon sx={{ 
                fontSize: 40,
                color: "text.grey"
              }} />
            <Typography variant="body2" sx = {{color: "text.grey"}}>
              {file ? file.name : "Click to browse or drag and drop a PDF"}
            </Typography>
            {file && (
              <Chip
                label={`${(file.size / 1024).toFixed(1)} KB`}
                size="small"
                sx = {{color: "text.grey"}}
                variant="outlined"
              />
            )}
            <input
              id="extract-pdf-input"
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              hidden
              onChange={handleFileChange}
            />
          </Box>

          {fileError && (
            <Alert severity="error" sx={{ py: 0 }}>
              {fileError}
            </Alert>
          )}
        </Stack>
      )}

      {phase === "loading" && (
        <Stack spacing={2} alignItems="center" sx={{ py: 3 }}>
          <CircularProgress size={48} />
          <Typography variant="body1" align="center">
            {POLICY_CONFIGURATOR_MODALS.EXTRACT_PDF_LOADING}
          </Typography>
        </Stack>
      )}

      {phase === "result" && (
        <Stack spacing={2}>
          {networkError && (
            <Alert severity="error">{networkError}</Alert>
          )}

          {result && result.extractionStatus === "SUCCESS" && (
            <Alert severity="success">
              {POLICY_CONFIGURATOR_MODALS.EXTRACT_PDF_SUCCESS}
            </Alert>
          )}

          {result && result.extractionStatus === "PARTIAL" && (
            <Alert severity="warning">
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Partial extraction — the following stages need manual completion:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {result.warnings.map((w, i) => (
                  <Typography key={i} component="li" variant="body2">
                    {w}
                  </Typography>
                ))}
              </Box>
            </Alert>
          )}

          {result && result.extractionStatus === "FAILED" && (
            <Alert severity="error">
              {result.message || POLICY_CONFIGURATOR_MODALS.EXTRACT_PDF_FAILED_DEFAULT}
            </Alert>
          )}
        </Stack>
      )}
    </CustomModal>
  );
};

export default ExtractPolicyFromPdfModal;
