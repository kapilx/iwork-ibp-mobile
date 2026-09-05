import {
  ButtonContainer,
  ButtonTypography,
  CommonButton,
  CommonQuoteComparisonTypography,
  CommonTableContainer,
  HeaderTypography,
  LoaderContainer,
  QuoteComparisonPageMainContainer,
  PageHeader,
  TitleContainer,
} from "./styles";
import LeftArrowIcon from "../../assets/svgs/left-arrow-icon.svg";
import MailIcon from "../../assets/svgs/colored-mail-icon.svg";
import XlsIcon from "../../assets/svgs/xls-icon.svg";
import {
  ALERT_MESSAGES,
  BASIC_COVER_DETAILS_COMPARISON,
  DOWNLOAD_URL_NOT_FOUND,
  EMAIL_REPORT,
  EXPORT_TO_EXCEL,
  NO_QUOTES_AVAILABLE_FOR_THIS_VERSION,
  PREMIUM_COMPARISON,
  QUOTE_COMPARISON_REPORT_GENERATION,
  NO_VERSION_DATA_AVAILABLE,
} from "../../constants";
import {
  httpMethods,
  CommonAGGrid,
  endPoints,
  useApiMutation,
  useApiQuery,
  setToastMessage,
  HTTP_METHODS,
  selectHasPermission,
  FeatureKey
} from "@ui/ui-lib";
import QuoteComparisonCard from "../../components/QuoteComparison";
import { ColDef } from "ag-grid-community";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import HighlightDiffRenderer from "./highlight";
import {
  getQcrSectionRowClass,
  qcrSectionCellClassRules,
} from "./gridStyles";
import { useDispatch, useSelector } from "react-redux";
import { environment } from "@ui/ui-lib/environment";

const getInsurersFromHeaders = (headersObj: any): string[] => {
  if (!headersObj) return [];
  return Object.values(headersObj).filter(
    (val: any) => typeof val === "string" && val.toLowerCase() !== "parameters"
  ) as string[];
};

const generateDynamicColumns = (
  headersObj: any,
  highlightFieldMatcher?: (header: string) => boolean
): ColDef[] => {
  if (!headersObj) return [];
  return Object.entries(headersObj).map(([key, headerName]) => {
    const headerStr = String(headerName);
    const isPrimaryColumn = key === "key" || key === "parameters";
    return {
      headerName: headerStr,
      field: key,
      width: 280,
      colSpan: (params: any) => {
        if (!["section", "section_spacer"].includes(params?.data?.__rowType))
          return 1;
        if (!isPrimaryColumn) return 1;
        return params?.api?.getAllDisplayedColumns?.().length || 1;
      },
      valueFormatter: ({ value, data }: any) => {
        if (data?.__rowType === "section_spacer") {
          return "";
        }
        if (data?.__rowType === "section") {
          return isPrimaryColumn ? data.__sectionName || value || "--" : "";
        }
        return value !== null && value !== undefined ? value : "--";
      },
      hide: false,
      cellClass: "clickable-cell",
      cellClassRules: qcrSectionCellClassRules,
      sortable: false,
      wrapText: true,
      autoHeight: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      cellStyle: {
        lineHeight: "20px",
      },
      cellRendererSelector:
        highlightFieldMatcher &&
        highlightFieldMatcher(headerStr)
          ? (params: any) =>
              params?.data?.__rowType === "section"
                ? undefined
                : { component: HighlightDiffRenderer }
          : undefined,
    };
  });
};

const QuoteComparisonPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const hasRbacExportPermission = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EXPORT_OPTY_ACTIVITY)(state)
  );
  const isExportAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacExportPermission;

  const { id: opportunityActivityId } = useParams<{ id: string }>();
  const [QuoteComparisonResponse, setQuoteComparisonResponse] =
    useState<any>(null);
  const [versionData, setVersionData] = useState<any>(null);
  const [selectedInsurers, setSelectedInsurers] = useState<string[]>([]);
  const [dynamicInsurers, setDynamicInsurers] = useState<string[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isQuoteNotAvailable, setIsQuoteNotAvailable] = useState(false);

  const { data: versions } = useApiQuery({
    queryKey: ["versionDetails", opportunityActivityId],
    url: endPoints.getVersionDetails(Number(opportunityActivityId)),
    enabled: !!opportunityActivityId,
  });

  useEffect(() => {
    if (versions) {
      setVersionData(versions);
    }
  }, [versions]);

  const { mutate } = useApiMutation({
    config: {
      onSuccess(response: any) {
        setIsQuoteNotAvailable(false);
        setQuoteComparisonResponse(response?.data);
        setLoading(false);
      },
      onError(error: any) {
        setIsQuoteNotAvailable(true);
        dispatch(setToastMessage(NO_QUOTES_AVAILABLE_FOR_THIS_VERSION));
        setLoading(false);
      },
    },
  });

  // Fetch the quote comparison report when the component mounts or version changes
  useEffect(() => {
    if (!versionData?.data || versionData.data.length === 0) return;
    const selectedVersion = versionData.data[selectedVersionIndex];
    if (!selectedVersion) return;
    setLoading(true);
    // Dynamically extract quoteEntry ids if available
    const quoteEntryArr =
      Array.isArray(selectedVersion.quoteEntry) &&
      selectedVersion.quoteEntry.map((q: any) => q.id);
    mutate({
      endpoint: endPoints.getQuoteComparisonReport,
      method: httpMethods.POST,
      data: {
        opportunityActivityId: Number(opportunityActivityId),
        brokingSlipVersion: selectedVersion?.id,
        quoteEntry: quoteEntryArr,
        brokingSlipCovers: true,
        rfpDetailsCovers: false,
      },
    });
  }, [selectedVersionIndex, versionData]);

  // Extract and set insurers when response changes
  useEffect(() => {
    if (!QuoteComparisonResponse) return;
    const premiumInsurers = getInsurersFromHeaders(
      QuoteComparisonResponse.premiumComparisonSection?.headers
    );
    const basicCoverInsurers = getInsurersFromHeaders(
      QuoteComparisonResponse.basicCoversComparisonSection?.headers
    );
    const waiverInsurers = getInsurersFromHeaders(
      QuoteComparisonResponse.waiversComparisonSection?.headers
    );

    const combinedInsurers = Array.from(
      new Set([...premiumInsurers, ...basicCoverInsurers, ...waiverInsurers])
    );
    setDynamicInsurers(combinedInsurers);
    setSelectedInsurers(combinedInsurers);
  }, [QuoteComparisonResponse]);

  const premiumHeaders = useMemo(
    () => QuoteComparisonResponse?.premiumComparisonSection?.headers || {},
    [QuoteComparisonResponse]
  );

  const premiumRows = useMemo(
    () => QuoteComparisonResponse?.premiumComparisonSection?.data || [],
    [QuoteComparisonResponse]
  );
  const basicCoversHeaders = useMemo(
    () => QuoteComparisonResponse?.coverDetailSection?.headers || {},
    [QuoteComparisonResponse]
  );
  const basicCoversRowData = useMemo(
    () => QuoteComparisonResponse?.coverDetailSection?.data || [],
    [QuoteComparisonResponse]
  );
  const basicCoversDisplayRows = useMemo(() => {
    if (!Array.isArray(basicCoversRowData) || basicCoversRowData.length === 0) {
      return [];
    }
    return basicCoversRowData;
  }, [basicCoversRowData]);
  const waiverHeaders = useMemo(
    () => QuoteComparisonResponse?.waiversComparisonSection?.headers || {},
    [QuoteComparisonResponse]
  );
  const waiverRowData = useMemo(
    () => QuoteComparisonResponse?.waiversComparisonSection?.data || [],
    [QuoteComparisonResponse]
  );

  // Memoize columns
  const premiumComparisonCols = useMemo(
    () =>
      generateDynamicColumns(premiumHeaders, (header) =>
        header.toLowerCase().includes("insurance")
      ),
    [premiumHeaders]
  );
  const basicCoversCols = useMemo(
    () =>
      generateDynamicColumns(basicCoversHeaders, (header) =>
        header.toLowerCase().includes("insurance")
      ),
    [basicCoversHeaders]
  );
  const waiverCols = useMemo(
    () =>
      generateDynamicColumns(waiverHeaders, (header) =>
        header.toLowerCase().includes("insurance")
      ),
    [waiverHeaders]
  );

  // Ensure Broking Slip column appears first in the grid
  const activityTypes = [/* "RFP", */ "Broking Slip"];
  const sortedSelectedInsurers = useMemo(
    () => [
      ...activityTypes.filter((a) => selectedInsurers.includes(a)),
      ...selectedInsurers.filter((ins) => !activityTypes.includes(ins)),
    ],
    [selectedInsurers]
  );

  const getBasicCoverRowHeight = useCallback((params: any) => {
    return params?.data?.__rowType === "section_spacer" ? 16 : 52;
  }, []);

  // Filter columns based on sorted selected insurers and isQuoteNotAvailable
  const getFilteredColumns = useCallback(
    (columns: ColDef[]) => {
      // If quote is not available, only show RFP and Broking Slip columns (and key/parameters)
      if (isQuoteNotAvailable) {
        return columns.map((col) => {
          if (
            (col.field ?? "") === "key" ||
            (col.field ?? "") === "parameters"
          ) {
            return { ...col, hide: false };
          }
          const originalHeaderName =
            premiumHeaders[col.field as keyof typeof premiumHeaders] ||
            basicCoversHeaders[col.field as keyof typeof basicCoversHeaders] ||
            waiverHeaders[col.field as keyof typeof waiverHeaders];
          const shouldShow = [/* "RFP", */ "Broking Slip"].some((insurer) =>
            originalHeaderName?.toLowerCase().includes(insurer.toLowerCase())
          );
          return {
            ...col,
            hide: !shouldShow,
          };
        });
      }

      return columns
        .sort((a, b) => {
          // Only sort insurer columns, leave key/parameters at the start
          if (
            ["key", "parameters"].includes(a.field ?? "") ||
            ["key", "parameters"].includes(b.field ?? "")
          )
            return 0;
          const aIdx = sortedSelectedInsurers.findIndex((ins) => {
            const header =
              premiumHeaders[a.field as keyof typeof premiumHeaders] ||
              basicCoversHeaders[a.field as keyof typeof basicCoversHeaders] ||
              waiverHeaders[a.field as keyof typeof waiverHeaders];
            return header
              ?.toLowerCase()
              .includes(ins.toLowerCase().split(" ")[0]);
          });
          const bIdx = sortedSelectedInsurers.findIndex((ins) => {
            const header =
              premiumHeaders[b.field as keyof typeof premiumHeaders] ||
              basicCoversHeaders[b.field as keyof typeof basicCoversHeaders] ||
              waiverHeaders[b.field as keyof typeof waiverHeaders];
            return header
              ?.toLowerCase()
              .includes(ins.toLowerCase().split(" ")[0]);
          });
          return aIdx - bIdx;
        })
        .map((col) => {
          if ((col.field ?? "") === "key" || (col.field ?? "") === "parameters")
            return { ...col, hide: false };
          const originalHeaderName =
            premiumHeaders[col.field as keyof typeof premiumHeaders] ||
            basicCoversHeaders[col.field as keyof typeof basicCoversHeaders] ||
            waiverHeaders[col.field as keyof typeof waiverHeaders];
          const shouldShow = sortedSelectedInsurers.some((insurer) =>
            originalHeaderName
              ?.toLowerCase()
              .includes(insurer.toLowerCase().split(" ")[0])
          );
          return {
            ...col,
            hide: !shouldShow,
          };
        });
    },
    [
      sortedSelectedInsurers,
      premiumHeaders,
      basicCoversHeaders,
      waiverHeaders,
      isQuoteNotAvailable,
    ]
  );

  const handleBackClick = () => {
    const state = location.state;
    navigate(state.originPath, {
      state: { accordionStep: state.accordionStep },
    });
  };

  const mutation = useApiMutation({
    config: {
      onSuccess: (response) => {
        console.log("response", response);
        const fileUrl = response?.data;
        if (fileUrl) {
          const link = document.createElement("a");
          link.href = fileUrl;
          link.download = ""; // Optional: provide a filename if you want a custom name
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          dispatch(setToastMessage(DOWNLOAD_URL_NOT_FOUND));
        }
      },
      onError: (error) => {
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleEmailReportDownload = () => {
    if (!versionData?.data || versionData.data.length === 0) {
      dispatch(setToastMessage(NO_VERSION_DATA_AVAILABLE));
      return;
    }

    const selectedVersion = versionData?.data[selectedVersionIndex];
    if (!selectedVersion) return;
    // Dynamically extract quoteEntry ids if available
    const quoteEntryArr =
      Array.isArray(selectedVersion?.quoteEntry) &&
      selectedVersion.quoteEntry.map((q: any) => q.id);
    mutation.mutate({
      endpoint: endPoints.emailReportDownload,
      method: HTTP_METHODS.POST,
      data: {
        opportunityId: Number(location.state?.opportunityId),
        activityKey: "quote_comparison_report_activity",
        opportunityActivityId: Number(opportunityActivityId),
        brokingSlipVersion: selectedVersion?.id,
        quoteEntry: quoteEntryArr,
        brokingSlipCovers: true,
        rfpDetailsCovers: false,
      },
    });
  };

  return (
    <>
      <QuoteComparisonPageMainContainer>
        <PageHeader>
          <TitleContainer>
            <img
              src={LeftArrowIcon}
              alt="Left Arrow"
              onClick={handleBackClick}
            />
            <HeaderTypography>
              {QUOTE_COMPARISON_REPORT_GENERATION}
            </HeaderTypography>
          </TitleContainer>
          <ButtonContainer>
            <CommonButton disabled variantType="secondary" size="small">
              <img src={MailIcon} alt="Mail Icon" />
              <ButtonTypography onClick={handleEmailReportDownload}>
                {EMAIL_REPORT}
              </ButtonTypography>
            </CommonButton>
            {isExportAllowed && (
            <CommonButton
              onClick={handleEmailReportDownload}
              variantType="secondary"
              size="small"
            >
              <img src={XlsIcon} alt="Excel Icon" />
              <ButtonTypography>{EXPORT_TO_EXCEL}</ButtonTypography>
            </CommonButton>
            )}
          </ButtonContainer>
        </PageHeader>

        <QuoteComparisonCard
          selectedInsurers={selectedInsurers}
          setSelectedInsurers={setSelectedInsurers}
          dynamicInsurers={dynamicInsurers?.filter(
            (insurer) =>
              !["rfp", "broking slip"].includes(insurer.trim().toLowerCase())
          )}
          versionData={versionData}
          selectedVersionIndex={selectedVersionIndex}
          setSelectedVersionIndex={setSelectedVersionIndex}
          isQuoteNotAvailable={isQuoteNotAvailable}
        />

        <CommonTableContainer>
          <CommonQuoteComparisonTypography>
            {PREMIUM_COMPARISON}
          </CommonQuoteComparisonTypography>
          {loading ? (
            <LoaderContainer>
              <CircularProgress color="secondary" />
            </LoaderContainer>
          ) : (
            <CommonAGGrid
              rowData={premiumRows}
              columnDefs={getFilteredColumns(premiumComparisonCols)}
              context={{
                selectedInsurers: sortedSelectedInsurers,
                headers: premiumHeaders,
              }}
              pagination={false}
              paginationPageSizeSelector={[2, 4, 5]}
              height={400}
              paginationPageSize={10}
              rowHeight={52}
            />
          )}
        </CommonTableContainer>

        <CommonTableContainer>
          <CommonQuoteComparisonTypography>
            {BASIC_COVER_DETAILS_COMPARISON}
          </CommonQuoteComparisonTypography>
          {loading ? (
            <LoaderContainer>
              <CircularProgress />
            </LoaderContainer>
          ) : (
            <CommonAGGrid
              rowData={basicCoversDisplayRows}
              columnDefs={getFilteredColumns(basicCoversCols)}
              context={{
                selectedInsurers: sortedSelectedInsurers,
                headers: basicCoversHeaders,
              }}
              getRowClass={getQcrSectionRowClass}
              getRowHeight={getBasicCoverRowHeight}
              pagination={false}
              paginationPageSizeSelector={[2, 4, 5]}
              height={400}
              paginationPageSize={10}
            />
          )}
        </CommonTableContainer>

        {/* <CommonTableContainer>
          <CommonQuoteComparisonTypography>
            {WAIVER_COVER_DETAILS_COMPARISON}
          </CommonQuoteComparisonTypography>
          <CommonAGGrid
            rowData={waiverRowData}
            columnDefs={getFilteredColumns(waiverCols)}
            context={{ selectedInsurers }}
            pagination={false}
            paginationPageSizeSelector={[2, 4, 5]}
            height={180}
            paginationPageSize={10}
            rowHeight={54}
          />
        </CommonTableContainer> */}
      </QuoteComparisonPageMainContainer>
    </>
  );
};

export default QuoteComparisonPage;
