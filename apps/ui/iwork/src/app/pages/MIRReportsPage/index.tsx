import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { Box, Paper, Typography } from "@mui/material";
import { DynamicForm, Table } from "@ui/ui-lib";
import {
  axiosInstance,
  endPoints,
  useApiQuery,
  setToastMessage,
} from "@ui/ui-lib";
import { MIR_FILTER_FIELDS, getMirColumns, formatPeriodLabel } from "./config";
import {
  generateBarPaperSx,
  pageContainerSx,
  pageTitleSx,
  pastReportsTitleSx,
} from "./styles";

interface FilterValues {
  company: string;
  companyName?: string;
  period: string;
}

interface MirReportRow {
  id: number;
  company: string;
  period: string;
  status: string;
  owner: string;
  generatedOn: string;
  publishedAt: string;
  companyId: number;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const MIRReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [generating, setGenerating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [, setSort] = useState<{ colId: string; sort: "asc" | "desc" }[]>([]);

  const { data: listResponse, isLoading, refetch } = useApiQuery({
    url: `${endPoints.mirReportList}?page=${currentPage}&limit=${pageSize}`,
    queryKey: ["mir-report-list", currentPage, pageSize],
  });

  const reports: MirReportRow[] = useMemo(() => {
    const items = listResponse?.data?.data ?? [];
    return items.map((r: any) => ({
      id: r.id,
      company: r.company?.companyName ?? String(r.companyId),
      period: formatPeriodLabel(r.reportPeriod),
      status: r.status,
      owner: r.createdByName ?? String(r.createdBy),
      generatedOn: (() => {
        const d = r.createdAt ? new Date(r.createdAt) : null;
        return d && !isNaN(d.getTime())
          ? new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(d)
          : "—";
      })(),
      publishedAt: (() => {
        if (r.status?.toLowerCase() !== "published" || !r.updatedAt) return "—";
        const d = new Date(r.updatedAt);
        return !isNaN(d.getTime())
          ? new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(d)
          : "—";
      })(),
      companyId: r.companyId,
    }));
  }, [listResponse]);

  const totalRows: number = listResponse?.data?.total ?? 0;

  const openReport = (
    companyLabel: string,
    periodLabel: string,
    readOnly: boolean,
    status?: string,
    reportId?: number,
  ) => {
    if (!reportId) {
      dispatch(setToastMessage({ type: "error", message: "Report ID does not exist in the system" }));
      return;
    }
    navigate(`/mir-reports/view/${reportId}`, {
      state: { company: companyLabel, period: periodLabel, readOnly, status },
    });
  };

  const onGenerate = async (data: FilterValues) => {
    if (!data.company || !data.period) {
      dispatch(setToastMessage({ type: "error", message: "Select a company and period" }));
      return;
    }
    setGenerating(true);
    try {
      // period from DynamicForm date-picker comes as a Date string; normalise to MM-YYYY
      const d = new Date(data.period);
      const period = isNaN(d.getTime())
        ? data.period
        : `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const res = await axiosInstance.post(endPoints.mirReportGenerate, {
        companyId: parseInt(data.company),
        period,
        organisationId: userData?.organisationId,
      });

      const report = res.data?.data;
      if (report) {
        refetch();
        openReport(data.companyName ?? data.company, formatPeriodLabel(period), false, "Draft", report.id);
      }
    } catch (err: any) {
      const conflict = err?.response?.data?.data;
      if (err?.response?.status === 409 && conflict?.existingReportId) {
        dispatch(setToastMessage({
          type: "warning",
          message: "A MIR already exists for this period. Opening existing report.",
        }));
        openReport(
          data.companyName ?? data.company,
          formatPeriodLabel(conflict.period ?? data.period),
          false,
          conflict.existingStatus,
          conflict.existingReportId,
        );
      } else {
        dispatch(setToastMessage({
          type: "error",
          message: err?.response?.data?.message ?? "Failed to generate MIR",
        }));
      }
    } finally {
      setGenerating(false);
    }
  };

  const onActionMap = {
    generate: () =>
      formMethods?.handleSubmit((d) => onGenerate(d as FilterValues))(),
  };

  const columns = getMirColumns((company, period, readOnly, status, reportId) =>
    openReport(company, period, readOnly, status, reportId as number | undefined),
  );

  return (
    <Box sx={pageContainerSx}>
      <Typography variant="h5" sx={pageTitleSx}>
        MIR — Monthly Information Report
      </Typography>

      <Paper sx={generateBarPaperSx}>
        <DynamicForm
          formConfig={MIR_FILTER_FIELDS}
          formMethods={setFormMethods}
          onActionMap={onActionMap}
          variant="iwork"
          disabled={generating}
        />
      </Paper>

      <Box>
        <Typography variant="subtitle1" sx={pastReportsTitleSx}>
          Past Generated Reports
        </Typography>
        <Table
          columns={columns}
          rowData={reports}
          totalRows={totalRows}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          setSort={setSort}
          loading={isLoading || generating}
          onCellClicked={() => {}}
          title=""
          domLayout="autoHeight"
          displaySettingsButton={false}
        />
      </Box>
    </Box>
  );
};

export default MIRReportsPage;
