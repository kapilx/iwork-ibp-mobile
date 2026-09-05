import { Box, TextField, MenuItem, CircularProgress } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  AutocompleteStyles,
  Button,
  CardBackground,
  CommonAGGrid as ClientSideGrid,
  StyledDatePickerWrapper,
  StyledLabelTypography,
  StyledPickerFormController,
  StyledPickerLabelContainer,
  endPoints,
  httpMethods,
  useApiMutation,
  useApiQuery,
  ServerSideGrid,
  environment,
  apiRequest,
  Pagination,
  PaginationContainer,
  ServerSideGridStyledFormControl,
  StyledSelect,
  StyledBox,
  selectHasPermission,
  FeatureKey,
} from "@ui/ui-lib";
import { StyledContainer, ActionRow, ParamRow } from "./styles";
import { SELECT_REPORT, Showing } from "../../../constants";
// import ServerSideGrid from "@ui/ui-lib";
import { LoaderContainer } from "./styles";

interface ReportItem {
  id: number;
  name: string;
  label: string;
}

interface Options {
  label: string;
  value: string;
}
interface Parameter {
  name: string;
  label: string;
  dataType: string;
  options: Options[] | null;
  selectedOption?: Options | null;
}

interface resultColumn {
  name: string;
  label: string;
  dataType: string;
  alignment?: string;
}

