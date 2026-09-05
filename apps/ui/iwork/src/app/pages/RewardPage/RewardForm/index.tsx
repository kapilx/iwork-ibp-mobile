import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Box, Typography } from "@mui/material";
import {
    BUTTON_TYPE,
    BUTTON_VARIANTS,
    CANCEL,
    SUBMIT,
    UPDATE,
    SUCCESS_MESSAGE,
    ERROR_MESSAGE,
    VALIDATION_ERROR_MESSAGE,
    CommonBreadcrumb,
    DynamicForm,
    FormSection,
    FormActionsContainer,
    CustomModal,
    Button,
    apiRequest,
    useApi,
    useApiQuery,
    httpMethods,
    setToastMessage,
    endPoints,
    Table,
} from "@ui/ui-lib";
import dayjs from "dayjs";
import {
    StyledPageContainer,
    StyledCrumbContainer,
    StyledRewardFormContainer,
    StyledActionButton,
} from "./styles";
import {
    getRewardFormFields,
    rewardFormDefaultValues,
    rewardBreadcrumbs,
} from "./formConfig";
import { formatMonthLabel, getColumns } from "../RewardTable/tableConfig";
import { MONTH_LABEL_FORMAT, getCurrentFinancialYearStart } from "../constants";

// Prefix for the auto-generated Remarks ("Rewards for the month(s) of ...").
// Used to detect whether the current remark is still auto-generated (safe to
// overwrite) vs a custom one the user typed (preserve).
const REMARK_MONTHS_PREFIX = "Rewards for the month(s) of";

