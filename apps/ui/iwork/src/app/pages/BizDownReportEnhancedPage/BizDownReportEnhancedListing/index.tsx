import { CellClickedEvent } from "ag-grid-community";
import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BIZ_DONE_REPORT_ENHANCED,
  LIST_OF_RECORDS,
  ALL_VALUE,
  TABLE_CONTROLLER_ENTITY_KEY,
  BIZ_DONE_ENHANCED_TOOLBAR_FIELD_NAMES,
  BIZ_DONE_ENHANCED_PERIOD_DATE_NOTE,
} from "../../../constants";
import { TitleContainer } from "../../CompanyPage/CompanyListing/styles";
import {
  BizDownReportEnhancedContainer,
  HiddenSearchWrapper,
  KpiSkeleton,
  KpiSkeletonRow,
  PolicySectionWrapper,
} from "./styles";
import { ToolbarFieldsWrapper } from "./orgScope/styles";
import { bizDoneScopeConfig } from "./orgScope/bizDoneScopeConfig";
import { getOrgScopeAccess } from "../../../Utils/orgScopeAccess";
import { useInsurerBranchViewBy } from "../../../Utils/useInsurerBranchViewBy";
import {
  getColumns,
  getCompanyColumns,
  bizDownReportData,
  insurerField,
  insurerBranchField,
  branchViewByField,
} from "./tableConfig";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton";
import showIcon from "../../../assets/svgs/eye.svg";
import { companyUtilityFunctionFromContactPage } from "../../ContactPage/ContactListing/tableConfig";
import { useSelector, useDispatch } from "react-redux";
import { businessPerformanceFilterConfig, generateSectionTitleConfig } from "../../../components/BusinessPerformance/businessPerformanceConfig";
import {
  endPoints,
  EXPORT_TOAST,
  KPICards,
  Table,
  setToastMessage,
  FeatureKey,
  useLocalization,
  useReportExports,
  useTableController,
  CardBackground,
  ChipRenderer,
  SmartSearch,
  DynamicForm,
  FilterDrawer,
  useFormWatcher,
  SEARCH,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  useBreadcrumbTrail,
  updateUserDefaultConfig,
  BREADCRUMB_KEYS,
  DETAILS_KEYS,
  buildBreadcrumbState,
  DETAILS_LABELS,
  CommonBreadcrumb,
  OrgFinancialFilter,
  useOrgScope,
  RestoredScope,
  timelineToRange,
  getSessionStorageData,
  buildAppliedFilterGroups,
  flattenAppliedFilterGroups,
  summarizeTimeline,
  VIEW_DETAILS,
  buildColumnSettingsPayload,
} from "@ui/ui-lib";
import ReportExportsTray from "../../../components/ReportExportsTray";
import ReportSheetSelectMenu from "../../../components/ReportSheetSelectMenu";
import { useForm } from "react-hook-form";

const validateFilterValue = (value: any): boolean => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === ALL_VALUE
  ) {
    return false;
  }
  return true;
};

// Period form fields for an applied timeline, matching the non-Enhanced Biz
// Done Report's payload shape: a bare whole-FY selection sends financialYear
// alone (no from/to, which would also drag in the default field=createdAt);
// quarter/month/custom-range selections send from/to alone.
const timelinePeriodFields = (
  timeline: Parameters<typeof timelineToRange>[0]
): { from: string; to: string; financialYear: number | "" } => {
  const range = timelineToRange(timeline);
  return range.financialYear !== undefined
    ? { from: "", to: "", financialYear: range.financialYear }
    : { from: range.from ?? "", to: range.to ?? "", financialYear: "" };
};

