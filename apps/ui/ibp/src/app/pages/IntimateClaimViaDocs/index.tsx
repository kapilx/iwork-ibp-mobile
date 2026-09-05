import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import {
  ArrowBackIosNew,
  ArrowForward,
  CheckCircleOutline,
  ErrorOutline,
  ExpandLess,
  ExpandMore,
  RateReview,
  UploadFile,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { apiRequest, endPoints, formatAmountWithCurrency, useLocalization } from "@ui/ui-lib";
import { ExtractionDataReviewStep } from "./ExtractionDataReviewStep";

interface DtoFields {
  diagnosis: string | null;
  estimatedClaimAmount: number | null;
  dateOfAdmission: string | null;
  proposedDischargeDate: string | null;
  claimType: string | null;
  hospitalName: string | null;
  hospitalLocation: string | null;
  placeOfAccident: string | null;
  patientName: string | null;
  patientRelation: string | null;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ExtractionResult {
  approach: "gpt-vision" | "textract-gpt";
  dtoFields: DtoFields;
  validation: { isValid: boolean; errors: ValidationError[] };
  fullData: Record<string, unknown>;
}

const DTO_FIELD_LABELS: Record<keyof DtoFields, string> = {
  diagnosis: "Diagnosis",
  estimatedClaimAmount: "Estimated Claim Amount",
  dateOfAdmission: "Date of Admission",
  proposedDischargeDate: "Proposed Discharge Date",
  claimType: "Claim Type",
  hospitalName: "Hospital Name",
  hospitalLocation: "Hospital Location",
  placeOfAccident: "Place of Accident",
  patientName: "Patient Name",
  patientRelation: "Patient Relation",
};

function DtoFieldsPanel({ fields, accentColor }: { fields: DtoFields | undefined; accentColor?: string }) {
  const { localizationData } = useLocalization();
  if (!fields) return null;
  return (
    <Box>
      {(Object.keys(DTO_FIELD_LABELS) as (keyof DtoFields)[]).map((key) => {
        const val = fields[key];
        const displayVal =
          val === null || val === undefined ? (
            <Typography variant="body2" component="span" sx={{ color: "#999" }}>
              —
            </Typography>
          ) : (
            <Typography variant="body2" fontWeight={600} component="span" sx={{ color: "#111" }}>
              {key === "estimatedClaimAmount" && typeof val === "number"
                ? `${formatAmountWithCurrency(val, localizationData?.data)}`
                : String(val)}
            </Typography>
          );

        return (
          <Box
            key={key}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 0.75,
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <Typography
              variant="body2"
              sx={{ minWidth: 160, color: accentColor ?? "#555", fontWeight: 500 }}
            >
              {DTO_FIELD_LABELS[key]}
            </Typography>
            {displayVal}
          </Box>
        );
      })}
    </Box>
  );
}

function ResultCard({
  title,
  color,
  loading,
  error,
  result,
}: {
  title: string;
  color: string;
  loading: boolean;
  error: string | null;
  result: ExtractionResult | null;
}) {
  const [jsonOpen, setJsonOpen] = useState(false);

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        height: "100%",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          backgroundColor: color,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} color="white">
          {title}
        </Typography>
        {result && result.validation && (
          <Chip
            size="small"
            icon={
              result.validation.isValid ? (
                <CheckCircleOutline sx={{ fontSize: 14, color: "white !important" }} />
              ) : (
                <ErrorOutline sx={{ fontSize: 14, color: "white !important" }} />
              )
            }
            label={result.validation.isValid ? "Valid" : "Has Errors"}
            sx={{
              ml: "auto",
              backgroundColor: result.validation.isValid
                ? "rgba(255,255,255,0.25)"
                : "rgba(255,80,80,0.4)",
              color: "white",
              fontWeight: 600,
              fontSize: 11,
            }}
          />
        )}
      </Box>

      <Box sx={{ p: 2, minHeight: 200 }}>
        {loading && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4, gap: 2 }}>
            <CircularProgress size={32} sx={{ color }} />
            <Typography variant="body2" color="text.secondary">
              Extracting…
            </Typography>
          </Box>
        )}

        {!loading && error && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, py: 2 }}>
            <ErrorOutline color="error" fontSize="small" sx={{ mt: 0.2 }} />
            <Typography variant="body2" color="error.main">
              {error}
            </Typography>
          </Box>
        )}

        {!loading && !error && !result && (
          <Typography variant="body2" color="text.disabled" sx={{ py: 2, textAlign: "center" }}>
            Upload a claim form and click Extract
          </Typography>
        )}

        {!loading && !error && result && (
          <>
            <DtoFieldsPanel fields={result.dtoFields} accentColor={color} />

            {(result.validation?.errors ?? []).length > 0 && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  backgroundColor: "error.lighter",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "error.light",
                }}
              >
                <Typography variant="caption" fontWeight={700} color="error.main">
                  Validation Errors
                </Typography>
                {(result.validation?.errors ?? []).map((e, i) => (
                  <Typography key={i} variant="caption" color="error.dark" display="block">
                    • {e.field}: {e.message}
                  </Typography>
                ))}
              </Box>
            )}

            <Divider sx={{ my: 1.5 }} />

            <Box
              sx={{ display: "flex", alignItems: "center", cursor: "pointer", userSelect: "none" }}
              onClick={() => setJsonOpen((o) => !o)}
            >
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                Full Extracted JSON
              </Typography>
              <IconButton size="small" sx={{ ml: "auto" }}>
                {jsonOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            </Box>

            <Collapse in={jsonOpen}>
              <Box
                component="pre"
                sx={{
                  backgroundColor: "#f5f5f5",
                  borderRadius: 1,
                  p: 1.5,
                  fontSize: 11,
                  overflowX: "auto",
                  maxHeight: 400,
                  overflowY: "auto",
                  mt: 0.5,
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {JSON.stringify(result.fullData, null, 2)}
              </Box>
            </Collapse>
          </>
        )}
      </Box>
    </Paper>
  );
}