const RewardForm: React.FC = () => {
    const { id: rewardId } = useParams();
    const isEditMode = !!rewardId;
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [formMethods, setFormMethods] =
        useState<ReturnType<typeof useForm>>();
    const [selectedInsurerId, setSelectedInsurerId] = useState<
        number | null
    >(null);
    // Default to current FY on create so business-month options align with the
    // pre-selected financial year; edit prefill overrides this.
    const [selectedFY, setSelectedFY] = useState<number | undefined>(
        getCurrentFinancialYearStart()
    );
    const isResetting = useRef(false);
    const [loading, setLoading] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState<{
        message: string;
        payload: any;
    } | null>(null);
    const [docsModal, setDocsModal] = useState<any[] | null>(null);
    const [pdfPreview, setPdfPreview] = useState<{ url: string; name: string } | null>(null);

    const { doFetch: getReward, data: rewardResponse } = useApi();

    const formFields = useMemo(
        () => getRewardFormFields(isEditMode, selectedFY),
        [isEditMode, selectedFY]
    );

    // Prefill on edit.
    useEffect(() => {
        if (rewardId) {
            getReward(endPoints.rewardById(Number(rewardId)));
        }
    }, [rewardId]);

    useEffect(() => {
        if (!rewardResponse?.data || !formMethods) return;
        const r = rewardResponse.data;
        const insurerIdValue = r?.insurer?.id ?? r?.insurerId ?? null;
        const businessMonths = Array.isArray(r?.businessMonths)
            ? r.businessMonths
                  .map((bm: any) =>
                      bm?.businessMonth
                          ? dayjs(bm.businessMonth).format("YYYY-MM-01")
                          : null
                  )
                  .filter(Boolean)
            : [];
        const documents = Array.isArray(r?.docMaps)
            ? r.docMaps
                  .map((dm: any) => {
                      const fileKey = dm?.document?.fileKey ?? dm?.fileKey ?? "";
                      const fileName = fileKey
                          ? (fileKey.split("/").pop() || fileKey)
                          : (dm?.fileName ?? dm?.documentName ?? "");
                      return {
                          documentId:
                              dm?.fileUploadId ??
                              dm?.documentId ??
                              dm?.document?.id ??
                              dm?.id,
                          documentName: fileName,
                          fileName,
                      };
                  })
                  .filter((d: any) => d.documentId)
            : [];

        // Derive FY start year from the first business month.
        // Apr–Dec of year Y → FY Y; Jan–Mar of year Y → FY Y-1.
        const derivedFY = (() => {
            if (!businessMonths.length) return "";
            const first = businessMonths[0]; // "YYYY-MM-01"
            const y = parseInt(first.slice(0, 4));
            const m = parseInt(first.slice(5, 7));
            return String(m >= 4 ? y : y - 1);
        })();
        const fyStartYear = derivedFY ? Number(derivedFY) : undefined;

        // Set FY state directly so formFields recomputes before reset runs.
        setSelectedFY(fyStartYear);

        // Guard the watch so it doesn't clear businessMonths/insurer during reset.
        isResetting.current = true;
        formMethods.reset({
            rewardCategoryLid: r?.rewardCategory?.id ?? r?.rewardCategoryLid ?? "",
            insurerId: insurerIdValue ? String(insurerIdValue) : "",
            financialYear: derivedFY,
            businessMonths,
            dateOfIncome: r?.dateOfIncome
                ? dayjs(r.dateOfIncome).format("YYYY-MM-DD")
                : "",
            incomeMonthLabel: formatMonthLabel(r?.dateOfIncome),
            rewardAmount: r?.rewardAmount ?? "",
            remarks: r?.remarks ?? "",
            documents,
        });
        setTimeout(() => { isResetting.current = false; }, 0);
        if (insurerIdValue) setSelectedInsurerId(Number(insurerIdValue));
    }, [rewardResponse, formMethods]);

    // Derive read-only Income Month from Date of Income, track insurer,
    // and update business-month options when Financial Year changes.
    useEffect(() => {
        if (!formMethods) return;
        const subscription = formMethods.watch((values, { name }) => {
            if (name === "dateOfIncome") {
                const dateValue = (values as any).dateOfIncome;
                const label =
                    dateValue && dayjs(dateValue).isValid()
                        ? dayjs(dateValue).format(MONTH_LABEL_FORMAT)
                        : "";
                formMethods.setValue("incomeMonthLabel", label);
            }
            if (name === "insurerId") {
                const insurerValue = (values as any).insurerId;
                setSelectedInsurerId(
                    insurerValue ? Number(insurerValue) : null
                );
            }
            if (name === "financialYear") {
                // Skip during programmatic reset — FY and businessMonths are
                // already set correctly by the prefill effect.
                if (isResetting.current) return;
                const fy = (values as any).financialYear;
                const fyYear = fy && typeof fy === "object" ? fy.value : fy;
                const next = fyYear ? Number(fyYear) : undefined;
                setSelectedFY(next);
                // Clear stale month selections that belong to the previous FY.
                formMethods.setValue("businessMonths", []);
            }
            if (name === "businessMonths") {
                if (isResetting.current) return;
                // Auto-fill Remarks from the selected months so it appears on
                // selection; the user can then append/edit/clear it. We only
                // overwrite when Remarks is empty or still the generated text —
                // a custom remark (not starting with the prefix) is preserved.
                const months = ((values as any).businessMonths ?? []) as string[];
                const labels = months
                    .map((m) => formatMonthLabel(m))
                    .filter((l) => l !== "--");
                const autoRemark = labels.length
                    ? `${REMARK_MONTHS_PREFIX} ${labels.join(", ")}`
                    : "";
                const currentRemarks = ((values as any).remarks ?? "") as string;
                if (
                    currentRemarks === "" ||
                    currentRemarks.startsWith(REMARK_MONTHS_PREFIX)
                ) {
                    formMethods.setValue("remarks", autoRemark);
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [formMethods]);

    // Reward history for the selected insurer (BR-017).
    const {
        data: historyResponse,
        isLoading: historyLoading,
        isError: historyError,
    } = useApiQuery({
        url: selectedInsurerId
            ? endPoints.rewardsByInsurer(selectedInsurerId)
            : "",
        queryKey: ["rewardsByInsurer", selectedInsurerId],
        enabled: !!selectedInsurerId,
    });
    const historyRows: any[] = Array.isArray(historyResponse?.data?.data)
        ? historyResponse.data.data
        : Array.isArray(historyResponse?.data)
        ? historyResponse.data
        : [];

    const docLinkSx = {
        cursor: "pointer",
        color: "primary.main",
        textDecoration: "underline",
        fontSize: 13,
    } as const;

    // file_key = "uploads/company/REWARD/<timestamp>_<name>"
    // Display as "name - DD-MM-YYYY" so users can identify when it was uploaded.
    // Dashes, not slashes: this value is used as an actual browser download
    // filename (a.download below), and "/" would be read as a path separator.
    const fileNameFromKey = (key?: string, fallback?: string) => {
        if (key) {
            const base = key.split("/").pop() || "";
            if (base) {
                const match = base.match(/^(\d{10,})_(.+)$/);
                if (match && match[2]) {
                    const parsed = new Date(Number(match[1]));
                    if (isNaN(parsed.getTime())) return base;
                    const date = new Intl.DateTimeFormat("en-GB", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                    }).format(parsed)
                      .replace(/\//g, "-");
                    return `${match[2]} - ${date}`;
                }
                return base;
            }
        }
        return fallback || "Document";
    };

    const openOrDownloadDoc = async (fileId: number, name: string) => {
        try {
            const res = await apiRequest(
                endPoints.fileUploadDownloadById(fileId),
                { method: httpMethods.GET, responseType: "blob" }
            );
            const blob = res.data as Blob;
            const url = URL.createObjectURL(blob);
            const isPdf = blob.type === "application/pdf" || name.toLowerCase().includes(".pdf");
            if (isPdf) {
                setPdfPreview({ url, name });
            } else {
                const a = document.createElement("a");
                a.href = url;
                a.download = name || `reward-doc-${fileId}`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch {
            dispatch(setToastMessage("Could not open document."));
        }
    };

    // History columns: drop insurer/category/createdAt, make documents downloadable.
    const historyColumns = getColumns()
        .filter(
            (c) => !["insurer", "rewardCategory", "createdAt"].includes(c.field as string)
        )
        .map((c) =>
            c.field === "docMaps"
                ? {
                      ...c,
                      sortable: false,
                      cellRenderer: (params: any) => {
                          const docs = Array.isArray(params.data?.docMaps)
                              ? params.data.docMaps
                              : [];
                          if (!docs.length) return "--";
                          // More than one: show a count that opens the modal.
                          if (docs.length > 1) {
                              return (
                                  <Box
                                      onClick={() => setDocsModal(docs)}
                                      sx={docLinkSx}
                                  >
                                      {docs.length} file(s)
                                  </Box>
                              );
                          }
                          // Single: show count and open/download directly on click.
                          const first = docs[0];
                          const fileId =
                              first?.documentId ?? first?.document?.id;
                          const name = fileNameFromKey(
                              first?.document?.fileKey,
                              first?.documentName ?? first?.fileName ?? first?.document?.fileName
                          );
                          return (
                              <Box
                                  onClick={() => openOrDownloadDoc(fileId, name)}
                                  sx={docLinkSx}
                              >
                                  1 file(s)
                              </Box>
                          );
                      },
                  }
                : { ...c, sortable: false }
        );

    const submitReward = (payload: any) => {
        const endpoint = isEditMode
            ? endPoints.rewardById(Number(rewardId))
            : endPoints.allRewards;
        const method = isEditMode ? httpMethods.PUT : httpMethods.POST;

        apiRequest(endpoint, { method, data: payload })
            .then((response: any) => {
                dispatch(setToastMessage(response?.message ?? SUCCESS_MESSAGE));
                setLoading(false);
                setTimeout(() => navigate("/insurer-rewards"), 800);
            })
            .catch((error: any) => {
                setLoading(false);
                const status = error?.status ?? error?.response?.status;
                const body = error?.response?.data ?? error;
                // Soft duplicate (BR-018): confirm and re-submit.
                if (status === 409 && body?.data?.warning) {
                    setDuplicateWarning({
                        message:
                            body?.message ??
                            "A similar reward already exists. Do you want to continue?",
                        payload,
                    });
                    return;
                }
                // Hard block: show error inline.
                const message = Array.isArray(body?.message)
                    ? body.message[0]
                    : body?.message ?? error?.message ?? ERROR_MESSAGE;
                dispatch(setToastMessage(message));
            });
    };

    const handleSubmit = async () => {
        if (!formMethods) return;
        const isValid = await formMethods.trigger();
        if (!isValid) {
            dispatch(setToastMessage(VALIDATION_ERROR_MESSAGE));
            return;
        }
        setLoading(true);
        const values = formMethods.getValues();
        const documentIds = Array.isArray((values as any).documents)
            ? (values as any).documents
                  .map((d: any) => d?.documentId)
                  .filter((idVal: any) => idVal != null)
            : [];

        // Remarks are auto-filled reactively when business months are selected
        // (see the watch below) and then freely editable, so submit sends them
        // as-is.
        const payload = {
            rewardCategoryLid: (values as any).rewardCategoryLid || undefined,
            insurerId: Number((values as any).insurerId),
            dateOfIncome: (values as any).dateOfIncome,
            rewardAmount: Number((values as any).rewardAmount),
            businessMonths: (values as any).businessMonths ?? [],
            remarks: (values as any).remarks || undefined,
            documentIds,
        };
        submitReward(payload);
    };

    const handleConfirmDuplicate = () => {
        if (!duplicateWarning) return;
        const payload = { ...duplicateWarning.payload, confirmDuplicate: true };
        setDuplicateWarning(null);
        setLoading(true);
        submitReward(payload);
    };

    return (
        <StyledPageContainer>
            <StyledCrumbContainer>
                <CommonBreadcrumb crumbs={rewardBreadcrumbs(isEditMode)} />
            </StyledCrumbContainer>

            <StyledRewardFormContainer>
                <FormSection title="Reward details">
                    <DynamicForm
                        key="reward-form"
                        formConfig={formFields}
                        defaultValues={rewardFormDefaultValues}
                        formMethods={setFormMethods}
                    />
                </FormSection>

                <FormSection
                    title="Rewards (Existing rewards for the selected insurer)"
                    showHeader={true}
                >
                    <Table
                        columns={historyColumns}
                        rowData={historyRows}
                        totalRows={historyRows.length}
                        currentPage={1}
                        loading={historyLoading}
                        showLoader
                        setCurrentPage={() => {}}
                        pageSize={historyRows.length || 1}
                        pageSizeOptions={[historyRows.length || 1]}
                        setPageSize={() => {}}
                        onCellClicked={() => {}}
                        setSort={() => {}}
                    />
                </FormSection>
            </StyledRewardFormContainer>

            <CustomModal
                open={!!duplicateWarning}
                handleClose={() => setDuplicateWarning(null)}
                heading="Possible duplicate reward"
            >
                <Box sx={{ p: 1 }}>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                        {duplicateWarning?.message}
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            justifyContent: "flex-end",
                        }}
                    >
                        <Button
                            variantType="secondary"
                            label="Cancel"
                            onClick={() => setDuplicateWarning(null)}
                        />
                        <Button
                            variantType="primary"
                            label="Continue anyway"
                            onClick={handleConfirmDuplicate}
                        />
                    </Box>
                </Box>
            </CustomModal>

            <CustomModal
                open={!!pdfPreview}
                handleClose={() => {
                    if (pdfPreview) URL.revokeObjectURL(pdfPreview.url);
                    setPdfPreview(null);
                }}
                heading={pdfPreview?.name || "Preview"}
            >
                <Box sx={{ width: "100%", height: "75vh" }}>
                    <iframe
                        src={pdfPreview?.url}
                        title={pdfPreview?.name || "PDF Preview"}
                        width="100%"
                        height="100%"
                        style={{ border: "none" }}
                    />
                </Box>
            </CustomModal>

            <CustomModal
                open={!!docsModal}
                handleClose={() => setDocsModal(null)}
                heading="Documents"
            >
                <Box
                    sx={{
                        p: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                    }}
                >
                    {(docsModal ?? []).map((dm: any) => {
                        const fileId = dm?.documentId ?? dm?.document?.id;
                        const name = fileNameFromKey(
                            dm?.document?.fileKey,
                            dm?.documentName ?? dm?.fileName ?? dm?.document?.fileName
                        );
                        return (
                            <Box
                                key={fileId}
                                onClick={() => openOrDownloadDoc(fileId, name)}
                                sx={docLinkSx}
                            >
                                {name}
                            </Box>
                        );
                    })}
                </Box>
            </CustomModal>

            <FormActionsContainer>
                <StyledActionButton
                    type={BUTTON_TYPE.BUTTON}
                    variantType={BUTTON_VARIANTS.SECONDARY}
                    onClick={() => navigate("/insurer-rewards")}
                    label={CANCEL}
                />
                <StyledActionButton
                    type={BUTTON_TYPE.BUTTON}
                    variantType={BUTTON_VARIANTS.PRIMARY}
                    onClick={handleSubmit}
                    role="submit"
                    disabled={!formMethods}
                    loading={loading}
                >
                    {isEditMode ? UPDATE : SUBMIT}
                </StyledActionButton>
            </FormActionsContainer>
        </StyledPageContainer>
    );
};

export default RewardForm;