const BizDownReportEnhancedListing: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { enqueueExport, hasInFlight, openPanel, jobs: exportJobs, unseenCount } =
    useReportExports();

  const prefilledFilterValues = useMemo(() => {
    if (location.state && location.state?.filters) {
      return {
        ...location.state.filters,
        ...(location.state?.fromBrokerageToCollect && {
          from: location.state.from ?? "",
          to: location.state.to ?? "",
          insurerId: {
            label: location.state.insurerName,
            value: location.state.insurerId,
          },
        }),
      };
    }

    if (location.state?.insurerId && location.state?.fromBrokerageToCollect) {
      return {
        from: location.state.from ?? "",
        to: location.state.to ?? "",
        insurerId: {
          label: location.state.insurerName,
          value: location.state.insurerId,
        },
      };
    }

    return undefined;
  }, [location.state]);

  const insurerId = location.state?.insurerId;
  const [skipQuery, setSkipQuery] = useState(true);
  const [sheetModalOpen, setSheetModalOpen] = useState(false);

  const customBrokeragePathParam = location.state?.fromBrokerageToCollect
    ? `&insurerId=${insurerId}`
    : location.state?.businessPerformanceType === "ACTUAL"
      ? `&businessPerformanceType=ACTUAL`
      : location.state?.businessPerformanceType === "NEW_BIZ"
        ? `&businessPerformanceType=SO`
        : location.state?.businessPerformanceType === "RENEWAL"
          ? `&businessPerformanceType=RO`
          : "";

  // Admin-configured predefined filters are seeded server-side under the
  // original page's entity — read the shared key so Enhanced keeps inheriting
  // them, but strip org/company/owner fields defensively (same rationale as
  // RO Enhanced): one viewer's org/company/owner selection must never leak to
  // every user who falls through to this system default.
  const systemSmartSearchDefaultValuesRaw = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.bizDoneReportEntity
      ]
  );
  const systemSmartSearchDefaultValues = useMemo(() => {
    if (!systemSmartSearchDefaultValuesRaw) return systemSmartSearchDefaultValuesRaw;
    const {
      organisationId: _organisationId,
      sbuId: _sbuId,
      verticalId: _verticalId,
      branchId: _branchId,
      userId: _userId,
      companyName: _companyName,
      orgScope: _orgScope,
      ...rest
    } = systemSmartSearchDefaultValuesRaw;
    return rest;
  }, [systemSmartSearchDefaultValuesRaw]);
  // The user's own Save View stays on the isolated entity key — it can carry
  // org scope + toolbar state that must not leak into the original report.
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.bizDoneReportCompaniesEntity
      ]
  );

  const defValues = userSmartSearchDefaultValues || systemSmartSearchDefaultValues || {};

  // Owner defaults to the logged-in user — same convention the Business
  // Performance dashboard's own filters use for this exact field
  // (businessPerformanceConfig's userId/treeSelect), which the original Biz
  // Done Report page's inline SmartSearch never picked up. A saved view's own
  // Owner choice (baseValues.userId) still wins over this default.
  const userData = getSessionStorageData("user");
  const defaultOwner = useMemo(() => {
    const fullName = userData?.firstName
      ? userData.lastName && userData.lastName.trim() !== ""
        ? `${userData.firstName} ${userData.lastName}`
        : userData.firstName
      : "";
    return { value: String(userData?.userId ?? ""), label: fullName };
  }, [userData?.userId, userData?.firstName, userData?.lastName]);

  const buildDefaults = useCallback(
    (source: Record<string, any>) => {
      const { orgScope: _savedOrgScope, ...baseValues } = (source ??
        {}) as Record<string, any>;
      const existingIncomeType = baseValues?.incomeType;
      const normalizedIncomeType =
        existingIncomeType && typeof existingIncomeType === "object"
          ? existingIncomeType
          : { value: ALL_VALUE, label: "All" };

      return {
        ...baseValues,
        incomeType: normalizedIncomeType,
        userId: baseValues?.userId ?? defaultOwner,
        // Multiselect — must start as an array, same as the original page's
        // commonFieldsDefaultValues, or the chip list has nothing to read.
        verticalId: baseValues?.verticalId ?? [],
        // branchViewBy is intentionally NOT seeded here — see the insurer-branch
        // effect below: it only applies once a branch is selected. A saved view's
        // own branchViewBy still rides along via ...baseValues.

        periodMode:
          baseValues?.periodMode ?? { value: "incomeMonth", label: "Income Month" },
        from: baseValues?.from ?? "",
        to: baseValues?.to ?? "",
      };
    },
    [defaultOwner]
  );

  // Seeds the page on load: the user's own saved view wins over the system default.
  const defaultValues = useMemo(
    () => buildDefaults(defValues as Record<string, any>),
    [defValues, buildDefaults]
  );

  // Logged-in user, for the Owner accordion's auto-selected "self" card.
  const currentUser = useMemo(() => {
    if (!userData?.userId) return null;
    const name = [userData?.firstName, userData?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return { id: Number(userData.userId), name: name || String(userData.userId) };
  }, [userData?.userId, userData?.firstName, userData?.lastName]);

  // Org-hierarchy scope (backend-backed). A scope applied before drilling into
  // a record is restored on the way back via navigation state, falling back to
  // a saved view's scope on a fresh page load.
  // Every user starts scoped to their own org; only leadership/superusers may
  // change the Organisation level (or see the IIRM Holdings root summary).
  const { isPrivileged, userOrganisationId } = getOrgScopeAccess();
  const orgLevelKey = bizDoneScopeConfig.levels[0].key;
  const lockedOrgLevels =
    !isPrivileged && userOrganisationId != null ? [orgLevelKey] : undefined;
  const orgScope = useOrgScope({
    config: bizDoneScopeConfig,
    initial: location.state?.scope ?? defValues?.orgScope ?? null,
    baseSelection:
      userOrganisationId != null
        ? { [orgLevelKey]: userOrganisationId }
        : undefined,
    lockedLevels: lockedOrgLevels,
  });

  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const { selectedValues } = useFormWatcher({
    formMethods,
    setSearchTerm: () => { },
    searchFieldName: "bizDownReportEnhanced",
    searchDefaultValues: defaultValues,
  });

  // The period mode now lives on the applied timeline (the org widget's
  // popover owns the toggle) rather than on a drawer form field, so the whole
  // period model — mode, months, resolved range — travels as one object.
  const isBusinessMonthMode =
    orgScope.appliedTimeline?.periodMode === "businessMonth";

  useInsurerBranchViewBy(formMethods, selectedValues?.insurerBranchId);

  // Sync the applied org scope into the hidden organisationId/sbuId/branchId
  // fields — means these ids ride along in `selectedValues` (hence the search
  // string) without any separate merge step, exactly like every other filter
  // on this page. sbuId additionally feeds the drawer's Vertical lookup
  // (dependentField:"sbuId"), which in turn feeds Department.
  // verticalId is deliberately NOT written here: it's the drawer's own field
  // now, and the accordion's Vertical step is hidden, so there is never an
  // applied vertical to sync — writing it would only clobber the user's pick.
  useEffect(() => {
    if (!formMethods) return;
    const applied = orgScope.appliedSelection ?? {};
    formMethods.setValue("organisationId", applied.organisation ?? 0);
    formMethods.setValue("sbuId", applied.unit ?? "");
    formMethods.setValue("branchId", applied.branch ?? "");
  }, [formMethods, orgScope.appliedSelection]);

  // The org-hierarchy widget's period popover is the single source of the
  // report's date range in BOTH modes: timelineToRange resolves financial year
  // / quarter / month / explicit range in income mode, and the business-month
  // span in business mode. One effect covers both — the two used to be
  // separate because the business months lived on a drawer field.
  useEffect(() => {
    if (!formMethods) return;
    const period = timelinePeriodFields(orgScope.appliedTimeline);
    formMethods.setValue("from", period.from);
    formMethods.setValue("to", period.to);
    formMethods.setValue("financialYear", period.financialYear);
  }, [formMethods, orgScope.appliedTimeline]);

  // Portfolio-style flow (mirrors My Client Portfolio's CompanyOverView):
  // the PRIMARY table lists companies (entityType=companySummary); clicking a
  // row's View details reveals that company's policy records in a second
  // table below, scoped by companyId.
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  // commitSmartSearch is called from effects/handlers that captured older
  // renders — the ref always carries the CURRENT selection into the policy
  // table's search payload.
  const selectedCompanyRef = useRef<any | null>(null);
  const policySectionRef = useRef<HTMLDivElement>(null);

  // Companies table + whole-scope KPIs (its kpiDetails are computed from the
  // same filters WITHOUT the company drilldown).
  const {
    rowData: companyRowData,
    totalRows: companyTotalRows,
    currentPage: companyCurrentPage,
    loading: companiesLoading,
    setCurrentPage: setCompanyCurrentPage,
    pageSize: companyPageSize,
    setPageSize: setCompanyPageSize,
    PAGE_SIZE_OPTIONS: COMPANY_PAGE_SIZE_OPTIONS,
    overallData: companiesOverallData,
    setSort: setCompaniesSort,
    setSmartSearch: setCompaniesSmartSearch,
    columnOrder: companyColumnOrder,
    setColumnOrder: setCompanyColumnOrder,
  } = useTableController({
    endpoint: endPoints.policyReportList,
    searchFieldName: "companyName",
    customPathParam:
      "entityType=companySummary&allowAllInsurer=true" +
      customBrokeragePathParam,
    // Companies + KPIs load only once a report is applied (auto on a complete
    // drilldown, or via View Report) — matching RO/SO Enhanced's gating,
    // rather than the original Biz Done Report's immediate-on-load behavior.
    enabled: !skipQuery && orgScope.hasReport,
  });

  // Policy records of the SELECTED company only (searchBy=<companyId> — the
  // policyDetails leg maps a numeric searchBy to policy.companyId).
  const {
    rowData,
    totalRows,
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    PAGE_SIZE_OPTIONS,
    setSort,
    setSmartSearch,
    setColumnOrder,
    columnOrder,
  } = useTableController({
    endpoint: endPoints.policyReportList,
    searchFieldName: "companyName",
    customPathParam:
      "entityType=policyDetails&allowAllInsurer=true" +
      customBrokeragePathParam,
    enabled:
      !skipQuery && orgScope.hasReport && selectedCompany?.companyId != null,
  });

  const [appliedValues, setAppliedValues] = useState<Record<string, any>>({});
  // Mirror of appliedValues for handlers/effects that must read the LATEST
  // committed snapshot without re-subscribing to the state.
  const appliedValuesRef = useRef<Record<string, any>>({});
  // The company scope rides the policy table's searchFieldName key
  // ("companyName" {value: companyId} → &searchBy=<id>), overriding any
  // toolbar company pick — the clicked card wins.
  const scopePolicySearchToCompany = useCallback(
    (values: Record<string, any>, company: any | null) =>
      company?.companyId != null
        ? {
            ...values,
            companyName: {
              value: company.companyId,
              label: company.customerName ?? String(company.companyId),
            },
          }
        : values,
    []
  );
  const commitSmartSearch = (values: Record<string, any>) => {
    setCompaniesSmartSearch(values);
    setSmartSearch(scopePolicySearchToCompany(values, selectedCompanyRef.current));
    appliedValuesRef.current = values;
    setAppliedValues(values);
  };

  // Toolbar Company applies IMMEDIATELY on selection (same UX as SO/RO
  // Enhanced). Read from useFormWatcher's live snapshot (its subscription
  // re-renders this page on every form change), NOT formMethods.watch, whose
  // value only refreshes when something else happens to re-render the page.
  // Only companyName is merged into the last committed snapshot: un-Applied
  // drawer drafts must not leak into the query.
  const toolbarCompany = selectedValues?.companyName as
    | { value: number | string; label: string }
    | undefined;
  useEffect(() => {
    if (skipQuery) return;
    const current = appliedValuesRef.current ?? {};
    const committedCompany = (current as any).companyName?.value;
    const pickedCompany =
      toolbarCompany?.value != null && toolbarCompany?.value !== ""
        ? toolbarCompany.value
        : undefined;
    if (committedCompany === pickedCompany) return;
    const next = { ...current };
    if (pickedCompany != null) next.companyName = toolbarCompany;
    else delete next.companyName;
    commitSmartSearch(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolbarCompany?.value, skipQuery]);

  const handleSelectCompany = useCallback(
    (row: any) => {
      if (row?.companyId == null) return;
      selectedCompanyRef.current = row;
      setSelectedCompany(row);
      setCurrentPage(1);
      setSmartSearch(scopePolicySearchToCompany(appliedValuesRef.current, row));
    },
    [setCurrentPage, setSmartSearch, scopePolicySearchToCompany]
  );

  // Same scroll-into-view UX as My Client Portfolio: the policy section
  // renders after selection, then scrolls under the companies table.
  useEffect(() => {
    if (selectedCompany && policySectionRef.current) {
      const timer = setTimeout(() => {
        policySectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (!formMethods || skipQuery) return;
    commitSmartSearch(formMethods.getValues());
  }, [formMethods, orgScope.appliedSelection, orgScope.appliedTimeline]);

  // Owner accordion → drawer Owner/View-by (one-way). The drawer's
  // userId/owner fields stay the single owner channel into the listing query;
  // a card click just drives them. The auto-selected "self with Manager"
  // state matches the drawer's own defaults (Owner = me, View-by unset →
  // manager), so nothing is committed until the user actually picks a
  // different owner or flips the accordion's view-by.
  useEffect(() => {
    if (!formMethods || skipQuery) return;
    const ownerKey = bizDoneScopeConfig.ownerLevel?.key;
    if (!ownerKey) return;
    const appliedOwnerId = orgScope.appliedSelection?.[ownerKey];
    if (appliedOwnerId == null) return;
    const viewBy = orgScope.appliedOwnerViewBy;
    const currentOwnerRaw = (formMethods.getValues("userId") as any)?.value;
    const currentOwnerId =
      currentOwnerRaw != null && currentOwnerRaw !== ""
        ? Number(currentOwnerRaw)
        : undefined;
    const isSelfOnDefault =
      (currentOwnerId == null || currentOwnerId === currentUser?.id) &&
      appliedOwnerId === currentUser?.id;
    const ownerChanged = !isSelfOnDefault && currentOwnerId !== appliedOwnerId;
    const currentViewBy =
      (formMethods.getValues("owner") as any)?.value || "manager";
    const viewByChanged = currentViewBy !== viewBy;
    if (!ownerChanged && !viewByChanged) return;
    if (ownerChanged) {
      const ownerNode = orgScope.selectedNodes[ownerKey];
      formMethods.setValue("userId", {
        value: String(appliedOwnerId),
        label: ownerNode?.name ?? String(appliedOwnerId),
      });
    }
    if (viewByChanged) {
      formMethods.setValue(
        "owner",
        viewBy === "manager"
          ? { value: "manager", label: "Manager" }
          : { value: "team", label: "Manager + Team" }
      );
    }
    commitSmartSearch(formMethods.getValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgScope.appliedSelection, orgScope.appliedOwnerViewBy, formMethods, skipQuery]);

  // The applied org/period scope in the shape useOrgScope's `initial` expects,
  // so it can be handed straight back on restore (RestoredScope).
  const appliedScope = useMemo<RestoredScope | undefined>(
    () =>
      orgScope.appliedSelection
        ? {
            selection: orgScope.appliedSelection,
            selectedNodes: orgScope.selectedNodes,
            timeline: orgScope.appliedTimeline,
            grouping: orgScope.grouping,
            ownerViewBy: orgScope.appliedOwnerViewBy,
          }
        : undefined,
    [
      orgScope.appliedSelection,
      orgScope.selectedNodes,
      orgScope.appliedTimeline,
      orgScope.grouping,
      orgScope.appliedOwnerViewBy,
    ]
  );

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);

  const breadcrumbState = useMemo(() => {
    const live =
      (formMethods?.getValues?.() as Record<string, any>) ?? selectedValues;
    const filters = Object.keys(live ?? {}).length
      ? live
      : location.state?.filters;
    return {
      ...(filters && { filters }),
      ...(appliedScope && { scope: appliedScope }),
    };
  }, [selectedValues, location.state?.filters, appliedScope, formMethods]);

  const bizDoneCrumb = {
    label: BIZ_DONE_REPORT_ENHANCED,
    path: "/biz-done-report-enhanced",
    key: BREADCRUMB_KEYS.BIZ_DONE_REPORT,
    state: breadcrumbState,
  };

  useBreadcrumbTrail(bizDoneCrumb);

  const bizDoneReportBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [createBreadcrumbEntry(bizDoneCrumb)];

  const onCellClicked = (event: CellClickedEvent) => {
    const currentFilters =
      (formMethods?.getValues?.() as Record<string, any>) ?? selectedValues;
    if (event.colDef.field === "customerName" && event.data?.custId) {
      const destinationConfig = {
        label: event.data?.companyName ?? event.data?.customerName,
        path: `/companies/${event.data?.custId}`,
        key: DETAILS_KEYS.COMPANY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: bizDoneReportBreadcrumb,
        crumb: destinationConfig,
        state: {
          from: "bizDoneReportEnhanced",
          filters: currentFilters ? currentFilters : null,
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
    } else if (event.colDef.field === "iirmPolNo") {
      const destinationConfig = {
        label: DETAILS_LABELS.POLICY,
        path: `/policies/${event.data?.iirmPolNo}`,
        key: DETAILS_KEYS.POLICY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: bizDoneReportBreadcrumb,
        crumb: destinationConfig,
        state: {
          from: "bizDoneReportEnhanced",
          filters: currentFilters ? currentFilters : null,
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
    } else if (event.colDef.field === "opportunityId" && event.data?.opportunityId) {
      const destinationConfig = {
        label: `Opportunity ${event.data.opportunityId}`,
        path: `/opportunities/${event.data.opportunityId}`,
        key: DETAILS_KEYS.SALES_OPPORTUNITY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: bizDoneReportBreadcrumb,
        crumb: destinationConfig,
        state: {
          from: "bizDoneReportEnhanced",
          filters: currentFilters ? currentFilters : null,
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
    }
  };

  const handleRun = () => {
    if (isBusinessMonthMode) {
      // from/to already carry the business-month span: the timeline effect
      // above writes whatever timelineToRange resolved, so there is no second
      // derivation to keep in sync. With no months picked it resolves to the
      // whole FY (financialYear only), which the backend widens for us — the
      // classic page's "select at least one month" toast has no equivalent
      // here because the popover can't produce an unresolvable period.
      // periodMode/businessMonth are stripped in case an older saved view
      // still carries them as form fields; they are timeline state now.
      const { periodMode: _pm, businessMonth: _bm, ...restValues } =
        selectedValues || {};
      commitSmartSearch({ ...restValues, filterByBusinessDate: "true" });
      return;
    }

    const toDate = selectedValues?.to;
    const fromDate = selectedValues?.from;

    const hasToDate = toDate && toDate !== null && toDate !== "" && toDate !== undefined;
    const hasFromDate = fromDate && fromDate !== null && fromDate !== "" && fromDate !== undefined;

    if ((hasToDate && !hasFromDate) || (hasFromDate && !hasToDate)) {
      dispatch(
        setToastMessage("Please select from and to dates before running the search")
      );
      return;
    }

    if (hasFromDate && hasToDate) {
      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);

      if (fromDateObj > toDateObj) {
        dispatch(
          setToastMessage({
            message: "Please provide valid from and to dates",
            severity: "error",
          })
        );
        return;
      }
    }


    const { periodMode: _pm, businessMonth: _bm, ...restValues } = selectedValues || {};
    commitSmartSearch(restValues);
  };

  const handleDownloadReport = React.useCallback(async (sheets: string[]) => {
    try {
      let effectiveValues = selectedValues ?? {};
      if (isBusinessMonthMode) {
        // Same as handleRun: from/to are already the resolved business span.
        effectiveValues = { ...effectiveValues, filterByBusinessDate: "true" };
      }

      const excludedKeys: string[] = ['periodMode', 'businessMonth'];

      const search = effectiveValues && Object.keys(effectiveValues).length > 0
        ? Object.entries(effectiveValues)
        .map(([key, rawValue]) => {
          if (excludedKeys.includes(key)) {
              return null;
          }

          try {
            const value = Array.isArray(rawValue)
              // multiselect may hold {value,label} options — send the ids
              ? rawValue.map((v: any) => (v?.value ?? v)).join(",")
              : typeof rawValue === "object" && rawValue !== null
              ? (rawValue as any).value
              : rawValue;

                if (!validateFilterValue(value)) {
                  return null;
                }

            return `${key}:[${value}]`;
          } catch (error) {
            console.error("Error processing search parameter %s:", key, error);
            return null;
          }
        })
        .filter(Boolean)
        .join(",")
      : "";

      const sheetsParam = sheets && sheets.length ? sheets.join(",") : "policyDetails";
      const queryString = `entityType=policyDetails${
        search ? `&search=${search}` : ""
      }${customBrokeragePathParam}&sheets=${sheetsParam}`;

      // Applied Filters (with labels), assembled exactly as the smart-search UI
      // shows them, so the export's Applied Filters sheet matches the screen.
      // The server writes these verbatim — no id→name resolution.
      const appliedFilters: { filter: string; value: string }[] = [];
      const pushIf = (filter: string, value?: string | null) => {
        if (value && String(value).trim())
          appliedFilters.push({ filter, value: String(value) });
      };
      // Period (financial year / quarter / month / explicit range).
      pushIf("Period", summarizeTimeline(orgScope.appliedTimeline));
      pushIf("Filter by", isBusinessMonthMode ? "Business Month" : "Income Month");
      // Org hierarchy — names live on the scope nodes, not the id-only fields.
      pushIf("Organisation", orgScope.selectedNodes?.organisation?.name);
      pushIf("SBU", orgScope.selectedNodes?.unit?.name);
      pushIf("Vertical", orgScope.selectedNodes?.vertical?.name);
      pushIf("Branch", orgScope.selectedNodes?.branch?.name);
      // Owner (person + view-by).
      pushIf(
        "Owner",
        orgScope.selectedNodes?.owner?.name ?? selectedValues?.userId?.label
      );
      pushIf("View", selectedValues?.owner?.label);
      // Company (toolbar select).
      pushIf("Company", selectedValues?.companyName?.label);
      // Smart-search drawer filters — reuse the exact chip builder, flattened.
      flattenAppliedFilterGroups(
        buildAppliedFilterGroups(
          appliedFilterFieldConfig,
          effectiveValues,
          () => undefined
        )
      ).forEach((r) => appliedFilters.push(r));

      // Fire-and-forget: enqueue a background export and let the user keep
      // working. The Downloads tray polls for completion and surfaces the file
      // when it's ready — no blocking wait, and large reports can't 504.
      await enqueueExport({ queryString, label: "Biz Done Report", appliedFilters });
    } catch (error) {
      console.error("Export error:", error);
      dispatch(setToastMessage(EXPORT_TOAST.START_FAILED));
    }
  }, [
    dispatch,
    enqueueExport,
    selectedValues,
    customBrokeragePathParam,
    isBusinessMonthMode,
    orgScope.appliedTimeline,
  ]);

  // KPIs stay whole-report-scope: the companies query computes kpiDetails
  // from the same filters WITHOUT the company drilldown, so expanding a
  // company never changes the cards.
  const kpis = useMemo(
    () => bizDownReportData(companiesOverallData?.kpiDetails, companyTotalRows),
    [companiesOverallData?.kpiDetails, companyTotalRows]
  );

  // The applied owner + view-by in the drawer's own {value,label} shape, so the
  // seed effect below can carry them through its reset. Same rationale as the
  // org levels it already carries: the owner-sync effect writes these with
  // setValue (which never marks the form dirty), so a reset seeded from
  // defaultValues would snap the picked owner back to defaultOwner — the
  // logged-in user. Undefined until an owner is applied, so the seed string is
  // unchanged for scopes that never reach the owner level.
  const appliedOwnerSeed = useMemo(() => {
    const ownerKey = bizDoneScopeConfig.ownerLevel?.key;
    if (!ownerKey) return undefined;
    const appliedOwnerId = orgScope.appliedSelection?.[ownerKey];
    if (appliedOwnerId == null) return undefined;
    const ownerNode = orgScope.selectedNodes?.[ownerKey] as any;
    return {
      userId: {
        value: String(appliedOwnerId),
        label: ownerNode?.name ?? String(appliedOwnerId),
      },
      owner:
        orgScope.appliedOwnerViewBy === "manager"
          ? { value: "manager", label: "Manager" }
          : { value: "team", label: "Manager + Team" },
    };
  }, [
    orgScope.appliedSelection,
    orgScope.selectedNodes,
    orgScope.appliedOwnerViewBy,
  ]);

  const seededDefaultsRef = useRef<string>();
  useEffect(() => {
    if (!formMethods) return;
    const defValuesToApply = prefilledFilterValues
      ? prefilledFilterValues
      : {
          ...defaultValues,
          ...timelinePeriodFields(orgScope.appliedTimeline),
          // The applied org scope must ride along in the seed: this effect
          // re-fires on the FIRST View Report (the applied timeline changes),
          // and reset() would otherwise wipe the hidden organisationId/sbuId/
          // branchId the org-sync effect just wrote (setValue does not mark
          // the form dirty, so the isDirty guard doesn't catch it) —
          // committing an org-less payload. Mapping mirrors the sync effect.
          // verticalId is absent for the same reason it left the sync effect:
          // it's a drawer field now, so it rides in via ...defaultValues (a
          // saved view's own pick) and must not be reset from the accordion.
          organisationId: orgScope.appliedSelection?.organisation ?? 0,
          sbuId: orgScope.appliedSelection?.unit ?? "",
          branchId: orgScope.appliedSelection?.branch ?? "",
          ...(appliedOwnerSeed ?? {}),
        };
    const serialized = JSON.stringify(defValuesToApply);
    if (seededDefaultsRef.current === serialized) return;
    if (seededDefaultsRef.current !== undefined && formMethods.formState.isDirty) {
      seededDefaultsRef.current = serialized;
      return;
    }
    seededDefaultsRef.current = serialized;
    formMethods.reset(defValuesToApply);

    const { periodMode: _pm, businessMonth: _bm, ...restToCommit } = defValuesToApply;
    // The restored mode comes from the restored TIMELINE, not the form: this
    // effect's own defValuesToApply already carry from/to/financialYear
    // resolved from that timeline, so there is nothing left to derive.
    commitSmartSearch(
      isBusinessMonthMode
        ? { ...restToCommit, filterByBusinessDate: "true" }
        : restToCommit
    );
    setSkipQuery(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formMethods, defaultValues, prefilledFilterValues, orgScope.appliedTimeline, orgScope.appliedSelection, appliedOwnerSeed]);

  const { localizationData } = useLocalization();
  const columns = useMemo(
    () => getColumns(localizationData?.data),
    [localizationData?.data]
  );
  const companyColumns = useMemo(
    () => getCompanyColumns(localizationData?.data),
    [localizationData?.data]
  );

  // "View details" action per company row — same component/flow as My Client
  // Portfolio's CompanyOverView.
  const CompanyActionButtonRenderer = useCallback(
    (params: any) => (
      <ActionButton
        onClick={() => handleSelectCompany(params.data)}
        buttonText={VIEW_DETAILS}
        imageSrc={showIcon}
        imageStyles={{ width: "20px", height: "20px" }}
        customStyles={{ gap: "10px", border: "none" }}
      />
    ),
    [handleSelectCompany]
  );

  // Customer Name navigates to the company details page; any other
  // non-button cell click selects the row in place (portfolio behavior).
  const onCompanyCellClicked = useCallback(
    (event: CellClickedEvent) => {
      const target = event?.event?.target as HTMLElement | null;
      const clickedInsideButton =
        !!target?.closest("button") || !!target?.closest('[role="button"]');
      if (clickedInsideButton) return;
      // Authoritative form snapshot (see breadcrumbState) so the last-selected
      // API-backed filters are carried along instead of a stale watch value.
      const currentFilters =
        (formMethods?.getValues?.() as Record<string, any>) ?? selectedValues;
      if (event.colDef.field === "customerName" && event.data?.companyId != null) {
        const destinationConfig = {
          label: event.data?.customerName,
          path: `/companies/${event.data.companyId}`,
          key: DETAILS_KEYS.COMPANY,
        };
        navigate(destinationConfig.path, {
          state: buildBreadcrumbState({
            breadcrumbs: bizDoneReportBreadcrumb,
            crumb: destinationConfig,
            state: {
              from: "bizDoneReportEnhanced",
              filters: currentFilters ? currentFilters : null,
            },
          }),
        });
        return;
      }
      handleSelectCompany(event.data);
    },
    [handleSelectCompany, navigate, bizDoneReportBreadcrumb, selectedValues, formMethods]
  );

  const companyGridComponents = useMemo(
    () => ({ ChipRenderer, ActionButton: CompanyActionButtonRenderer }),
    [CompanyActionButtonRenderer]
  );

  const policyGridComponents = useMemo(() => ({ ChipRenderer }), []);

  
  const hiddenOrgFields = useMemo(
    () =>
      ["organisationId", "sbuId", "branchId"].map((key) => ({
        key,
        name: key,
        type: "text",
      })),
    []
  ) as typeof businessPerformanceFilterConfig;

  // Everything else from the original page's filter set, minus what now
  // lives in the toolbar (Company, Owner) or the org-hierarchy widget
  // (Organisation/SBU/Branch + the Income Month period fields +
  // 'owner', the Manager / Manager + Team view-by — the accordion's own
  // toggle drives it now, so a drawer copy would fight it).
  // Vertical is NOT in that list: the accordion's Vertical step is hidden
  // (see OrgFinancialFilter's visibleLevels slice), so it survives here as a
  // plain drawer filter — same multiselect config the original page uses,
  // and it keeps its natural slot immediately before Department.
  const filteredSmartSearchConfig = useMemo(() => {
    return businessPerformanceFilterConfig
      .filter(
        field => ![
          'organisationId', 'sbuId', 'branchId',
          'userId', 'insurerId', 'owner',
          'financialYear', 'quarter', 'month', 'from', 'to',
          'smartSearch_period',
        ].includes(field.key)
      )
      // Add a "Rewards" option to Income Type (Biz Done only). Rewards are
      // unioned into the main listing by the API (no separate table/KPIs).
      .map((field) =>
        field.key === 'incomeType'
          ? {
              ...field,
              options: [
                ...((field.options as any[]) ?? []),
                { value: 'rewards', label: 'Rewards' },
              ],
            }
          : field
      );
  }, []);

  const ownerField = useMemo(
    () => businessPerformanceFilterConfig.find((field) => field.key === "userId"),
    []
  );


  // Every field this page registers on the shared form — the hidden
  // SmartSearch mounts all of these; the toolbar/drawer below render visible
  // subsets bound to the same formMethods.
  const allFieldsConfig = useMemo(
    () => [
      ...hiddenOrgFields,
      {
        key: "companyName",
        name: "companyName",
        label: "Company name",
        type: "selectFieldByApi",
        gridColumn: 3.2,
        apiDependencies: {
          endPoint: endPoints.companiesListInSelectField,
          utilityFunction: (data: any) => companyUtilityFunctionFromContactPage(data),
        },
        placeholder: "Search company",
      },
      ownerField,
      ...filteredSmartSearchConfig,
      generateSectionTitleConfig("Insurer"),
      insurerField(location?.state?.fromBrokerageToCollect ? true : false),
      insurerBranchField(),
      branchViewByField(),
      generateSectionTitleConfig("Policy"),
      {
        key: "groupCompanyId",
        name: "groupCompanyId",
        label: "Group company",
        type: "selectFieldByApi",
        gridColumn: 3.2,
        apiDependencies: {
          endPoint: endPoints.parentCompaniesList,
          utilityFunction: (data: any) =>
            (data?.data?.data ?? []).map((c: any) => ({
              value: c.id,
              label: c.companyName,
            })),
        },
        placeholder: "Search group company",
      },
      {
        key: "policyType",
        name: "policyType",
        label: "Policy type",
        type: "select",
        gridColumn: 3.2,
        apiDependencies: {
          endPoint: endPoints.lookUpByName("POLICY_TYPE"),
          isSmartSearch: true,
        },
        placeholder: "Select policy type",
      },
      {
        key: "brokerId",
        name: "brokerId",
        label: "Broker agent",
        type: "selectFieldByApi",
        gridColumn: 3.2,
        apiDependencies: {
          endPoint: endPoints.brokersList,
          utilityFunction: (data: any) =>
            (data?.data?.data ?? []).map((b: any) => ({
              value: b.id,
              label: b.displayName || b.brokerName,
            })),
        },
        placeholder: "Search broker agent",
      },
    ] as typeof businessPerformanceFilterConfig,
    [hiddenOrgFields, ownerField, filteredSmartSearchConfig, location?.state?.fromBrokerageToCollect]
  );

  const toolbarFieldConfig = useMemo(
    () =>
      allFieldsConfig.filter((field: any) =>
        BIZ_DONE_ENHANCED_TOOLBAR_FIELD_NAMES.includes(field.name)
      ),
    [allFieldsConfig]
  );

  const drawerFieldConfig = useMemo(
    () =>
      allFieldsConfig
        .filter((field: any) => !BIZ_DONE_ENHANCED_TOOLBAR_FIELD_NAMES.includes(field.name))
        .filter(
          // Owner (userId) stays registered on the hidden SmartSearch form —
          // the org-scope accordion drives it directly (see the effect above)
          // — but is excluded here so it doesn't also render as a duplicate,
          // conflicting Owner control in the drawer.
          (field: any) =>
            !["organisationId", "sbuId", "branchId", "userId"].includes(field.name)
        )
        .map((field: any) => ({ ...field, gridColumn: 12 })),
    [allFieldsConfig]
  );

  const appliedFilterFieldConfig = useMemo(
    () =>
      drawerFieldConfig
        .filter(
          (field: any) =>
            field.name && field.type !== "title" && field.type !== "segmentedcontrol"
        )
        .map((field: any) => ({ name: field.name, label: field.label })),
    [drawerFieldConfig]
  );

  const removeFilterValue = (fieldName: string, itemValue?: any) => {
    if (!formMethods) return;
    const current = formMethods.getValues(fieldName);
    const next = Array.isArray(current)
      ? current.filter((v: any) => v !== itemValue)
      : null;
    formMethods.setValue(fieldName, next);
    commitSmartSearch(formMethods.getValues());
  };


  const appliedFilterGroups = useMemo(
    () =>
      buildAppliedFilterGroups(appliedFilterFieldConfig, appliedValues, removeFilterValue),
    [appliedFilterFieldConfig, appliedValues]
  );

  // Reset must only clear the drawer's own fields, not the whole form —
  // formMethods.reset(defaultValues) would also wipe the always-visible
  // toolbar's Company + Owner selections since they live on the same
  // formMethods instance (same rationale as RO Enhanced's onReset).
  const onReset = (options?: { successMessage?: string }) => {
    if (!formMethods) return;
    // System default only, never the saved view — otherwise a view's own group
    // company / company name can't be cleared. Explicit empty value (shape
    // preserving) rather than undefined, since reset() leaves a controlled
    // field untouched when its key is absent and the chips would keep showing
    // the old value after the query already dropped it.
    const systemDefaults = buildDefaults(
      systemSmartSearchDefaultValues || {}
    ) as Record<string, any>;
    const current = formMethods.getValues();
    const next = { ...current };
    drawerFieldConfig.forEach((field: any) => {
      next[field.name] =
        systemDefaults[field.name] !== undefined
          ? systemDefaults[field.name]
          : Array.isArray(current[field.name])
            ? []
            : "";
    });
    formMethods.reset(next);
    commitSmartSearch(next);

    const { userId: _userId, owner: _owner, ...persistedValues } = next;
    dispatch(
      updateUserDefaultConfig({
        entityKey: TABLE_CONTROLLER_ENTITY_KEY.bizDoneReportCompaniesEntity,
        // Persist the org scope alongside the cleared drawer filters — Reset
        // doesn't touch org scope, but updateUserDefaultConfig replaces the
        // entity's whole saved blob, so omitting it here would wipe out
        // whatever org scope Save View had previously persisted (matches the
        // shape used by this page's own Save View, line ~1487).
        selectedFilterValues: { ...persistedValues, orgScope: appliedScope },
        columns: buildColumnSettingsPayload(companyColumnOrder),
        // Only "Clear all" passes this; the drawer Reset and every other
        // caller leave it undefined and keep the default toast.
        ...(options?.successMessage && {
          successMessage: options.successMessage,
        }),
      }) as any // untyped useDispatch can't accept a thunk action
    );
    navigate(".", {
      replace: true,
      state: {
        breadcrumbs: getBreadcrumbsFromState(location.state),
      },
    });
  };

  // Selecting an owner must update ONLY the policy-report listing, never the
  // Organisation / SBU / Branch cards above — those stay at their hierarchy
  // totals as you drill. So we deliberately do NOT feed the applied owner into
  // the widget's aggregates: passing userId there made the backend re-scope
  // org/SBU/branch AS that owner, collapsing every card to that person's
  // number the instant View Report was clicked — and those are the very cards
  // you picked from. The owner accordion carries its own Manager/Team view-by
  // via the widget's ownerAggregateParams, independent of this. Same as
  // Client Portfolio.
  const orgWidgetExtraParams = useMemo(() => ({}), []);

  return (
    <BizDownReportEnhancedContainer>
      <ReportExportsTray />
      <ReportSheetSelectMenu
        open={sheetModalOpen}
        onClose={() => setSheetModalOpen(false)}
        onGenerate={(sheets) => handleDownloadReport(sheets)}
      />
      {existingBreadcrumbs?.length > 1 ? (
        <CommonBreadcrumb />
      ) : (
        <TitleContainer variant="h1">{BIZ_DONE_REPORT_ENHANCED}</TitleContainer>
      )}

      {/* Hidden SmartSearch: wires formMethods into the query layer. The
          visible fields render in the toolbar (Company/Owner) and the filter
          drawer via the shared FilterDrawer. */}
      <HiddenSearchWrapper aria-hidden>
        <CardBackground>
          <SmartSearch
            searchFormConfig={allFieldsConfig}
            searchDefaultValues={defaultValues}
            searchFormMethods={setFormMethods}
            selectedValues={selectedValues}
            onReset={onReset}
            formMethods={formMethods}
            searchFieldName="BizDoneReportEnhanced"
            placeholder={SEARCH}
            enableSmartSearch={true}
            onRunFilters={handleRun}
            disableSearch={true}
            hideSearch={true}
            runThePeriodFilterByDefault={false}
          />
        </CardBackground>
      </HiddenSearchWrapper>

      {/* Org accordion is locked for EVERY role — the org is changed via the
          period popover's Organisation filter instead (selectable only for
          leadership/superusers). The useOrgScope-level lock stays role-based
          so the popover CAN move the org for privileged users. */}
      <OrgFinancialFilter
        config={bizDoneScopeConfig}
        api={orgScope}
        extraAggregateParams={orgWidgetExtraParams}
        hideRootSummary={!isPrivileged}
        lockedLevels={[orgLevelKey]}
        popoverOrgFilter={{ disabled: !isPrivileged }}
        // Biz Done is the only Enhanced page with an income/business-date
        // choice, so it is the only one that turns the toggle on.
        periodModes
        periodDateNote={BIZ_DONE_ENHANCED_PERIOD_DATE_NOTE}
      />

      {/* Table + KPIs show only for a report matching the CURRENT org scope:
          nothing until View Report is clicked, and they collapse again the
          moment any card changes, so a stale scope can never be misread as
          live data. The filter's own "Scope changed" hint says what to do. */}
      {orgScope.hasReport && !orgScope.isStale && (
      <>
      {orgScope.hasReport &&
        (companiesLoading && !Object.keys(companiesOverallData ?? {}).length ? (
          <KpiSkeletonRow>
            {[0, 1, 2, 3].map((i) => (
              <KpiSkeleton key={i} variant="rounded" height={92} />
            ))}
          </KpiSkeletonRow>
        ) : (
          <KPICards data={kpis} localization={localizationData?.data} />
        ))}

      {/* Companies first (portfolio-style): the toolbar/drawer/export live on
          this primary table; View details on a row reveals that company's
          policy records below. */}
      <Table
        quickFilters={{
          quickFieldsContent: (
            <ToolbarFieldsWrapper>
              <DynamicForm
                formConfig={toolbarFieldConfig}
                existingMethods={formMethods}
                externalMethods={formMethods}
                enableSmartSearch
                renderOnlyFields
              />
            </ToolbarFieldsWrapper>
          ),
          filterButtonAriaLabel: "Biz done report filters",
          filterButtonTestId: "biz-done-report-enhanced-filter-button",
          drawerTitle: "Biz done report filters",
          drawerWidth: "420px",
          renderFilterContent: (close: () => void) => (
            <FilterDrawer
              formConfig={drawerFieldConfig}
              defaultValues={defaultValues}
              existingMethods={formMethods}
              resetTestId="biz-done-report-enhanced-filter-reset"
              applyTestId="biz-done-report-enhanced-filter-apply"
              onReset={() => {
                onReset();
                close();
              }}
              onApply={() => {
                handleRun();
                close();
              }}
            />
          ),
          appliedFilters: {
            groups: appliedFilterGroups,
            // Clear all reuses onReset but surfaces a distinct toast. Passing
            // onReset directly would forward the click event as its options arg.
            onClearAll: () =>
              onReset({ successMessage: "Filters updated successfully" }),
          },
        }}
        columns={companyColumns}
        rowData={companyRowData}
        totalRows={companyTotalRows}
        currentPage={companyCurrentPage}
        title="Companies"
        setCurrentPage={setCompanyCurrentPage}
        loading={companiesLoading}
        pageSize={companyPageSize}
        pageSizeOptions={COMPANY_PAGE_SIZE_OPTIONS}
        setPageSize={setCompanyPageSize}
        onCellClicked={onCompanyCellClicked}
        components={companyGridComponents}
        primaryActionLabel={hasInFlight ? "Preparing report…" : "Generate Report"}
        onPrimaryActionClick={() => {
          if (hasInFlight) {
            dispatch(setToastMessage(EXPORT_TOAST.ALREADY_IN_PROGRESS));
            return;
          }
          setSheetModalOpen(true);
        }}
        primaryActionDisabled={hasInFlight}
        primaryActionPermission={
          FeatureKey.DOWNLOAD_BUSINESS_PERFORMANCE_REPORT
        }
        secondaryActionLabel={
          exportJobs.length
            ? `Downloads${unseenCount > 0 ? ` (${unseenCount})` : ""}`
            : undefined
        }
        onSecondaryActionClick={openPanel}
        secondaryActionRight
        setSort={setCompaniesSort}
        setColumnOrder={setCompanyColumnOrder}
        columnOrder={companyColumnOrder}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.bizDoneReportCompaniesEntity}
        // Save View needs the applied scope alongside the form fields so it can
        // reproduce the whole screen on restore. Only read inside Table's save
        // handler, so a fresh object per render costs nothing.
        selectedFilterValues={{ ...selectedValues, orgScope: appliedScope }}
      />

      {/* Selected company's policy records — same columns/click behavior the
          page's single table had, now scoped by companyId. */}
      {selectedCompany && (
        <PolicySectionWrapper ref={policySectionRef}>
          <Table
            columns={columns}
            rowData={rowData}
            totalRows={totalRows}
            currentPage={currentPage}
            title={`${LIST_OF_RECORDS} - ${
              selectedCompany.customerName ?? ""
            }`}
            setCurrentPage={setCurrentPage}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            setPageSize={setPageSize}
            onCellClicked={onCellClicked}
            components={policyGridComponents}
            setSort={setSort}
            setColumnOrder={setColumnOrder}
            columnOrder={columnOrder}
            // Records table owns bizDoneReportEnhancedEntity for COLUMNS ONLY:
            // it has no filter bar, so its Save View posts an empty filterJson.
            // The page's filters live on bizDoneReportCompaniesEntity.
            entityKey={TABLE_CONTROLLER_ENTITY_KEY.bizDoneReportEnhancedEntity}
          />
        </PolicySectionWrapper>
      )}
      </>
      )}
    </BizDownReportEnhancedContainer>
  );
};

export default BizDownReportEnhancedListing;
