import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import {
  endPoints,
  EXPORT_TOAST,
  EXPORT_REPORT_TYPE,
  Table,
  SmartSearch,
  CardBackground,
  useFormWatcher,
  useApiQuery,
  useReportExports,
  useLocalization,
  setToastMessage,
  SEARCH,
  FeatureKey,
} from "@ui/ui-lib";
import { TitleContainer } from "../../CompanyPage/CompanyListing/styles";
import ReportExportsTray from "../../../components/ReportExportsTray";
import { TABLE_CONTROLLER_ENTITY_KEY } from "../../../constants";
import { getColumns } from "./tableConfig";
import TargetActionsCell from "./TargetActionsCell";
import {
  BusinessTargetReportContainer,
  FilterCardWrapper,
} from "./styles";
import {
  businessTargetFilterConfig,
  businessTargetFilterDefaults,
} from "./filterConfig";
import {
  ENTITY_TYPE_OPTIONS,
  KPI_OPTIONS,
} from "../AddEditTarget/formConfig";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const MONTH_PICKER_FORMAT = "MMM YYYY";
const SEARCH_FIELD_NAME = "BusinessTargetReport";

// Same reportType/endpoints wiring the BizDone tray uses, scoped to the
// BUSINESS_TARGET job queue so its exports stay isolated.
const exportEndpoints = {
  enqueue: endPoints.businessTargetReportExport,
  status: endPoints.businessTargetReportExportStatus,
  list: endPoints.businessTargetReportExports,
  download: endPoints.businessTargetReportExportDownload,
};

// Collapse a committed filter snapshot into the backend's query params. Mirrors
// BizDone's handling: multiselect arrays send a CSV of ids, {value,label}
// options send their value, month collapses "MMM YYYY" → "YYYY-MM".
const toCsv = (value: any): string =>
  Array.isArray(value)
    ? value.map((v: any) => v?.value ?? v).filter((v) => v !== "").join(",")
    : typeof value === "object" && value !== null
      ? String(value.value ?? "")
      : String(value ?? "");

const buildFilterParams = (values: Record<string, any>): URLSearchParams => {
  const params = new URLSearchParams();
  const setIf = (key: string, raw: any) => {
    const v = toCsv(raw);
    if (v && v !== "") params.set(key, v);
  };
  setIf("organisationId", values.organisationId);
  setIf("sbuId", values.sbuId);
  setIf("verticalId", values.verticalId);
  setIf("userId", values.userId);
  setIf("financialYear", values.financialYear);
  if (values.month) {
    const m = dayjs(values.month, MONTH_PICKER_FORMAT);
    if (m.isValid()) params.set("month", m.format("YYYY-MM"));
  }
  setIf("entityType", values.entityType);
  setIf("kpi", values.kpi);
  return params;
};

// Human-readable applied filters for the export's "Applied Filters" sheet —
// same {filter,value}[] shape the other reports send. Labels come from the
// stored {value,label} option (org/user selects) or the static option lists.
const optionLabel = (
  options: { value: string; label: string }[],
  raw: any
): string => {
  if (raw === null || raw === undefined || raw === "") return "";
  if (typeof raw === "object") return raw.label ?? String(raw.value ?? "");
  return options.find((o) => o.value === raw)?.label ?? String(raw);
};

const buildAppliedFilters = (
  values: Record<string, any>
): { filter: string; value: string }[] => {
  const out: { filter: string; value: string }[] = [];
  const push = (filter: string, value?: string | null) => {
    if (value && String(value).trim()) out.push({ filter, value: String(value) });
  };
  const labelOf = (raw: any): string =>
    Array.isArray(raw)
      ? raw.map((v: any) => v?.label ?? v?.value ?? v).join(", ")
      : typeof raw === "object" && raw !== null
        ? raw.label ?? raw.value ?? ""
        : raw ?? "";
  push("Organisation", labelOf(values.organisationId));
  push("SBU", labelOf(values.sbuId));
  push("Vertical", labelOf(values.verticalId));
  push("Team Member", labelOf(values.userId));
  push("Financial Year", labelOf(values.financialYear));
  if (values.month) {
    const m = dayjs(values.month, MONTH_PICKER_FORMAT);
    push("Month", m.isValid() ? m.format("YYYY-MM") : values.month);
  }
  push("Entity Type", optionLabel(ENTITY_TYPE_OPTIONS, values.entityType));
  push("KPI", optionLabel(KPI_OPTIONS, values.kpi));
  return out;
};

