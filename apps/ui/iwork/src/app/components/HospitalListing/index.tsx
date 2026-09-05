import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  CommonBreadcrumb,
  Table,
  ChipRenderer,
  PAGE_SIZE_OPTIONS,
  endPoints,
  useApiMutation,
  HTTP_METHODS,
  KPICards,
  MOVE_TO_EXCLUSION,
  MOVE_TO_INCLUSION,
  DISCARD,
  INCLUSIONS,
  ALL_HOSPITALS,
  EXCLUSIONS,
  useApiQuery,
  Drawer,
  Button,
  colors,
  AppDispatch,
  setToastMessage,
  apiRequest,
  DynamicForm,
  formatNumberByLocalization,
  SummaryCard,
  cardSections,
  buildBreadcrumbState,
  getBreadcrumbsFromState,
  useHasPermission,
  FeatureKey,
} from "@ui/ui-lib";
import { environment } from "@ui/ui-lib/environment";
import { UseFormReturn } from "react-hook-form";
import {
  ButtonContainer,
  Buttons,
  Container,
  DownloadButton,
  ViewAuditButton,
  FilterChipsContainer,
  FilterChip,
  Cards,
  DrawerContentWrapper,
  DrawerScrollableContent,
  DrawerFooter,
  RecordCount,
  DrawerContent,
  DrawerTitle,
  DrawerSubTitle,
  FiltersContainer,
  FiltersContainerSearch,
  FiltersContainerHeading,
  StyledSearchField,
  FiltersContainerForm,
  ButtonText,
  SearchButton,
  ClearButton,
  ClearAllText,
} from "./styles";
import {
  CLOSE,
  DOWNLOAD_EXCEL,
  DOWNLOAD_FAILED_TRY_AGAIN,
  HOSPITAL_DRAWER,
  VIEW_AUDIT,
  HOSPITAL_EXPORT_TOAST_MESSAGES,
} from "../../constants";

import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { InputAdornment, Typography } from "@mui/material";
import {
  getColumns,
  HospitalData,
  getHospitalKPIData,
  hospitalBreadcrumbs,
  FILTER_CONSTANTS,
  HOSPITAL_FILTER_FORM_CONFIG,
  initialHospitalFilterValues,
  HospitalFilterValues,
  hasValue,
} from "./tableConfig";
import { IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowLeftRight from "../../assets/svgs/arrow-right-left.svg";
import DeleteIcon from "../../assets/svgs/delete.svg";
import HospitalCard from "../../common/HospitalCard";
import {
  policyBreadcrumbs,
  policyDetailsViewMoreItemsOpportunity,
} from "../../pages/CompanyPage/PolicyDetails/detailsConfig";
import { priorityStyleMap } from "../../pages/CompanyPage/PolicyDetails/styles";

// ActionsCell Component
interface ActionsCellProps {
  data: HospitalData;
  onMoveToInclusion: (id: string) => void;
  onMoveToExclusion: (id: string) => void;
  onDiscard: (id: string) => void;
}

const ActionsCell: React.FC<ActionsCellProps> = ({
  data,
  onMoveToInclusion,
  onMoveToExclusion,
  onDiscard,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };

  const handleMove = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleClose();

    if (data.status === "Included") {
      onMoveToExclusion(data.id);
    } else {
      onMoveToInclusion(data.id);
    }
  };

  const handleDiscardClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleClose();
    onDiscard(data.id);
  };

  return (
    <>
      <IconButton
        aria-label="more"
        aria-controls={open ? "actions-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        size="small"
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "actions-button",
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleMove} sx={{ gap: 2, color: "#424242" }}>
          <img
            src={ArrowLeftRight}
            alt="move"
            style={{ width: "16px", height: "16px" }}
          />
          {data.status === "Included" ? MOVE_TO_EXCLUSION : MOVE_TO_INCLUSION}
        </MenuItem>
        <MenuItem
          onClick={handleDiscardClick}
          sx={{ gap: 2, color: colors.text.darkGray }}
        >
          <img
            src={DeleteIcon}
            alt="delete"
            style={{ width: "16px", height: "16px" }}
          />
          {DISCARD}
        </MenuItem>
      </Menu>
    </>
  );
};