const ReportGeneration = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, any | null>>(
    {}
  );
  const [paramLabels, setParamLabels] = useState<
    Record<string, Options | null>
  >({});
  const [resultColumn, setResultColumn] = useState<resultColumn[]>([]);
  const [dateColumn, setDateColumn] = useState<resultColumn[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<{ colId: string; sort: "asc" | "desc" }[]>(
    []
  );
  const [generated, setGenerated] = useState(false);
  const [endPoint, setEndPoint] = useState<string>("");
  const [downloadLoading, setDownloadLoading] = useState(false);

  const hasExportPermission = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EXPORT_ADMIN_REPORTS)(state)
  );
  const isDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasExportPermission;

  const columns = useMemo(() => {
    if (reportData.length === 0) return [];
    return Object.keys(reportData[0]).map((key) => {
      const result = resultColumn.find((col) => col.name === key);
      const alignment = result?.alignment;
      const cellClass =
        alignment === "end"
          ? "right-aligned-cell"
          : alignment === "centre" || alignment === "center"
          ? "center-aligned-cell"
          : "";
      const headerClass = "";
      return {
        field: key,
        headerName: result?.label ? result.label : key,
        tooltipField: key,
        tooltipValueGetter: (params: any) => params.value ?? "",
        cellClass,
        headerClass,
      };
    });
  }, [reportData, resultColumn]);

  const handleGenerateWithoutPagination = () => {
    setCurrentPage(1);
    setGenerated(true);
    if (!selectedReport) return;
    const payload: Record<string, string> = {};
    parameters.forEach((p) => {
      const value = paramValues[p.name];
      if (dayjs.isDayjs(value)) {
        payload[p.name] = (value as Dayjs).format("YYYY-MM-DD");
      } else if (value) {
        payload[p.name] = String(value);
      }
    });

    mutate(
      {
        endpoint: endPoints.generateReport + endPoint + `?page=1&limit=0`,
        method: httpMethods.POST,
        data: payload,
      },
      {
        onSuccess: (response: any) => {
          if (response?.data) {
            const formattedData = response.data.data?.map((item: any) => {
              if (dateColumn.length > 0) {
                dateColumn.forEach((col: any) => {
                  if (item[col.name]) {
                    item[col.name] = dayjs(item[col.name]).format(
                      "DD/MM/YYYY HH:mm:ss"
                    );
                  }
                });
              }
              return item;
            });
            setReportData(formattedData || []);
            setTotalRows(response.data.count || 0);
          }
        },
        onError: (error) => {
          console.error("Error generating report:", error);
        },
      }
    );
  };

  const fetchReport = () => {
    if (!selectedReport) return;
    const payload: Record<string, string> = {};
    parameters.forEach((p) => {
      const value = paramValues[p.name];
      if (dayjs.isDayjs(value)) {
        payload[p.name] = (value as Dayjs).format("YYYY-MM-DD");
      } else if (value) {
        payload[p.name] = String(value);
      }
    });

    const sortParam =
      sort.length > 0 ? sort.map((s) => `${s.colId}:${s.sort}`).join(",") : "";

    mutate(
      {
        endpoint:
          endPoints.generateReport +
          endPoint +
          `?page=${currentPage}&limit=${pageSize}` +
          (sortParam ? `&sort=${sortParam}` : ""),
        method: httpMethods.POST,
        data: payload,
      },
      {
        onSuccess: (response: any) => {
          if (response?.data) {
            const formattedData = response.data.data?.map((item: any) => {
              if (dateColumn.length > 0) {
                dateColumn.forEach((col: any) => {
                  if (item[col.name]) {
                    item[col.name] = dayjs(item[col.name]).format(
                      "DD/MM/YYYY HH:mm:ss"
                    );
                  }
                });
              }
              return item;
            });
            setReportData(formattedData || []);
            setTotalRows(response.data.count || 0);
          }
        },
        onError: (error) => {
          console.error("Error generating report:", error);
        },
      }
    );
  };

  const convertToCsv = (items: any[]) => {
    if (items.length === 0) return "";
    const headers = Object.keys(items[0]).join(",");
    const rows = items.map((row) => Object.values(row).join(",")).join("\n");
    return `${headers}\n${rows}`;
  };

  const handleGenerateWithPagination = () => {
    setCurrentPage(1);
    setSort([]);
    setGenerated(true);
    // Remove direct fetchReport() call - let useEffect handle it
  };

  const handleDownloadWithoutPagination = () => {
    const csv = convertToCsv(reportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fileName = `report_${selectedReport?.name || "data"}_${dayjs().format(
      "YYYYMMDDHHmmss"
    )}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWithPagination = () => {
    if (!selectedReport) return;
    const payload: Record<string, string> = {};
    parameters.forEach((p) => {
      const value = paramValues[p.name];
      if (dayjs.isDayjs(value)) {
        payload[p.name] = (value as Dayjs).format("YYYY-MM-DD");
      } else if (value) {
        payload[p.name] = String(value);
      }
    });
    setDownloadLoading(true);
    apiRequest(endPoints.downloadReport + endPoint, {
      method: "POST",
      data: payload,
      responseType: "blob",
    })
      .then((res) => {
        const contentType =
          res?.headers?.["content-type"] || "application/octet-stream";
        const disposition = res?.headers?.["content-disposition"] || "";
        const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);
        const fileName =
          fileNameMatch?.[1] ||
          `report_${selectedReport?.name || "data"}_${dayjs().format(
            "YYYYMMDDHHmmss"
          )}`;

        const blob = new Blob([res.data], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .finally(() => setDownloadLoading(false));
  };
  const { mutate, isLoading: generateLoading } = useApiMutation({
    config: {
      onSuccess: (response) => {},
      onError: (error) => {},
    },
  });

  const { data: reportListData, isLoading: reportListLoading } = useApiQuery({
    url: endPoints.reportList,
    queryKey: ["reportList"],
  });

  useEffect(() => {
    if (reportListData?.data.reportList) {
      setReports(reportListData.data.reportList);
      setSelectedReport((prev) => prev || reportListData.data.reportList[0]);
    }
  }, [reportListData]);

  const { data: reportDetailData, isLoading: reportDetailLoading } =
    useApiQuery({
      url: selectedReport
        ? endPoints.reportDetails(selectedReport.id.toString())
        : "",
      queryKey: ["reportDetails", selectedReport?.name],
      enabled: !!selectedReport,
    });

  useEffect(() => {
    if (reportDetailData) {
      setEndPoint(reportDetailData.data.endPoint);
      setParameters(reportDetailData.data.parameterList || []);
      const defaultsValues: Record<string, any | null> = {};
      const defaultsLabels: Record<string, Options | null> = {};
      (reportDetailData.data.parameterList || []).forEach((p: Parameter) => {
        if (p.dataType === "date") {
          defaultsValues[p.name] = dayjs();
          defaultsLabels[p.name] = null;
        } else if (p.options?.length) {
          defaultsValues[p.name] = p.options[0].value;
          defaultsLabels[p.name] = p.options[0];
        } else {
          defaultsValues[p.name] = null;
          defaultsLabels[p.name] = null;
        }
      });
      const dateType = (reportDetailData.data.resultsList || []).filter(
        (result: resultColumn) => {
          return result.dataType === "date";
        }
      );
      setDateColumn(dateType);
      setResultColumn(reportDetailData.data.resultsList || []);
      setParamValues(defaultsValues);
      setParamLabels(defaultsLabels);
    }
  }, [reportDetailData]);

  useEffect(() => {
    if (generated) {
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sort]);
  let handleGenerate;
  let handleDownload;
  const config = environment.genericReportPagination
    ? environment.genericReportPagination
    : "SERVER_SIDE";
  console.log(
    "Generic Report Pagination Config: ",
    environment.genericReportPagination
  );

  if (config == "SERVER_SIDE") {
    handleGenerate = handleGenerateWithPagination;
    handleDownload = handleDownloadWithPagination;
  } else {
    handleGenerate = handleGenerateWithoutPagination;
    handleDownload = handleDownloadWithoutPagination;
  }
  const pageLoading =
    reportListLoading || reportDetailLoading || downloadLoading;
  return (
    <StyledContainer>
      <CardBackground>
        <ActionRow>
          <Box key="select report">
            <StyledPickerLabelContainer>
              <StyledLabelTypography variant="body1" style={{ width: "100%" }}>
                {SELECT_REPORT}
              </StyledLabelTypography>
            </StyledPickerLabelContainer>
            <AutocompleteStyles
              options={reports}
              getOptionLabel={(option) => (option as ReportItem).label}
              isOptionEqualToValue={(option, value) =>
                (option as ReportItem).name ===
                (value as ReportItem | null)?.name
              }
              value={selectedReport}
              onChange={(_, val) => setSelectedReport(val as ReportItem)}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select Report" />
              )}
              sx={{ width: 240 }}
            />
          </Box>
          {parameters.map((param) => (
            <Box key={param.name}>
              <StyledPickerLabelContainer>
                <StyledLabelTypography
                  variant="body1"
                  style={{ width: "100%" }}
                >
                  {param.label}
                </StyledLabelTypography>
              </StyledPickerLabelContainer>
              <StyledPickerFormController fullWidth>
                {param.dataType === "date" ? (
                  <StyledDatePickerWrapper
                    value={paramValues[param.name] as Dayjs | null}
                    onChange={(val) =>
                      setParamValues((prev) => ({ ...prev, [param.name]: val }))
                    }
                  />
                ) : (
                  <AutocompleteStyles
                    options={param.options || []}
                    getOptionLabel={(option) => (option as Options).label}
                    isOptionEqualToValue={(option, value) =>
                      (option as Options).value ===
                      (value as Options | null)?.value
                    }
                    value={paramLabels[param.name]}
                    onChange={(_, value) => {
                      const val = value as Options | null;
                      setParamValues((prev) => ({
                        ...prev,
                        [param.name]: val?.value || null,
                      }));
                      setParamLabels((prev) => ({
                        ...prev,
                        [param.name]: val,
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Select Report" />
                    )}
                    sx={{ width: 240 }}
                  />
                )}
              </StyledPickerFormController>
            </Box>
          ))}
        </ActionRow>
        <ParamRow>
          <Button
            label="Generate"
            variantType="primary"
            onClick={handleGenerate}
          />
          {isDownloadAllowed && (
          <Button
            label="Download"
            variantType={reportData.length > 0 ? "primary" : "secondary"}
            onClick={handleDownload}
            disabled={reportData.length === 0}
          />
          )}
        </ParamRow>
      </CardBackground>
      {pageLoading ? (
        <LoaderContainer>
          <CircularProgress />
        </LoaderContainer>
      ) : (
        generated &&
        (config === "SERVER_SIDE" ? (
          <Box mt={4} width="100%">
            <ServerSideGrid
              rows={reportData}
              columns={columns}
              totalRecords={totalRows}
              currentPage={currentPage}
              loading={generateLoading}
              onPageChange={(page) => setCurrentPage(page)}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              setSort={setSort}
              height={500}
            />
            <PaginationContainer>
              <ServerSideGridStyledFormControl variant="outlined" size="small">
                <StyledBox>{Showing} </StyledBox>
                <StyledSelect
                  value={pageSize}
                  inputProps={{ "aria-label": "Page size" }}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[10, 20, 50, 100].map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                </StyledSelect>
                <StyledBox>of {totalRows} entries</StyledBox>
              </ServerSideGridStyledFormControl>
              <Pagination
                totalRecords={totalRows}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
              />
            </PaginationContainer>
          </Box>
        ) : (
          <Box mt={4} width="100%">
            {generateLoading ? (
              <LoaderContainer>
                <CircularProgress />
              </LoaderContainer>
            ) : (
              <ClientSideGrid
                rowData={reportData}
                columnDefs={columns}
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                height={500}
              />
            )}
          </Box>
        ))
      )}
    </StyledContainer>
  );
};

export default ReportGeneration;