const BusinessTargetReport: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { localizationData } = useLocalization();

  const {
    enqueueExport,
    hasInFlight,
    openPanel,
    jobs: exportJobs,
    unseenCount,
  } = useReportExports({
    reportType: EXPORT_REPORT_TYPE.BUSINESS_TARGET,
    label: "Business Targets Report",
    endpoints: exportEndpoints,
  });

  // SmartSearch owns the form instance and hands it back via searchFormMethods;
  // useFormWatcher exposes the live applied snapshot (selectedValues) + Reset —
  // same visible-search wiring as ContactListing.
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  // The visible search box searches team member names server-side. With
  // enableManualSearch on the SmartSearch below, typing does not touch the form:
  // the search icon / Enter pushes the value into SEARCH_FIELD_NAME, which is
  // where useFormWatcher reads it from and hands it to us. So no debounce is
  // needed — a commit is already an explicit user action.
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedValues, handleReset } = useFormWatcher({
    formMethods: formMethods as any,
    setSearchTerm,
    searchFieldName: SEARCH_FIELD_NAME,
    searchDefaultValues: businessTargetFilterDefaults as any,
  });

  // The committed snapshot that actually drives the query — set from
  // selectedValues on "Run filters", so the list/export react to Apply.
  const [appliedValues, setAppliedValues] = useState<Record<string, any>>(
    businessTargetFilterDefaults
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  // Server-side sort: the Table emits [{colId, sort}]; we forward the first
  // (single-column) as "field:dir". Cell clicks are a no-op (aggregated rows
  // carry no editable target id).
  const [sort, setSort] = useState<{ colId: string; sort: "asc" | "desc" }[]>(
    []
  );
  // Column show/hide + order comes from the Table's own "Table settings" gear
  // via setColumnOrder (same wiring as BizDone Enhanced's companyColumnOrder).
  const [columnOrder, setColumnOrder] = useState<any[]>([]);

  const columns = useMemo(
    () => getColumns(localizationData?.data),
    [localizationData?.data]
  );

  // The currently visible columns, in [{key,label}] shape — fed to the export
  // so the Excel columns match the on-screen columns. Falls back to the full
  // column set before the Table has synced its column order. Deliberately NOT
  // sent on the list fetch: show/hide is client-only and the list response is
  // column-agnostic, so including it would only churn the query key.
  const visibleColumns = useMemo(() => {
    const source = columnOrder && columnOrder.length ? columnOrder : columns;
    return source
      .filter((col: any) => !col.hide && col.field !== "actions")
      .map((col: any) => ({ key: col.field, label: col.headerName }));
  }, [columnOrder, columns]);

  const columnsParam = useMemo(
    () => JSON.stringify(visibleColumns),
    [visibleColumns]
  );

  const listUrl = useMemo(() => {
    const params = buildFilterParams(appliedValues);
    params.set("page", String(currentPage));
    params.set("limit", String(pageSize));
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (sort[0]?.colId) params.set("sort", `${sort[0].colId}:${sort[0].sort}`);
    return `${endPoints.businessTargetReportList}?${params.toString()}`;
  }, [appliedValues, currentPage, pageSize, searchTerm, sort]);

  const { data: listResponse, isFetching } = useApiQuery({
    url: listUrl,
    queryKey: ["businessTargetReportList", listUrl],
  });

  // A new term is a new result set — don't stay on page 7 of the old one.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const rowData = listResponse?.data?.rows ?? [];
  const totalRows = listResponse?.data?.total ?? 0;

  // The row already carries id/userId/kpi/typeOfTarget/valueOfTarget, which is
  // exactly the shape AddEditTarget rebuilds its defaultValues from — so the
  // edit form opens prefilled with no extra fetch.
  const handleEditTarget = (row: Record<string, any>) => {
    navigate("/business-targets/edit", { state: { target: row } });
  };

  const onApply = () => {
    setAppliedValues(selectedValues ?? businessTargetFilterDefaults);
    setCurrentPage(1);
  };

  const onReset = () => {
    handleReset();
    setAppliedValues(businessTargetFilterDefaults);
    setCurrentPage(1);
  };

  const handleDownloadReport = async () => {
    if (hasInFlight) {
      dispatch(setToastMessage(EXPORT_TOAST.ALREADY_IN_PROGRESS));
      return;
    }
    try {
      const params = buildFilterParams(appliedValues);
      // Same visible-column set the on-screen list uses, so the Excel columns
      // match exactly, and the same search term so the rows do too.
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      params.set("columns", columnsParam);
      const appliedFilters = buildAppliedFilters(appliedValues);
      // The search narrows the exported rows, so the sheet has to say so —
      // otherwise the Excel silently holds a subset its own filter list
      // does not account for.
      if (searchTerm.trim()) {
        appliedFilters.push({ filter: "Search", value: searchTerm.trim() });
      }
      await enqueueExport({
        queryString: params.toString(),
        label: "Business Targets Report",
        appliedFilters,
      });
    } catch (error) {
      dispatch(setToastMessage(EXPORT_TOAST.START_FAILED));
    }
  };

  return (
    <BusinessTargetReportContainer>
      <ReportExportsTray
        reportType={EXPORT_REPORT_TYPE.BUSINESS_TARGET}
        label="Business Targets Report"
        endpoints={exportEndpoints}
      />
      <TitleContainer variant="h1">Business Targets</TitleContainer>

      <FilterCardWrapper>
        <CardBackground>
          <SmartSearch
            searchFormConfig={businessTargetFilterConfig}
            searchDefaultValues={businessTargetFilterDefaults as any}
            searchFormMethods={setFormMethods}
            selectedValues={selectedValues}
            onReset={onReset}
            formMethods={formMethods as any}
            searchFieldName={SEARCH_FIELD_NAME}
            placeholder={SEARCH}
            enableSmartSearch={true}
            // Commit on the search icon or Enter rather than per keystroke,
            // matching InsurerTable / InsurerContactListing.
            enableManualSearch={true}
            onRunFilters={onApply}
          />
        </CardBackground>
      </FilterCardWrapper>

      <Table
        columns={columns}
        rowData={rowData}
        totalRows={totalRows}
        onCellClicked={() => undefined}
        setSort={setSort}
        currentPage={currentPage}
        title="Targets"
        setCurrentPage={setCurrentPage}
        loading={isFetching}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        primaryActionLabel="Add Target"
        onPrimaryActionClick={() => navigate("/business-targets/new")}
        primaryActionPermission={FeatureKey.MANAGE_BUSINESS_TARGET}
        components={{
          ActionButton: (props: any) => (
            <TargetActionsCell {...props} onEdit={handleEditTarget} />
          ),
        }}
        // Two distinct actions, same split every other export page uses:
        // tertiary queues the report, secondary opens the downloads drawer and
        // is absent until there is something in it.
        tertiaryActionLabel={
          hasInFlight ? "Preparing report…" : "Generate Report"
        }
        onTertiaryActionClick={handleDownloadReport}
        tertiaryActionDisabled={hasInFlight}
        tertiaryActionPermission={FeatureKey.EXPORT_BUSINESS_TARGET}
        secondaryActionLabel={
          exportJobs.length
            ? `Downloads${unseenCount > 0 ? ` (${unseenCount})` : ""}`
            : undefined
        }
        onSecondaryActionClick={openPanel}
        secondaryActionRight
        secondaryActionPermission={FeatureKey.EXPORT_BUSINESS_TARGET}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.businessTargetReportEntity}
        columnOrder={columnOrder}
        setColumnOrder={setColumnOrder}
        selectedFilterValues={selectedValues}
      />
    </BusinessTargetReportContainer>
  );
};

export default BusinessTargetReport;