const HospitalListing: React.FC = () => {
  const { id: policyId } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const hasRbacPermission = useHasPermission(FeatureKey.EXPORT_HOSPITAL_LISTING);
  const isDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;

  const policyDetailsData = state?.policyDetailsData;
  const { data: policyDetailsFromApi } = useApiQuery({
    url: endPoints.getBasicDetailsByPolicyId(Number(policyId)),
    queryKey: ["policyDetailsData", policyId],
    enabled: !!policyId && !policyDetailsData,
  });
  const policyDetails = policyDetailsData ?? policyDetailsFromApi;
  const existingBreadcrumbs = getBreadcrumbsFromState(state);
  const breadcrumbsForNavigation =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : hospitalBreadcrumbs(policyId);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter state
  type FilterType = "all" | "included" | "excluded";
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter state
  const [formMethods, setFormMethods] =
    useState<UseFormReturn<HospitalFilterValues>>();
  const [fullSearchTerm, setFullSearchTerm] = useState(""); // API search parameters
  const [isApplyDisabled, setIsApplyDisabled] = useState(true);
  const [advancedSearchTerm, setAdvancedSearchTerm] = useState("");

  // Sort state
  const [sort, setSort] = useState<{ colId: string; sort: "asc" | "desc" }[]>(
    []
  );
  const [stringifySort, setStringifySort] = useState<string>("");

  // Fetch audit history data from API
  const {
    data: auditHistoryApiData,
    isLoading: auditHistoryLoading,
    error: auditHistoryError,
  } = useApiQuery({
    url: endPoints.auditHistoryByPolicyId(Number(policyId)),
    queryKey: ["auditHistory", policyId],
    enabled: !!policyId && isDrawerOpen,
  });

  // Transform API data to match HospitalCard props
  const auditHistoryData = useMemo(() => {
    if (!auditHistoryApiData) return [];

    let dataArray = [];

    if (Array.isArray(auditHistoryApiData)) {
      dataArray = auditHistoryApiData;
    } else if (
      auditHistoryApiData?.data?.data &&
      Array.isArray(auditHistoryApiData.data.data)
    ) {
      dataArray = auditHistoryApiData.data.data;
    } else if (Array.isArray(auditHistoryApiData?.data)) {
      dataArray = auditHistoryApiData.data;
    }

    const transformed = dataArray.map((item: any) => {
      return {
        fileName: item.fileName || "Unknown File",
        uploadedBy: item.uploadedBy || "Unknown User",
        uploadedAt: item.uploadedAt || "Unknown Date",
        inclusionCount: item.inclusionCount || 0,
        exclusionCount: item.exclusionCount || 0,
        total: item.totalRecords || 0,
        fileId: item.fileId,
        errorFileId: item?.errorFileId,
        errorCount: item?.errorCount || 0,
        successCount: item?.successCount || 0,
      };
    });

    return transformed;
  }, [auditHistoryApiData]);

  // File download handler
  const handleFileDownload = async (
    fileId: number,
    fileName: string,
    errorFileId?: number,
    isError?: boolean
  ) => {
    try {
      if (!fileId) {
        dispatch(setToastMessage("Invalid file selection."));
        return;
      }

      const downloadUrl = endPoints.fileUploadDownloadById(
        isError ? errorFileId : fileId
      );
      const response = await apiRequest(downloadUrl, {
        method: "GET",
        responseType: "blob",
      });

      const blob = response.data as Blob;

      // Check if response is an error page
      if (blob.type.includes("text/html")) {
        const text = await blob.text();
        if (text.includes("<html")) {
          dispatch(setToastMessage(DOWNLOAD_FAILED_TRY_AGAIN));
          return;
        }
      }

      let filename = fileName || "hospital-network.xlsx"; // Use original filename or default
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
      dispatch(
        setToastMessage(
          isError
            ? "Error file downloaded successfully."
            : "The uploaded source file has been retrieved successfully."
        )
      );
    } catch (err) {
      dispatch(setToastMessage(DOWNLOAD_FAILED_TRY_AGAIN));
    }
  };

  // API Mutations
  const moveToInclusionMutation = useApiMutation({
    method: HTTP_METHODS.POST,
    url: endPoints.hospitalMoveToInclusion, // You'll need to add this endpoint
  });

  const moveToExclusionMutation = useApiMutation({
    method: HTTP_METHODS.POST,
    url: endPoints.hospitalMoveToExclusion, // You'll need to add this endpoint
  });

  const discardMutation = useApiMutation({
    method: HTTP_METHODS.POST,
    url: endPoints.hospitalDiscard, // You'll need to add this endpoint
  });

  // Handler functions
  const handleMoveToInclusion = (id: string) => {
    moveToInclusionMutation.mutate({ hospitalId: id });
  };

  const handleMoveToExclusion = (id: string) => {
    moveToExclusionMutation.mutate({ hospitalId: id });
  };

  const handleDiscard = (id: string) => {
    discardMutation.mutate({ hospitalId: id });
  };

  // Get table columns
  const columns = useMemo(() => getColumns(), []);

  // API call for hospital networks
  const {
    data: hospitalData,
    isLoading: isLoadingHospitals,
    error,
  } = useApiQuery({
    queryKey: [
      "hospitalNetworks",
      activeFilter,
      fullSearchTerm,
      stringifySort,
      currentPage,
      pageSize,
    ],
    url:
      endPoints.getPortalConfigHospitalNetworks(policyId) +
      `?page=${currentPage}&limit=${pageSize}` +
      (activeFilter !== "all"
        ? `&isNetworkHospital=${activeFilter === "included"}`
        : "") +
      fullSearchTerm +
      (stringifySort ? `&sort=${stringifySort}` : ""),
  });

  // Handle form methods
  const handleFormMethods = useCallback(
    (methods: UseFormReturn<HospitalFilterValues>) => {
      setFormMethods(methods);
    },
    []
  );

  // Evaluate apply button state
  const evaluateApplyButtonState = useCallback(
    (values: HospitalFilterValues, currentSearchTerm: string) => {
      const otherFilterValues = Object.keys(values)
        .filter((key) => key !== "pinCode")
        .some((key) => hasValue(values[key as keyof HospitalFilterValues]));

      const hasPinCodeValue =
        values.pinCode && values.pinCode.toString().trim().length > 0;
      const hasSearchValue = hasValue(currentSearchTerm);

      const shouldEnable =
        otherFilterValues || hasPinCodeValue || hasSearchValue;

      setIsApplyDisabled(!shouldEnable);
    },
    []
  );

  // Watch form changes
  useEffect(() => {
    if (!formMethods) {
      return;
    }

    evaluateApplyButtonState(formMethods.getValues(), advancedSearchTerm);

    const subscription = formMethods.watch((value) => {
      const nextValues = value as HospitalFilterValues;
      evaluateApplyButtonState(nextValues, advancedSearchTerm);
    });

    return () => subscription.unsubscribe();
  }, [formMethods, evaluateApplyButtonState, advancedSearchTerm]);

  // Handle sort changes
  useEffect(() => {
    if (sort.length > 0) {
      const sortString = sort
        .map((s) => `${s.colId}:${s.sort.toUpperCase()}`)
        .join(",");
      setStringifySort(sortString);
    } else {
      setStringifySort("");
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  }, [sort]);

  // Handle advanced search change
  const handleAdvancedSearchChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value } = event.target;
    setAdvancedSearchTerm(value);

    if (formMethods) {
      evaluateApplyButtonState(formMethods.getValues(), value);
    }
  };

  // Build search parameters string
  const buildSearchParams = useCallback(
    (filters: HospitalFilterValues, search: string) => {
      const params: string[] = [];

      // Add search term if provided
      if (search && search.trim()) {
        params.push(`search=${encodeURIComponent(search.trim())}`);
      }

      // Add filter parameters if they have values
      if (filters.state && hasValue(filters.state)) {
        params.push(`state=${encodeURIComponent(filters.state)}`);
      }

      if (filters.city && hasValue(filters.city)) {
        params.push(`city=${encodeURIComponent(filters.city)}`);
      }

      if (filters.pinCode && hasValue(filters.pinCode)) {
        params.push(`pinCode=${encodeURIComponent(filters.pinCode)}`);
      }

      return params.length > 0 ? `&${params.join("&")}` : "";
    },
    []
  );

  // Handle apply filters
  const handleApplyFilters = async () => {
    console.log("clicking");
    if (!formMethods) {
      return;
    }

    // // Trigger form validation first
    // const isFormValid = await formMethods.trigger();
    setCurrentPage(1);

    // if (!isFormValid) {
    //   return;
    // }

    const filters = formMethods.getValues();
    const newSearchTerm = buildSearchParams(filters, advancedSearchTerm);
    setFullSearchTerm(newSearchTerm);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setAdvancedSearchTerm("");
    setFullSearchTerm("");
    setIsApplyDisabled(true);
    setCurrentPage(1);

    if (formMethods) {
      formMethods.reset(initialHospitalFilterValues, {
        keepDirtyValues: false,
        keepTouched: false,
      });
    }
  };

  // Handle filter change
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const totalRows = hospitalData?.data?.count || 0;

  // Calculate KPI data
  const kpiData = useMemo(
    () => getHospitalKPIData(hospitalData?.data),
    [hospitalData]
  );

  const handleChildren = () => (
    <DrawerContent>
      <DrawerTitle>{HOSPITAL_DRAWER.TITLE}</DrawerTitle>
      <DrawerSubTitle>{HOSPITAL_DRAWER.SUBTITLE}</DrawerSubTitle>
    </DrawerContent>
  );

  const handleExportClick = useCallback(async () => {
    try {
      const exportUrl =
        endPoints.portalConfigHospitalNetworkExport(policyId) +
        `?page=1&limit=${totalRows}` +
        (activeFilter !== "all"
          ? `&isNetworkHospital=${activeFilter === "included"}`
          : "") +
        fullSearchTerm +
        (stringifySort ? `&sort=${stringifySort}` : "");

      const tmpl = await apiRequest(exportUrl, {
        method: HTTP_METHODS.GET,
        responseType: "blob",
      });

      const blobData = tmpl?.data ?? tmpl;
      const blob =
        blobData instanceof Blob
          ? blobData
          : new Blob([blobData], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });

      const fileUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = `hospital-network-${policyId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      dispatch(setToastMessage(HOSPITAL_EXPORT_TOAST_MESSAGES.EXPORT_SUCCESS));
    } catch (error) {
      dispatch(setToastMessage(HOSPITAL_EXPORT_TOAST_MESSAGES.EXPORT_ERROR));
    }
  }, [
    dispatch,
    policyId,
    activeFilter,
    fullSearchTerm,
    stringifySort,
    totalRows,
  ]);

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleApplyFilters();
    }
  };

  const handleClick = () => {
    const opportunityType = policyDetails?.data?.opportunityType + " details";
    const detailsKey =
      policyDetails?.data?.opportunityType.toLowerCase() + "-details";

    const destinationConfig = {
      label: opportunityType,
      path: `/opportunities/${policyDetails?.data?.opportunityId}`,
      key: detailsKey,
    };
    const destinationState = buildBreadcrumbState({
      breadcrumbs: breadcrumbsForNavigation,
      crumb: destinationConfig,

      state: { policyDetailsData: policyDetails },
    });
    navigate(destinationConfig.path, {
      state: { ...destinationState, policyDetailsData: policyDetails },
    });
  };

  return (
    <Container>
      <ButtonContainer>
        <CommonBreadcrumb crumbs={hospitalBreadcrumbs(policyId)} />
        <Buttons>
          {isDownloadAllowed && (
            <DownloadButton variantType="secondary" onClick={handleExportClick}>
              <FileDownloadOutlinedIcon /> {DOWNLOAD_EXCEL}
            </DownloadButton>
          )}
          <ViewAuditButton
            variantType="secondary"
            onClick={() => setIsDrawerOpen(true)}
          >
            <HistoryOutlinedIcon /> {VIEW_AUDIT}
          </ViewAuditButton>
        </Buttons>
      </ButtonContainer>
      <SummaryCard
        data={{
          ...policyDetails?.data?.headerDetails,
          displayName:
            policyDetails?.data?.headerDetails?.displayName ||
            "No Title Available",
          policyId: policyDetails?.data?.policyId ?? null,
          company: {
            companyName:
              policyDetails?.data?.headerDetails?.companyName ||
              "Unknown Company",
            companyId: policyDetails?.data?.headerDetails?.companyId || 0,
          },
          opportunityId: policyDetails?.data?.opportunityId || "--",
        }}
        nameLink={""}
        sections={cardSections}
        headerConfig={{
          titleKey: "displayName",
          chip: [
            {
              key: "status",
              styleMap: priorityStyleMap,
              variant: "withDot",
              labelPrefix: "Status - ",
            },
          ],
        }}
        viewMore={true}
        viewMoreItems={policyDetailsViewMoreItemsOpportunity(handleClick)}
      />
      <KPICards data={kpiData} />

      <FilterChipsContainer>
        <FilterChip
          isActive={activeFilter === "all"}
          onClick={() => handleFilterChange("all")}
        >
          {ALL_HOSPITALS}{" "}
          {activeFilter === "all" &&
            `(${formatNumberByLocalization(hospitalData?.data?.count) || 0})`}
        </FilterChip>
        <FilterChip
          isActive={activeFilter === "included"}
          onClick={() => handleFilterChange("included")}
        >
          {INCLUSIONS}{" "}
          {activeFilter === "included" &&
            `(${formatNumberByLocalization(hospitalData?.data?.count) || 0})`}
        </FilterChip>
        <FilterChip
          isActive={activeFilter === "excluded"}
          onClick={() => handleFilterChange("excluded")}
        >
          {EXCLUSIONS}{" "}
          {activeFilter === "excluded" &&
            `(${formatNumberByLocalization(hospitalData?.data?.count) || 0})`}
        </FilterChip>
      </FilterChipsContainer>

      {/* Advanced Filters Section */}
      <FiltersContainer>
        {/* Search Box */}
        <FiltersContainerSearch>
          <FiltersContainerHeading>
            {FILTER_CONSTANTS.SEARCH_HOSPITAL}
          </FiltersContainerHeading>
          <StyledSearchField
            value={advancedSearchTerm}
            onChange={handleAdvancedSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder={FILTER_CONSTANTS.SEARCH_PLACEHOLDER}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </FiltersContainerSearch>

        <FiltersContainerForm>
          <DynamicForm
            variant="iwork"
            formConfig={HOSPITAL_FILTER_FORM_CONFIG(policyId || "", {
              onPinCodeEnter: handleApplyFilters,
            })}
            defaultValues={initialHospitalFilterValues}
            formMethods={handleFormMethods}
          />
        </FiltersContainerForm>

        <SearchButton
          variantType="primary"
          color="primary"
          disabled={isApplyDisabled}
          onClick={handleApplyFilters}
          sizeType="small"
        >
          <SearchIcon />
          <ButtonText>{FILTER_CONSTANTS.APPLY_FILTER_BUTTON}</ButtonText>
        </SearchButton>
        <ClearButton
          variantType="secondary"
          onClick={handleClearFilters}
          sizeType="small"
        >
          <ClearAllText>{FILTER_CONSTANTS.CLEAR_ALL_BUTTON}</ClearAllText>
        </ClearButton>
      </FiltersContainer>

      <Table
        columns={columns}
        rowData={hospitalData?.data?.data || []}
        totalRows={hospitalData?.data?.count}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={isLoadingHospitals}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={() => { }}
        components={{
          ChipRenderer,
          ActionButton: (props: any) => (
            <ActionsCell
              data={props.data}
              onMoveToInclusion={handleMoveToInclusion}
              onMoveToExclusion={handleMoveToExclusion}
              onDiscard={handleDiscard}
            />
          ),
        }}
        setSort={setSort}
      />

      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={handleChildren()}
        width="650px"
        anchor="right"
      >
        <DrawerContentWrapper>
          <DrawerScrollableContent>
            <Cards>
              {auditHistoryLoading ? (
                <Typography>{HOSPITAL_DRAWER.LOADING}</Typography>
              ) : auditHistoryError ? (
                <Typography color="error">{HOSPITAL_DRAWER.FAILED}</Typography>
              ) : auditHistoryData.length === 0 ? (
                <Typography>{HOSPITAL_DRAWER.NO_RECORDS}</Typography>
              ) : (
                auditHistoryData.map((audit, index) => (
                  <HospitalCard
                    key={index}
                    fileName={audit.fileName}
                    uploadedBy={audit.uploadedBy}
                    uploadedAt={audit.uploadedAt}
                    inclusionCount={audit.inclusionCount}
                    exclusionCount={audit.exclusionCount}
                    total={audit.total}
                    errorFileId={audit?.errorFileId}
                    errorCount={audit?.errorCount || 0}
                    onDownload={(isError) =>
                      handleFileDownload(
                        audit.fileId,
                        audit.fileName,
                        audit?.errorFileId,
                        isError
                      )
                    }
                    isDownloadAllowed={isDownloadAllowed}
                  />
                ))
              )}
            </Cards>
          </DrawerScrollableContent>

          <DrawerFooter>
            <RecordCount>
              {auditHistoryData.length} upload record
              {auditHistoryData.length !== 1 ? "s" : ""} found
            </RecordCount>
            <Button
              variantType="outlined"
              type="button"
              sizeType="small"
              onClick={() => setIsDrawerOpen(false)}
              sx={{
                border: "2px solid",
                borderColor: colors.background.greyVariant,
              }}
            >
              {CLOSE}
            </Button>
          </DrawerFooter>
        </DrawerContentWrapper>
      </Drawer>
    </Container>
  );
};

export default HospitalListing;
