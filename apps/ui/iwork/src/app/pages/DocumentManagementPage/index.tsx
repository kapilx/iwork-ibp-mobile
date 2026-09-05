import { useState, useMemo, useCallback, useRef } from "react";
import { Box, Typography, List, ListItem, ListItemText, Drawer, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
    CardBackground,
    SmartSearch,
    SEARCH,
    useFormWatcher,
    Table,
    useApiQuery,
    endPoints,
    Button,
    CustomModal,
    BULK_DOWNLOAD,
    BULK_DOWNLOAD_MESSAGES,
    CONFIRM_DOWNLOAD,
    LIST_OF_DOCUMENTS,
    FeatureKey,
    selectHasPermission,
    setToastMessage,
    environment,
} from "@ui/ui-lib";
import { FormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";
import { CellClickedEvent } from "ag-grid-community";
import { useDispatch, useSelector } from "react-redux";
import { axiosInstance } from "@ui/ui-lib/utils";
import { getDocumentColumns, FileKeyRenderer, DocumentRecord } from "./tableConfig";

// Custom utility function for company hierarchy endpoint
const companyHierarchyUtility = (data: any) => {
    return data?.data?.data?.map((company: any) => ({
        value: company.companyId || company.id,
        label: company.displayName || company.companyName,
    })) || [];
};

const SIDEBAR_EXPANDED_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 60;
const DOCUMENT_MANAGEMENT_MODULE_KEY = "document_management";

const PageContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    height: "100%",
    overflow: "hidden",
}));

const StyledDrawer = styled(Drawer, {
    shouldForwardProp: (prop) => prop !== "open",
})<{ open: boolean }>(({ theme, open }) => ({
    width: open ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
    flexShrink: 0,
    transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    "& .MuiDrawer-paper": {
        width: open ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
        boxSizing: "border-box",
        position: "relative",
        height: "100%",
        borderRight: `1px solid ${theme.palette.divider}`,
        padding: theme.spacing(2),
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
        overflowX: "hidden",
    },
}));

const ToggleButton = styled(IconButton)(({ theme }) => ({
    position: "absolute",
    top: theme.spacing(1),
    right: theme.spacing(1),
    zIndex: 1,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    "&:hover": {
        backgroundColor: theme.palette.action.hover,
    },
}));

const SidebarListItem = styled(ListItem, {
    shouldForwardProp: (prop) => prop !== "isSelected" && prop !== "isExpanded",
})<{ isSelected?: boolean; isExpanded?: boolean }>(({ theme, isSelected, isExpanded }) => ({
    cursor: "pointer",
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1.5, 2),
    backgroundColor: isSelected ? theme.palette.action.selected : "transparent",
    justifyContent: isExpanded ? "flex-start" : "center",
    "&:hover": {
        backgroundColor: isSelected
            ? theme.palette.action.selected
            : theme.palette.action.hover,
    },
    "& .MuiListItemText-primary": {
        fontSize: "14px",
        fontWeight: isSelected ? 600 : 400,
        color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
}));

const ContentArea = styled(Box)(({ theme }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    overflow: "auto",
}));

const PageTitle = styled(Typography)(({ theme }) => ({
    fontSize: "24px",
    fontWeight: 600,
    marginBottom: theme.spacing(3),
    color: theme.palette.text.primary,
}));

const ContentContainer = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(3),
    boxShadow: theme.shadows[1],
}));

// Smart Search Configurations for TPA
const tpaSearchConfig: FormFieldConfig[] = [
    {
        key: "tpaName",
        name: "tpaName",
        label: "TPA Name",
        type: "text",
        gridColumn: 2.9,
        componentProps: { 
            fullWidth: true, 
            placeholder: "Enter TPA name" 
        },
        placeholder: "Search",
    },
    {
        key: "city",
        name: "city",
        label: "City",
        type: "text",
        gridColumn: 2.9,
        componentProps: { 
            fullWidth: true, 
            placeholder: "Enter city" 
        },
        placeholder: "Search",
    },
];

const insurerSearchConfig: FormFieldConfig[] = [
    {
        key: "insurerName",
        name: "insurerName",
        label: "Insurer Name",
        type: "text",
        gridColumn: 2.9,
        componentProps: { 
            fullWidth: true, 
            placeholder: "Enter insurer name" 
        },
        placeholder: "Search",
    },
    {
        key: "city",
        name: "city",
        label: "City",
        type: "text",
        gridColumn: 2.9,
        componentProps: { 
            fullWidth: true, 
            placeholder: "Enter city" 
        },
        placeholder: "Search",
    },
];

