import React, { useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CommonBreadcrumb,
  Table,
  PAGE_SIZE_OPTIONS,
  endPoints,
  useApiQuery,
  formatNumberByLocalization,
  Drawer,
  Button,
  AppDispatch,
  setToastMessage,
  apiRequest,
  colors,
  HTTP_METHODS,
  SummaryCard,
  cardSections,
  buildBreadcrumbState,
  getBreadcrumbsFromState,
} from "@ui/ui-lib";
import { getFaqColumns, faqBreadcrumbs } from "./tableConfig";
import {
  ButtonContainer,
  Container,
  DrawerContent,
  DrawerContentWrapper,
  DrawerFooter,
  DrawerScrollableContent,
  DrawerSubTitle,
  DrawerTitle,
  FilterChip,
  FilterChipsContainer,
  RecordCount,
} from "./styles";
import {
  Buttons,
  Cards,
  DownloadButton,
  ViewAuditButton,
} from "../HospitalListing/styles";
import { Typography } from "@mui/material";
import HospitalCard from "../../common/HospitalCard";
import {
  CLOSE,
  DOWNLOAD_EXCEL,
  DOWNLOAD_FAILED_TRY_AGAIN,
  FAQ_EXPORT_ERROR_MESSAGE,
  FAQ_EXPORT_MESSAGE,
  HOSPITAL_DRAWER,
  VIEW_AUDIT,
} from "../../constants";
import { useDispatch } from "react-redux";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { priorityStyleMap } from "../../pages/CompanyPage/PolicyDetails/styles";
import {
  policyBreadcrumbs,
  policyDetailsViewMoreItemsOpportunity,
} from "../../pages/CompanyPage/PolicyDetails/detailsConfig";

const FaqsListing: React.FC = () => {
  const { id: policyId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
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
      : faqBreadcrumbs(policyId);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Category filter state
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Get table columns
  const columns = useMemo(() => getFaqColumns(), []);

  // Build API URL with category filter
  const buildApiUrl = () => {
    let url =
      `${endPoints.getFaqs}` +
      `?page=${currentPage}` +
      `&limit=${pageSize}` +
      `&policyId=${policyId}` +
      `&category=${encodeURIComponent(activeCategory)}`;
    return url;
  };
  const logApiUrl = () => {
    let url = `${endPoints.getFaqsAuditLogs}` + `?policyId=${policyId}`;
    return url;
  };

  // API call for FAQs
  const {
    data: faqData,
    isLoading: isLoadingFaqs,
    error,
  } = useApiQuery({
    queryKey: ["faqs", policyId, activeCategory, currentPage, pageSize],
    url: buildApiUrl(),
    enabled: !!policyId,
  });

  // Build category list from API response
  const categories = useMemo(() => {
    const availableCategories = faqData?.data?.availableCategories || [];

    // Create category list with "All" as first option
    const categoryList = [
      { id: "all", label: "All FAQs" },
      ...availableCategories.map((cat: string) => ({
        id: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1), // Capitalize first letter
      })),
    ];

    return categoryList;
  }, [faqData?.data?.availableCategories]);

  // Fetch audit history data from API
  const {
    data: auditHistoryApiData,
    isLoading: auditHistoryLoading,
    error: auditHistoryError,
  } = useApiQuery({
    url: logApiUrl(),
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

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1); // Reset to first page when category changes
  };

  const handleChildren = () => (
    <DrawerContent>
      <DrawerTitle>{HOSPITAL_DRAWER.TITLE}</DrawerTitle>
      <DrawerSubTitle>{HOSPITAL_DRAWER.FAQSUBTITLE}</DrawerSubTitle>
    </DrawerContent>
  );

  // File download handler
  const handleFileDownload = async (
    fileId: number,
    fileName: string,
    errorFileId?: number
  ) => {
    try {
      if (!fileId) {
        dispatch(setToastMessage("Invalid file selection."));
        return;
      }

      const downloadUrl = `${endPoints.fileUploadDownloadById(
        fileId
      )}?moduleKey=${encodeURIComponent("policies")}`;
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

      let filename = fileName || "faq.xlsx"; // Use original filename or default
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
          "The uploaded source file has been retrieved successfully."
        )
      );
    } catch (err) {
      dispatch(setToastMessage(DOWNLOAD_FAILED_TRY_AGAIN));
    }
  };

  const handleExportClick = useCallback(async () => {
    try {
      const exportUrl = endPoints.faqExport(policyId);
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
      a.download = `faq-${policyId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      dispatch(setToastMessage(FAQ_EXPORT_MESSAGE));
    } catch (error) {
      dispatch(setToastMessage(FAQ_EXPORT_ERROR_MESSAGE));
    }
  }, [dispatch, policyId]);
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
        <CommonBreadcrumb crumbs={faqBreadcrumbs(policyId)} />
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

      {/* Category Filter Chips */}
      <FilterChipsContainer>
        {categories.map((category) => (
          <FilterChip
            key={category.id}
            isActive={activeCategory === category.id}
            onClick={() => handleCategoryChange(category.id)}
          >
            {category.label}{" "}
            {activeCategory === category.id && faqData?.data?.total
              ? `(${formatNumberByLocalization(faqData.data.total)})`
              : ""}
          </FilterChip>
        ))}
      </FilterChipsContainer>
      {/* FAQ Table */}
      <Table
        columns={columns}
        rowData={faqData?.data?.faqs || []}
        totalRows={faqData?.data?.total || 0}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={isLoadingFaqs}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={() => {}}
        setSort={() => {}}
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
                    onDownload={() =>
                      handleFileDownload(
                        audit.fileId,
                        audit.fileName,
                        audit?.errorFileId
                      )
                    }
                    showFooter={false}
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

export default FaqsListing;