const  IntimateClaimViaDocs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = (location.state ?? null) as {
    returnToStep?: 1;
    ocrData?: Record<string, unknown>;
    ocrFullData?: Record<string, unknown>;
    ocrOriginalData?: Record<string, unknown>;
    ocrFileName?: string;
  } | null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [gptError, setGptError] = useState<string | null>(null);
  const [gptResult, setGptResult] = useState<ExtractionResult | null>(null);
 
  const [textractLoading, setTextractLoading] = useState(false);
  const [textractError, setTextractError] = useState<string | null>(null);
  const [textractResult, setTextractResult] = useState<ExtractionResult | null>(() => {
    if (returnState?.returnToStep === 1 && returnState.ocrFullData) {
      return {
        approach: "textract-gpt" as const,
        dtoFields: (returnState.ocrData as unknown as DtoFields) ?? null,
        validation: { isValid: true, errors: [] },
        fullData: returnState.ocrFullData,
      };
    }
    return null;
  });

  // Review step state
  const [activeStep, setActiveStep] = useState<0 | 1>(
    returnState?.returnToStep === 1 ? 1 : 0
  );
  const [correctedFullData, setCorrectedFullData] = useState<Record<string, unknown> | null>(
    returnState?.returnToStep === 1 ? (returnState.ocrFullData ?? null) : null
  );

  // Preserves the raw AI extraction across back/forward navigation; never mutated by user edits
  const [originalAiData, setOriginalAiData] = useState<Record<string, unknown> | null>(
    returnState?.returnToStep === 1 ? (returnState.ocrOriginalData ?? null) : null
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setGptResult(null);
    setTextractResult(null);
    setGptError(null);
    setTextractError(null);
    setActiveStep(0);
    setCorrectedFullData(null);
  };

  const getToken = () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      return user?.accessToken?.accessToken as string | undefined;
    } catch {
      return undefined;
    }
  };

  const callEndpoint = async (
    endpoint: string,
    file: File,
  ): Promise<ExtractionResult> => {
    const fd = new FormData();
    fd.append("file", file);
    const token = getToken();
    const res = await apiRequest(endpoint, {
      method: "POST",
      data: fd,
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res?.success) throw new Error(res?.error || "Extraction failed");
    // The API gateway sometimes double-wraps: { success, data: { success, data: ExtractionResult } }
    const payload = res.data?.dtoFields ? res.data : (res.data?.data ?? res.data);
    return payload as ExtractionResult;
  };

  const handleExtract = async () => {
    if (!selectedFile) return;

    // setGptLoading(true);
    setTextractLoading(true);
    // setGptError(null);
    setTextractError(null);
    // setGptResult(null);
    setTextractResult(null);

    // Azure DI call commented out — using Textract only
    // const [gptRes, textractRes] = await Promise.allSettled([
    //   callEndpoint(endPoints.claimFormExtractGpt, selectedFile),
    //   callEndpoint(endPoints.claimFormExtractTextract, selectedFile),
    // ]);

    // if (gptRes.status === "fulfilled") {
    //   setGptResult(gptRes.value);
    // } else {
    //   setGptError(gptRes.reason?.message || "GPT extraction failed");
    // }
    // setGptLoading(false);

    const textractRes = await callEndpoint(endPoints.claimFormExtractTextract, selectedFile)
      .then((v) => ({ status: "fulfilled" as const, value: v }))
      .catch((e) => ({ status: "rejected" as const, reason: e }));

    if (textractRes.status === "fulfilled") {
      setTextractResult(textractRes.value);
      setOriginalAiData(textractRes.value?.fullData ?? null);
    } else {
      setTextractError(textractRes.reason?.message || "Textract extraction failed");
    }
    setTextractLoading(false);
  };

  const isExtracting = textractLoading; // gptLoading ||

  // ── Step 0: Upload & Extract ─────────────────────────────────────────────────
  const uploadStepContent = (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%", backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Banner */}
      <Box
        sx={{
          width: "100%",
          background: "linear-gradient(135deg, #093F84 0%, #1A6BB5 100%)",
          pt: 20,
          pb: 5,
          px: { xs: 2.5, md: 6 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <IconButton sx={{ p: 0, mr: 1.5, color: "white" }} onClick={() => navigate(-1)}>
            <ArrowBackIosNew fontSize="small" />
          </IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ color: "white" }}>
            Intimate Claim via Document
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", pl: 4.5 }}>
          Upload a Member Claim Form PDF to extract claim details
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ width: "93%", maxWidth: 1920, margin: "0 auto", px: { xs: 1.5, md: 6 }, py: 5, boxSizing: "border-box" }}>

      {/* Upload Area */}
      <Paper
        elevation={0}
        sx={{
          border: "1.5px dashed",
          borderColor: selectedFile ? "#215daa" : "#c8d6e8",
          borderRadius: 2,
          p: 3,
          mb: 2,
          minHeight: 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color 0.2s",
          "&:hover": { borderColor: "#215daa" },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          hidden
          onChange={handleFileChange}
        />
        <UploadFile sx={{ fontSize: 36, color: selectedFile ? "#215daa" : "#b0bec5", mb: 0.5 }} />
        {selectedFile ? (
          <>
            <Typography variant="body2" fontWeight={600} sx={{ color: "#215daa" }}>
              {selectedFile.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {(selectedFile.size / 1024).toFixed(1)} KB · Click to change
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              Click to upload a claim form PDF
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Supported format: PDF
            </Typography>
          </>
        )}
      </Paper>

      {/* Action */}
      <Box sx={{ mb: 3, display: "flex", gap: 1.5 }}>
        <Button
          variant="contained"
          disabled={!selectedFile || isExtracting}
          onClick={handleExtract}
          startIcon={isExtracting ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{
            minWidth: 130,
            maxWidth: 180,
            backgroundColor: "#215daa",
            // "&:hover": { backgroundColor: "#1a4a8a" },
          }}
        >
          {isExtracting ? "Extracting…" : "Extract"}
        </Button>
        {selectedFile && (
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              setSelectedFile(null);
              setGptResult(null);
              setTextractResult(null);
              setGptError(null);
              setTextractError(null);
              setActiveStep(0);
              setCorrectedFullData(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            sx={{ minWidth: 90, maxWidth: 120 }}
          >
            Clear
          </Button>
        )}
      </Box>

      {/* Results */}
      <Grid container spacing={2}>
        {/* Azure DI card commented out — Textract only */}
        {/* <Grid item xs={12} md={6}>
          <ResultCard
            title="Azure DI OCR → GPT"
            color="#1565c0"
            loading={gptLoading}
            error={gptError}
            result={gptResult}
          />
        </Grid> */}
        <Grid item xs={12}>
          <ResultCard
            title="Claim Form Extraction (AWS Textract → GPT)"
            color="#215daa"
            loading={textractLoading}
            error={textractError}
            result={textractResult}
          />
        </Grid>
      </Grid>

      {/* Step 1 CTA — review extracted data */}
      {textractResult && !textractLoading && (
        <Box
          sx={{
            mt: 3,
            p: 2.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "#215daa",
            backgroundColor: "#eef4fb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#215daa" }}>
              Extraction complete
            </Typography>
            <Typography variant="body2">
              Review and correct the{" "}
              <strong>
                {Object.keys(textractResult.fullData ?? {}).length > 0 ? "120+" : "extracted"}
              </strong>{" "}
              extracted fields before proceeding to claim intimation.
            </Typography>
          </Box>
          <Button
            variant="contained"
            endIcon={<RateReview />}
            onClick={() => {
              setCorrectedFullData(
                JSON.parse(JSON.stringify(textractResult.fullData ?? {}))
              );
              setActiveStep(1);
            }}
            sx={{
              whiteSpace: "nowrap",
              flexShrink: 0,
              backgroundColor: "#215daa",
              "&:hover": { backgroundColor: "#1a4a8a" },
            }}
          >
            Review Extracted Data
          </Button>
        </Box>
      )}
      </Box>
    </Box>
  );

  // ── Step 1: Review & correct extracted data ─────────────────────────────────
  const reviewStepContent = (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%", backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Banner */}
      <Box
        sx={{
          width: "100%",
          background: "linear-gradient(135deg, #093F84 0%, #1A6BB5 100%)",
          pt: 20,
          pb: 5,
          px: { xs: 2.5, md: 6 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <IconButton sx={{ p: 0, mr: 1.5, color: "white" }} onClick={() => setActiveStep(0)}>
            <ArrowBackIosNew fontSize="small" />
          </IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ color: "white" }}>
            Review Extracted Claim Data
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", pl: 4.5, mb: 3 }}>
          {selectedFile?.name ?? "Uploaded document"} · Verify all fields and correct any errors before proceeding
        </Typography>

        {/* Step indicators */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 4.5 }}>
          <Chip
            label="1. Upload & Extract"
            size="small"
            sx={{ backgroundColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}
          />
          <ArrowForward sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }} />
          <Chip
            label="2. Review & Correct"
            size="small"
            sx={{ backgroundColor: "white", color: "#093F84", fontWeight: 700 }}
          />
          <ArrowForward sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }} />
          <Chip
            label="3. Claim Intimation"
            size="small"
            sx={{
              backgroundColor: "transparent",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.35)",
            }}
          />
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ width: "93%", maxWidth: 1920, margin: "0 auto", px: { xs: 1.5, md: 6 }, py: 4, boxSizing: "border-box" }}>
        {/* Review form */}
        {textractResult && (
          <ExtractionDataReviewStep
            fullData={(textractResult.fullData ?? {}) as Record<string, unknown>}
            onCorrectedDataChange={(data) => setCorrectedFullData(data)}
          />
        )}

        {/* Proceed CTA — sticky */}
        <Box
          sx={{
            mt: 3,
            p: 2.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "#215daa",
            backgroundColor: "#eef4fb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
            position: "sticky",
            bottom: 16,
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#215daa" }}>
              Ready to submit?
            </Typography>
            <Typography variant="body2">
              Your corrections will be pre-filled into the claim intimation form.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, flexShrink: 0 }}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(0)}
              sx={{ color: "#215daa", borderColor: "#215daa" }}
            >
              ← Back
            </Button>
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={() =>
                navigate("/claims-intimation", {
                  state: {
                    ocrData: textractResult?.dtoFields,
                    ocrFullData: correctedFullData ?? textractResult?.fullData ?? {},
                    ocrOriginalData: originalAiData ?? textractResult?.fullData ?? {},
                    ocrFileName: selectedFile?.name ?? returnState?.ocrFileName ?? "",
                  },
                })
              }
              sx={{
                backgroundColor: "#215daa",
                "&:hover": { backgroundColor: "#1a4a8a" },
              }}
            >
              Proceed to Claim Intimation
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return activeStep === 1 ? reviewStepContent : uploadStepContent;
}
export default IntimateClaimViaDocs;