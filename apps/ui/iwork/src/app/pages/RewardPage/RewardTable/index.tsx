import {
    CardBackground,
    FeatureKey,
    SEARCH,
    SmartSearch,
    KPICards,
    Table,
    Button,
    CustomModal,
    selectHasPermission,
    useTableController,
    useApiMutation,
    httpMethods,
    setToastMessage,
    SUCCESS_MESSAGE,
    ERROR_MESSAGE,
    endPoints,
    apiRequest,
    updateUserDefaultConfig,
    buildColumnSettingsPayload,
} from "@ui/ui-lib";
import { Box, Typography } from "@mui/material";
import {
    DeleteOutlineRounded as DeleteIcon,
    EditOutlined as EditIcon,
} from "@mui/icons-material";
import { ColDef } from "ag-grid-community";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LIST_OF_RECORDS, TABLE_CONTROLLER_ENTITY_KEY } from "../../../constants";
import { RewardTableStyledContainer, RewardActionsContainer } from "./styles";
import {
    getColumns,
    getTableSearchConfig,
    rewardKpiData,
    searchDefaultValues,
    RewardOverallData,
} from "./tableConfig";
import { getFYDateRange } from "../constants";

// Build the direct query-param string the backend expects (BR contract):
// rewardCategoryLid, insurerId, periodType, from, to.
const buildRewardQueryParam = (values: Record<string, any>): string => {
    const parts: string[] = [];
    const add = (key: string, raw: any) => {
        const val =
            raw && typeof raw === "object" && "value" in raw ? raw.value : raw;
        if (val !== undefined && val !== null && val !== "") {
            parts.push(`${key}=${encodeURIComponent(String(val))}`);
        }
    };
    add("rewardCategoryLid", values.rewardCategoryLid);
    add("insurerId", values.insurerId);
    add("periodType", values.periodType);
    add("from", values.from);
    add("to", values.to);
    return parts.join("&");
};