const brokerSearchConfig: FormFieldConfig[] = [
    {
        key: "brokerName",
        name: "brokerName",
        label: "Broker Name",
        type: "text",
        gridColumn: 2.9,
        componentProps: { 
            fullWidth: true, 
            placeholder: "Enter broker name" 
        },
        placeholder: "Search",
    },
    {
        key: "city",
        name: "city",
        label: "City",
        type: "text",
        gridColumn: 2.9,
        componentProps: { 
            fullWidth: true, 
            placeholder: "Enter city" 
        },
        placeholder: "Search",
    },
];

// Default values for each menu item
const companySearchDefaultValues = {
    searchTerm: "",
    organization: "",
    companyName: "",
    companyType: "",
    entityType: "",
    policyType: "",
};

const tpaSearchDefaultValues = {
    searchTerm: "",
    tpaName: "",
    city: "",
};

const insurerSearchDefaultValues = {
    searchTerm: "",
    insurerName: "",
    city: "",
};

const brokerSearchDefaultValues = {
    searchTerm: "",
    brokerName: "",
    city: "",
};

const menuItems = [
    { id: "company", label: "Companies" },
    // { id: "tpa", label: "TPA" },
    // { id: "insurer", label: "Insurer" },
    // { id: "broker", label: "Brokers" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const DocumentManagementPage = () => {
    const dispatch = useDispatch();
    const isBulkDownloadAllowed = useSelector((state: any) =>
        selectHasPermission(FeatureKey.BULK_DOWNLOAD_ENABLE)(state)
    );
    const [selectedMenuItem, setSelectedMenuItem] = useState<string>("company");
    const [isExpanded, setIsExpanded] = useState<boolean>(true);
    const [formMethods, setFormMethods] = useState<any>();
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [appliedFilters, setAppliedFilters] = useState<any>({}); // State for applied filters
    
    // Table state management
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sort, setSort] = useState<{ colId: string; sort: "asc" | "desc" }[]>([]);
    const [bulkDownloadModalOpen, setBulkDownloadModalOpen] = useState<boolean>(false);
    const [selectedDocumentIds, setSelectedDocumentIds] = useState<
        Array<string | number>
    >([]);
    const [selectedDocumentCount, setSelectedDocumentCount] = useState(0);
    const [bulkDownloadLoading, setBulkDownloadLoading] = useState<boolean>(false);
    const tableSelectionApiRef = useRef<{ clearSelection: () => void } | null>(null);

    // Build query parameters from applied filters
    const buildQueryParams = () => {
        const params: Record<string, any> = {
            page: currentPage,
            limit: pageSize,
        };

        // Helper to extract value from object or return primitive value
        const extractValue = (value: any) => {
            if (!value) return null;
            if (typeof value === 'object' && value.value !== undefined) {
                return value.value;
            }
            return value;
        };

        // Map form field names to API parameter names
        const organizationValue = extractValue(appliedFilters.organization);
        if (organizationValue) {
            params.organisationId = organizationValue;
        }

        const companyNameValue = extractValue(appliedFilters.companyName);
        if (companyNameValue) {
            params.companyId = companyNameValue;
        }

        const companyTypeValue = extractValue(appliedFilters.companyType);
        if (companyTypeValue) {
            params.companyTypeLid = companyTypeValue;
        }

        const entityTypeValue = extractValue(appliedFilters.entityType);
        if (entityTypeValue) {
            params.entityType = entityTypeValue;
        }

        if (appliedFilters.from) {
            params.from = appliedFilters.from;
        }

        if (appliedFilters.to) {
            params.to = appliedFilters.to;
        }

        // Build query string - only include defined values
        const queryString = Object.entries(params)
            .filter(([_, value]) => value !== null && value !== undefined)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
        
        return queryString;
    };

    const queryString = buildQueryParams();

    // Fetch file details from API
    const { data: fileDetailsData, isLoading: fileDetailsLoading, error: fileDetailsError } = useApiQuery({
        url: `${endPoints.fileDetails}?${queryString}`,
        queryKey: ["FILE_DETAILS", currentPage, pageSize, appliedFilters],
        enabled: true,
    });

    // Debug logging
    console.log('=== FILE DETAILS DEBUG ===');
    console.log('Endpoint URL:', endPoints.fileDetails);
    console.log('Full URL:', `${endPoints.fileDetails}?page=${currentPage}&limit=${pageSize}`);
    console.log('API Response:', fileDetailsData);
    console.log('Loading:', fileDetailsLoading);
    console.log('Error:', fileDetailsError);
    console.log('User from sessionStorage:', JSON.parse(sessionStorage.getItem('user') || '{}'));
    console.log('========================');

    // Fetch company type options from API
    const { data: companyTypeData } = useApiQuery({
        url: endPoints.lookUpByName("COMPANY_TYPE"),
        queryKey: ["COMPANY_TYPE"],
    });

    // Fetch policy type options from API
    const { data: policyTypeData } = useApiQuery({
        url: endPoints.lookUpByName("POLICY_TYPE"),
        queryKey: ["POLICY_TYPE"],
    });

    // Fetch organization options from API
    const { data: organizationData } = useApiQuery({
        url: endPoints.masterOrganisation,
        queryKey: ["MASTER_ORGANISATION"],
    });

    // Transform API data to options format
    const companyTypeOptions = useMemo(() => {
        if (!companyTypeData?.data) return [];
        return companyTypeData.data.map((item: any) => ({
            label: item.lookUpValue,
            value: item.id,
        }));
    }, [companyTypeData]);

    const policyTypeOptions = useMemo(() => {
        if (!policyTypeData?.data) return [];
        return policyTypeData.data.map((item: any) => ({
            label: item.lookUpValue,
            value: item.id,
        }));
    }, [policyTypeData]);

    const organizationOptions = useMemo(() => {
        return organizationData?.data?.data?.map((item: any) => ({
            label: item.name,
            value: item.id,
        })) || [];
    }, [organizationData]);

    // Smart Search Configuration for Company
    const companySearchConfig: FormFieldConfig[] = useMemo(() => [
        {
            key: "organization",
            name: "organization",
            label: "Organization",
            type: "select",
            gridColumn: 2.9,
            componentProps: { 
                fullWidth: true, 
                placeholder: "Select organization" 
            },
            options: organizationOptions,
            placeholder: "Search",
        },
        {
            key: "companyName",
            name: "companyName",
            label: "Company Name",
            type: "selectFieldByApi",
            gridColumn: 2.9,
            enableSearch: true,
            componentProps: { 
                fullWidth: true,
                searchOnlyMode: true,
            },
            apiDependencies: {
                endPoint: endPoints.companyHierarchy,
                utilityFunction: companyHierarchyUtility,
            },
            placeholder: "Type to search companies...",
        },
        {
            key: "companyType",
            name: "companyType",
            label: "Company Type",
            type: "select",
            gridColumn: 2.9,
            componentProps: { 
                fullWidth: true, 
                placeholder: "Select company type" 
            },
            options: companyTypeOptions,
            placeholder: "Search",
        },
        {
            key: "entityType",
            name: "entityType",
            label: "Entity Type",
            type: "select",
            gridColumn: 2.9,
            componentProps: { 
                fullWidth: true, 
                placeholder: "Select entity type" 
            },
            options: [
                { label: "Opportunity", value: "opportunity" },
                { label: "Policy", value: "policy" },
                { label: "Claim", value: "claim" },
                { label: "Endorsement", value: "endorsement" },
            ],
            placeholder: "Search",
        },
        // {
        //     key: "policyType",
        //     name: "policyType",
        //     label: "Policy Type",
        //     type: "select",
        //     gridColumn: 2.9,
        //     componentProps: { 
        //         fullWidth: true, 
        //         placeholder: "Select policy type" 
        //     },
        //     options: policyTypeOptions,
        //     placeholder: "Search",
        // },
    ], [companyTypeOptions, policyTypeOptions, organizationOptions]);

    // Process API data
    const rowData: DocumentRecord[] = useMemo(() => {
        console.log('File Details API Response:', fileDetailsData);
        console.log('Extracted data:', fileDetailsData?.data);
        return fileDetailsData?.data || [];
    }, [fileDetailsData]);

    const totalRows = fileDetailsData?.count || 0;
    
    console.log('Row Data:', rowData);
    console.log('Total Rows:', totalRows);
    console.log('Is Loading:', fileDetailsLoading);

    // Get appropriate search config based on selected menu item
    const currentSearchConfig = useMemo(() => {
        switch (selectedMenuItem) {
            case "company":
                return companySearchConfig;
            case "tpa":
                return tpaSearchConfig;
            case "insurer":
                return insurerSearchConfig;
            case "broker":
                return brokerSearchConfig;
            default:
                return companySearchConfig;
        }
    }, [selectedMenuItem, companySearchConfig]);

    const currentSearchDefaultValues = useMemo(() => {
        switch (selectedMenuItem) {
            case "company":
                return companySearchDefaultValues;
            case "tpa":
                return tpaSearchDefaultValues;
            case "insurer":
                return insurerSearchDefaultValues;
            case "broker":
                return brokerSearchDefaultValues;
            default:
                return companySearchDefaultValues;
        }
    }, [selectedMenuItem]);

    const currentSearchFieldName = useMemo(() => {
        switch (selectedMenuItem) {
            case "company":
                return "companyName";
            case "tpa":
                return "tpaName";
            case "insurer":
                return "insurerName";
            case "broker":
                return "brokerName";
            default:
                return "companyName";
        }
    }, [selectedMenuItem]);

    // Use the useFormWatcher hook to track selected filter values
    const { selectedValues, handleReset } = useFormWatcher({
        formMethods: formMethods,
        setSearchTerm,
        searchFieldName: currentSearchFieldName,
        searchDefaultValues: currentSearchDefaultValues,
    });

    const handleMenuItemClick = (itemId: string) => {
        setSelectedMenuItem(itemId);
        // Reset form when switching menu items
        if (formMethods) {
            formMethods.reset();
        }
        console.log(`Selected: ${itemId}`);
        // Add your logic here for each menu item
    };

    const handleRun = () => {
        console.log("Run filters clicked", selectedValues);
        // Reset to first page when filters are applied
        setCurrentPage(1);
        // Apply filters to trigger API refetch
        setAppliedFilters(selectedValues);
    };

    const handleToggleSidebar = () => {
        setIsExpanded(!isExpanded);
    };

    const handleCellClicked = (event: CellClickedEvent) => {
        console.log("Cell clicked:", event);
        // Add your cell click logic here
    };

    const entityDownloadConfig = useCallback((entityType?: string) => {
        const normalized = entityType?.toLowerCase();
        switch (normalized) {
            case "policy":
                return { prefix: "policy" };
            case "opportunity":
                return { prefix: "opportunity" };
            case "claim":
                return { prefix: "claim" };
            case "endorsement":
                return { prefix: "endorsement" };
            case "company":
                return { prefix: "company" };
            default:
                return { prefix: "documents" };
        }
    }, []);

    const getDownloadModuleKey = useCallback(
        () => DOCUMENT_MANAGEMENT_MODULE_KEY,
        [],
    );

    const getBulkDownloadPayload = useCallback(() => {
        if (selectedDocumentIds.length === 0 || rowData.length === 0) {
            return {
                documentIds: selectedDocumentIds,
                moduleKey: DOCUMENT_MANAGEMENT_MODULE_KEY,
                fileNamePrefix: "documents",
            };
        }

        const selectedRecord = rowData.find(
            (record) => String(record.id) === String(selectedDocumentIds[0]),
        );

        const config = entityDownloadConfig(selectedRecord?.entityType);
        const prefixBase = config.prefix;
        const entityId = selectedRecord?.entityId;
        const fileNamePrefix =
            entityId !== undefined && entityId !== null
                ? `${prefixBase}_${entityId}`
                : `${prefixBase}_documents`;

        return {
            documentIds: selectedDocumentIds,
            moduleKey: DOCUMENT_MANAGEMENT_MODULE_KEY,
            fileNamePrefix,
        };
    }, [entityDownloadConfig, rowData, selectedDocumentIds]);

    const handleOpenBulkDownloadConfirm = useCallback(() => {
        if (!isBulkDownloadAllowed || selectedDocumentCount === 0) {
            return;
        }
        if (selectedDocumentIds.length === 0) {
            dispatch(setToastMessage(BULK_DOWNLOAD_MESSAGES.SELECT_AT_LEAST_ONE));
            return;
        }
        setBulkDownloadModalOpen(true);
    }, [dispatch, isBulkDownloadAllowed, selectedDocumentCount, selectedDocumentIds.length]);

    const handleCloseBulkDownloadModal = useCallback(() => {
        setBulkDownloadModalOpen(false);
    }, []);

    const confirmBulkDownload = useCallback(async (): Promise<void> => {
        handleCloseBulkDownloadModal();
        setBulkDownloadLoading(true);
        try {
            const { moduleKey, fileNamePrefix } = getBulkDownloadPayload();
            const response = await axiosInstance(endPoints.fileUploadBulkDownload, {
                method: "POST",
                data: {
                    documentIds: selectedDocumentIds,
                    moduleKey: moduleKey,
                },
                responseType: "blob",
            });

            const blob = response.data as Blob;

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
            const filename = `${fileNamePrefix}-${fallbackDate}.zip`;

            const downloadBlob = new Blob([blob], { type: contentType });
            const url = URL.createObjectURL(downloadBlob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

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
    }, [
        dispatch,
        getBulkDownloadPayload,
        handleCloseBulkDownloadModal,
        selectedDocumentCount,
        selectedDocumentIds,
    ]);

    const handleRowSelectionChange = useCallback(
        (selection: {
            selectedRowIds: Array<string | number>;
            isAllSelected: boolean;
            selectedCount: number;
            includedRowIds: Array<string | number>;
            excludedRowIds: Array<string | number>;
        }) => {
            setSelectedDocumentCount(selection.selectedCount);
            if (selection.selectedCount === 0) {
                setSelectedDocumentIds([]);
            } else {
                setSelectedDocumentIds(selection.selectedRowIds);
            }
        },
        [],
    );

    // Get document columns with dispatch
    const documentColumns = useMemo(() => getDocumentColumns(dispatch), [dispatch]);

    // Create a wrapper for FileKeyRenderer with dispatch
    const FileKeyRendererWithDispatch = useMemo(() => {
        return (params: any) => {
            return FileKeyRenderer({
                ...params,
                context: { dispatch, getDownloadModuleKey },
            });
        };
    }, [dispatch, getDownloadModuleKey]);

    return (
        <PageContainer>
            <StyledDrawer variant="permanent" anchor="left" open={isExpanded}>
                <ToggleButton onClick={handleToggleSidebar} size="small">
                    {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </ToggleButton>
                
                {isExpanded && (
                    <Typography variant="h6" sx={{ mb: 2, mt: 4, fontWeight: 600 }}>
                        Documents
                    </Typography>
                )}
                
                <List sx={{ mt: isExpanded ? 0 : 4 }}>
                    {menuItems.map((item) => (
                        <SidebarListItem
                            key={item.id}
                            isSelected={selectedMenuItem === item.id}
                            isExpanded={isExpanded}
                            onClick={() => handleMenuItemClick(item.id)}
                            title={!isExpanded ? item.label : undefined}
                        >
                            {isExpanded ? (
                                <ListItemText primary={item.label} />
                            ) : (
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {item.label.charAt(0)}
                                </Typography>
                            )}
                        </SidebarListItem>
                    ))}
                </List>
            </StyledDrawer>

            <ContentArea>
                <PageTitle>Document Management</PageTitle>
                <ContentContainer>
                    <CardBackground>
                        <SmartSearch
                            key={selectedMenuItem}
                            searchFormConfig={currentSearchConfig}
                            searchDefaultValues={currentSearchDefaultValues}
                            searchFormMethods={setFormMethods}
                            selectedValues={selectedValues}
                            searchFieldName={currentSearchFieldName}
                            placeholder={SEARCH}
                            formMethods={formMethods}
                            onReset={handleReset}
                            enableSmartSearch={true}
                            onRunFilters={handleRun}
                        />
                    </CardBackground>

                    <Box sx={{ mt: 3 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mb: 2,
                            }}
                        >
                            <Typography variant="h1">{LIST_OF_DOCUMENTS}</Typography>
                            {selectedDocumentCount > 0 &&
                                isBulkDownloadAllowed &&
                                selectedDocumentIds.length > 0 && (
                                <Button
                                    variantType="secondary"
                                    onClick={handleOpenBulkDownloadConfirm}
                                    disabled={bulkDownloadLoading}
                                    label={BULK_DOWNLOAD}
                                    loading={bulkDownloadLoading}
                                />
                            )}
                        </Box>
                        <Table
                            columns={documentColumns}
                            rowData={rowData}
                            totalRows={totalRows}
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            loading={fileDetailsLoading}
                            pageSize={pageSize}
                            pageSizeOptions={PAGE_SIZE_OPTIONS}
                            setPageSize={setPageSize}
                            onCellClicked={handleCellClicked}
                            onPrimaryActionClick={() => {}}
                            setSort={setSort}
                            components={{ FileKeyRenderer: FileKeyRendererWithDispatch }}
                            title=""
                            height={500}
                            enableRowSelection={isBulkDownloadAllowed}
                            rowSelectionIdKey="id"
                            onRowSelectionChange={handleRowSelectionChange}
                            selectionApiRef={tableSelectionApiRef}
                            rowSelectionLimit={
                                isBulkDownloadAllowed
                                    ? environment.bulkDownloadSelectionLimit
                                    : undefined
                            }
                            showSelectAllEntriesCta={false}
                        />
                    </Box>
                </ContentContainer>
            </ContentArea>
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
        </PageContainer>
    );
};

export default DocumentManagementPage;