const RewardListing: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [formMethods, setFormMethods] =
        useState<ReturnType<typeof useForm>>();

    const userSavedFilters = useSelector(
        (state: any) =>
            state.user.userDefaultConfig?.smartSearchValues?.[
                TABLE_CONTROLLER_ENTITY_KEY.rewardEntity
            ]
    );
    const systemSavedFilters = useSelector(
        (state: any) =>
            state.user.systemDefaultConfig?.smartSearchValues?.[
                TABLE_CONTROLLER_ENTITY_KEY.rewardEntity
            ]
    );
    const savedDefaultValues =
        userSavedFilters ?? systemSavedFilters ?? searchDefaultValues;

    const [appliedFilters, setAppliedFilters] =
        useState<Record<string, any>>(savedDefaultValues);
    const [pendingDelete, setPendingDelete] = useState<any | null>(null);
    const [docsModal, setDocsModal] = useState<any[] | null>(null);

    const canCreate = useSelector((state: any) =>
        selectHasPermission(FeatureKey.CREATE_REWARD)(state)
    );
    const canEdit = useSelector((state: any) =>
        selectHasPermission(FeatureKey.EDIT_REWARD)(state)
    );
    const canDelete = useSelector((state: any) =>
        selectHasPermission(FeatureKey.DELETE_REWARD)(state)
    );
    const canExport = useSelector((state: any) =>
        selectHasPermission(FeatureKey.EXPORT_REWARD)(state)
    );

    const customPathParam = useMemo(
        () => buildRewardQueryParam(appliedFilters),
        [appliedFilters]
    );

    const {
        rowData,
        totalRows,
        currentPage,
        loading,
        setCurrentPage,
        pageSize,
        setPageSize,
        PAGE_SIZE_OPTIONS,
        overallData,
        setSort,
        setColumnOrder,
        columnOrder,
        refetch,
    } = useTableController({
        endpoint: endPoints.allRewards,
        entityKey: TABLE_CONTROLLER_ENTITY_KEY.rewardEntity,
        customPathParam,
    });

    useEffect(() => {
        if (formMethods) {
            formMethods.reset(savedDefaultValues);
        }
    }, [formMethods]);

    // When financialYear changes, auto-fill from/to with the FY date range.
    // Clearing the FY clears from/to so the user can enter custom dates.
    useEffect(() => {
        if (!formMethods) return;
        const subscription = formMethods.watch((values, { name }) => {
            if (name !== "financialYear") return;
            const fy = (values as any).financialYear;
            const fyYear = fy && typeof fy === "object" ? fy.value : fy;
            if (fyYear) {
                const { from, to } = getFYDateRange(Number(fyYear));
                formMethods.setValue("from", from);
                formMethods.setValue("to", to);
            } else {
                formMethods.setValue("from", "");
                formMethods.setValue("to", "");
            }
        });
        return () => subscription.unsubscribe();
    }, [formMethods]);

    const handleReset = () => {
        if (formMethods) {
            formMethods.reset(searchDefaultValues);
        }
        setAppliedFilters(searchDefaultValues);
        // Clear the saved view in Redux + backend so navigation doesn't restore it
        dispatch(
            updateUserDefaultConfig({
                entityKey: TABLE_CONTROLLER_ENTITY_KEY.rewardEntity,
                selectedFilterValues: searchDefaultValues,
                columns: buildColumnSettingsPayload(columnOrder),
            })
        );
    };

    const handleRunFilters = () => {
        setAppliedFilters(formMethods?.getValues() ?? searchDefaultValues);
    };

    const { mutate: deleteReward, isLoading: isDeleting } = useApiMutation({
        config: {
            onSuccess: (response: any) => {
                dispatch(setToastMessage(response?.message ?? SUCCESS_MESSAGE));
                setPendingDelete(null);
                refetch?.();
            },
            onError: (error: any) => {
                dispatch(setToastMessage(error?.message ?? ERROR_MESSAGE));
            },
        },
    });

    const fileNameFromKey = (key?: string) => {
        if (!key) return "Document";
        const base = key.split("/").pop() || key;
        return base.replace(/^\d+_/, "");
    };

    const downloadDoc = async (fileId: number, name: string) => {
        try {
            const res = await apiRequest(
                endPoints.fileUploadDownloadById(fileId),
                { method: httpMethods.GET, responseType: "blob" }
            );
            const url = URL.createObjectURL(res.data as Blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = name || `reward-doc-${fileId}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            dispatch(setToastMessage("Could not download document."));
        }
    };

    const handleConfirmDelete = () => {
        if (!pendingDelete?.id) return;
        deleteReward({
            endpoint: endPoints.rewardById(Number(pendingDelete.id)),
            method: httpMethods.DELETE,
            data: undefined,
        });
    };

    const docLinkSx = {
        cursor: "pointer",
        color: "primary.main",
        textDecoration: "underline",
        fontSize: 13,
    } as const;

    const columns = useMemo<ColDef[]>(() => {
        const baseColumns = getColumns().map((col) => {
            if (col.field !== "docMaps") return col;
            return {
                ...col,
                cellRenderer: (params: any) => {
                    const docs = Array.isArray(params.data?.docMaps)
                        ? params.data.docMaps
                        : [];
                    if (!docs.length) return "--";
                    if (docs.length > 1) {
                        return (
                            <Box onClick={() => setDocsModal(docs)} sx={docLinkSx}>
                                {docs.length} file(s)
                            </Box>
                        );
                    }
                    const first = docs[0];
                    const fileId = first?.documentId ?? first?.document?.id;
                    const name = fileNameFromKey(first?.document?.fileKey);
                    return (
                        <Box onClick={() => downloadDoc(fileId, name)} sx={docLinkSx}>
                            1 file(s)
                        </Box>
                    );
                },
            };
        });

        if (!canEdit && !canDelete) return baseColumns;

        const actionCol: ColDef = {
            field: "__actions__",
            headerName: "Actions",
            sortable: false,
            flex: 1,
            headerClass: "ag-center-header",
            tooltipValueGetter: () => "Actions",
            cellRenderer: (params: any) => {
                const row = params.data;
                if (!row?.id) return null;
                return (
                    <RewardActionsContainer>
                        {canEdit && (
                            <EditIcon
                                titleAccess="Edit"
                                onClick={() =>
                                    navigate(`/insurer-rewards/${row.id}/edit`)
                                }
                                sx={{
                                    cursor: "pointer",
                                    fontSize: 22,
                                    color: "primary.main",
                                    "&:hover": { color: "primary.dark" },
                                }}
                            />
                        )}
                        {canDelete && (
                            <DeleteIcon
                                titleAccess="Delete"
                                onClick={() => setPendingDelete(row)}
                                sx={{
                                    cursor: "pointer",
                                    fontSize: 22,
                                    color: "error.main",
                                    "&:hover": { color: "error.dark" },
                                }}
                            />
                        )}
                    </RewardActionsContainer>
                );
            },
        };
        return [...baseColumns, actionCol];
    }, [canEdit, canDelete, navigate]);

    const handleDownloadReport = async () => {
        dispatch(
            setToastMessage({
                message:
                    "Rewards export started, keep the tab open until it gets downloaded..",
                duration: 10000,
            })
        );
        try {
            const queryParam = buildRewardQueryParam(appliedFilters);
            const url = `${endPoints.rewardExport}${queryParam ? `?${queryParam}` : ""}`;
            const response = await apiRequest(url, { method: "GET" });
            if (response.status === 200 && response?.data) {
                const link = document.createElement("a");
                link.href = response.data;
                link.download = "rewards_export.xlsx";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                dispatch(setToastMessage("Rewards report downloaded successfully."));
            } else {
                dispatch(setToastMessage("Download failed. Invalid response."));
            }
        } catch {
            dispatch(setToastMessage("Download failed. Try again."));
        }
    };

    const kpis = rewardKpiData(overallData as RewardOverallData);
    const tableSearchConfig = getTableSearchConfig();

    return (
        <RewardTableStyledContainer>
            <CardBackground>
                <SmartSearch
                    searchFormConfig={tableSearchConfig}
                    searchDefaultValues={searchDefaultValues}
                    searchFormMethods={setFormMethods}
                    selectedValues={appliedFilters as any}
                    searchFieldName="insurerName"
                    hideSearch
                    placeholder={SEARCH}
                    formMethods={formMethods}
                    onReset={handleReset}
                    enableManualSearch={false}
                    enableSmartSearch={true}
                    onRunFilters={handleRunFilters}
                />
            </CardBackground>
            <KPICards data={kpis} />

            <Table
                columns={columns}
                rowData={rowData}
                totalRows={totalRows}
                currentPage={currentPage}
                loading={loading}
                setCurrentPage={setCurrentPage}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                setPageSize={setPageSize}
                primaryActionLabel={canCreate ? "Add New Reward" : undefined}
                onPrimaryActionClick={
                    canCreate
                        ? () => navigate("/insurer-rewards/new")
                        : undefined
                }
                secondaryActionLabel={canExport ? "Generate Report" : undefined}
                onSecondaryActionClick={canExport ? handleDownloadReport : undefined}
                setSort={setSort}
                title={LIST_OF_RECORDS}
                setColumnOrder={setColumnOrder}
                columnOrder={columnOrder}
                entityKey={TABLE_CONTROLLER_ENTITY_KEY.rewardEntity}
                selectedFilterValues={appliedFilters}
            />

            <CustomModal
                open={!!docsModal}
                handleClose={() => setDocsModal(null)}
                heading="Documents"
            >
                <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {(docsModal ?? []).map((dm: any) => {
                        const fileId = dm?.documentId ?? dm?.document?.id;
                        const name = fileNameFromKey(dm?.document?.fileKey);
                        return (
                            <Box
                                key={fileId}
                                onClick={() => downloadDoc(fileId, name)}
                                sx={docLinkSx}
                            >
                                {name}
                            </Box>
                        );
                    })}
                </Box>
            </CustomModal>

            <CustomModal
                open={!!pendingDelete}
                handleClose={() => setPendingDelete(null)}
                heading="Delete reward"
            >
                <Box sx={{ p: 1 }}>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                        Are you sure you want to delete this reward? This action
                        cannot be undone.
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
                            onClick={() => setPendingDelete(null)}
                            disabled={isDeleting}
                        />
                        <Button
                            variantType="primary"
                            label="Delete"
                            onClick={handleConfirmDelete}
                            loading={isDeleting}
                        />
                    </Box>
                </Box>
            </CustomModal>
        </RewardTableStyledContainer>
    );
};

export default RewardListing;
