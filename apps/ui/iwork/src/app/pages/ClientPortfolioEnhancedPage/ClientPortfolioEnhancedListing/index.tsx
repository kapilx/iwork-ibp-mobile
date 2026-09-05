// Client Portfolio Enhanced — a duplicate of My Client Portfolio
// (ClientPortfolio/CompanyOverView) rebuilt on the Enhanced filter
// architecture that SO / RO / Biz Done Enhanced share:
//
//   1. a hidden SmartSearch that owns the react-hook-form instance and wires
//      it into the query layer,
//   2. OrgFinancialFilter (Organisation -> SBU -> Vertical|Branch -> Owner) +
//      its period popover as the ONLY org/owner/period channel,
//   3. the Table's quickFilters slot rendering an always-visible toolbar
//      (Company) plus an additional-filters drawer for everything else, with
//      applied-filter chips,
//   4. an isolated Save View entity key so nothing leaks into the original
//      screen's saved view.
//
// The original My Client Portfolio page is untouched: this file, its
// tableConfig and its styles are copies, and the drill-down sections
// (CompanyPolicies / CompanyOpportunities / CompanyServiceScore) are reused
// as-is because they are entirely prop-driven.
//
// Backend: no changes. /policy/portfolio/companies already reads the org
// hierarchy from the `search` string (organisationId/sbuId/verticalId/
// branchId), the owner from the `ownerId` + `viewBy` query params, and the
// period from `field`/`from`/`to`/`financialYear` — and useTableController
// hoists exactly those keys out of smartSearch into top-level query params.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { CellClickedEvent } from "ag-grid-community";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  SmartSearch,
  DynamicForm,
  FilterDrawer,
  useTableController,
  endPoints,
  useFormWatcher,
  useLocalization,
  KPICards,
  Table,
  ChipRenderer,
  FormFieldConfig,
  formatCurrencyByLocalization,
  CommonBreadcrumb,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  useBreadcrumbTrail,
  buildBreadcrumbState,
  buildAppliedFilterGroups,
  updateUserDefaultConfig,
  OrgFinancialFilter,
  useOrgScope,
  RestoredScope,
  timelineToRange,
  allLevels,
  BREADCRUMB_KEYS,
  DETAILS_KEYS,
  SEARCH,
  VIEW_DETAILS,
  COMPANY_OVERVIEW,
  COMPANY_OVERVIEW_SUBTITLE,
  buildColumnSettingsPayload,
} from "@ui/ui-lib";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton";
import {
  CardBackground,
  CellContainer,
  CompanyListingContainer,
  HiddenSearchWrapper,
  KpiSection,
  KpiSkeleton,
  KpiSkeletonRow,
  PolicyTableContainer,
  PremiumSpan,
  StyledCellPremium,
  TitleContainer,
} from "./styles";
import { ToolbarFieldsWrapper } from "./orgScope/styles";
import {
  getColumns,
  kpisData,
  tableSearchConfig,
  clientPortfolioEnhancedBreadcrumbs,
  PORTFOLIO_COMPANY_TYPE_FILTER_KEY,
  COMPANY_TYPE_LOOKUP_NAME,
} from "./tableConfig";
import { clientPortfolioScopeConfig } from "./orgScope/clientPortfolioScopeConfig";
import { getOrgScopeAccess } from "../../../Utils/orgScopeAccess";
import { PolicySearchConfig } from "../../PolicyPage/Constants";
import {
  CommonFieldsconfig,
  GeneratesmartSearchTitleConfig,
} from "../../../Utils/smartSearchConfig";
import CompanyPolicies from "../../ClientPortfolio/CompanyPolicies";
import CompanyOpportunities from "../../ClientPortfolio/CompanyOpportunities";
import CompanyServiceScore from "../../ClientPortfolio/CompanyServiceScore";
import showIcon from "../../../assets/svgs/eye.svg";
import {
  CLIENT_PORTFOLIO_ENHANCED,
  CLIENT_PORTFOLIO_ENHANCED_TOOLBAR_FIELD_NAMES,
  CLIENT_PORTFOLIO_ENHANCED_PERIOD_DATE_NOTE,
  TABLE_CONTROLLER_ENTITY_KEY,
} from "../../../constants";

// The form's own search box is unused on this page — Company is a real
// API-backed select in the toolbar instead. A dummy searchFieldName keeps
// useTableController/useFormWatcher from diverting the `companyName` field
// into `searchBy` (it must ride the `search` string, where the portfolio
// endpoint maps it to company.id).
const SEARCH_FIELD_NAME = "clientPortfolioEnhanced";

export const soRoPremiumCell = (premium: string, countValue: string) => (
  <CellContainer>
    <PremiumSpan>{premium}</PremiumSpan>
    <StyledCellPremium>{countValue}</StyledCellPremium>
  </CellContainer>
);

const extractServiceScoreValue = (val: any): string | undefined => {
  if (!val) return undefined;
  if (typeof val === "string") return val || undefined;
  if (typeof val === "object" && typeof val.value === "string") {
    return val.value || undefined;
  }
  return undefined;
};

// Drop empty values so they don't clutter the query string (an unset select
// leaves "" behind, an unset multiselect leaves []).
const stripEmpty = (obj: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => {
      if (v == null || v === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    })
  );

const ClientPortfolioEnhancedListing: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { localizationData } = useLocalization();

  // Admin-configured predefined filters are seeded server-side under the
  // original page's entity — read the shared key so Enhanced keeps inheriting
  // them, but strip org/company/owner fields defensively (same rationale as
  // RO / Biz Done Enhanced): one viewer's org/company/owner selection must
  // never leak to every user who falls through to this system default.
  const systemSmartSearchDefaultValuesRaw = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.clientPortfolioEntity
      ]
  );
  const systemSmartSearchDefaultValues = useMemo(() => {
    if (!systemSmartSearchDefaultValuesRaw) {
      return systemSmartSearchDefaultValuesRaw;
    }
    const {
      orgScope: _orgScope,
      organisationId: _organisationId,
      sbuId: _sbuId,
      verticalId: _verticalId,
      branchId: _branchId,
      departmentId: _departmentId,
      ownerId: _ownerId,
      viewBy: _viewBy,
      companyName: _companyName,
      ...rest
    } = systemSmartSearchDefaultValuesRaw;
    return rest;
  }, [systemSmartSearchDefaultValuesRaw]);

  // The user's own Save View stays on the isolated entity key — it can carry
  // org scope + toolbar state that must not leak into My Client Portfolio.
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.clientPortfolioEnhancedEntity
      ]
  );

  const defValues =
    userSmartSearchDefaultValues || systemSmartSearchDefaultValues || {};

  const defaultValues = useMemo(() => {
    const { orgScope: _savedOrgScope, ...baseValues } = (defValues ??
      {}) as Record<string, any>;
    return baseValues;
  }, [defValues]);

  // Org-hierarchy scope (backend-backed). A scope applied before drilling into
  // a record is restored on the way back via navigation state, falling back to
  // a saved view's scope on a fresh page load. Every user starts scoped to
  // their own org; only leadership/superusers may change the Organisation
  // level (or see the IIRM Holdings root summary).
  const { isPrivileged, userOrganisationId } = getOrgScopeAccess();
  const orgLevelKey = clientPortfolioScopeConfig.levels[0].key;
  const lockedOrgLevels =
    !isPrivileged && userOrganisationId != null ? [orgLevelKey] : undefined;
  const orgScope = useOrgScope({
    config: clientPortfolioScopeConfig,
    initial: location.state?.scope ?? (defValues as any)?.orgScope ?? null,
    baseSelection:
      userOrganisationId != null
        ? { [orgLevelKey]: userOrganisationId }
        : undefined,
    lockedLevels: lockedOrgLevels,
  });

  const [skipQuery, setSkipQuery] = useState(true);
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [selectedCompanyData, setSelectedCompanyData] = useState<any | null>(
    null
  );
  // "Past Companies" view — companies whose policies have expired.
  const [pastCompanies, setPastCompanies] = useState(false);
  // Service score threshold (">90" | ">80" | ">70" | "<70") — the portfolio
  // endpoint takes this as its own query param, not a search key.
  const [serviceScoreFilter, setServiceScoreFilter] = useState<
    string | undefined
  >(undefined);
  // Last committed form values — the merge base for partial updates (toolbar
  // company, owner accordion, scope changes) made from effects that captured
  // an older render.
  const lastFiltersRef = useRef<Record<string, any>>({});
  const [appliedValues, setAppliedValues] = useState<Record<string, any>>({});
  const companyPoliciesRef = useRef<HTMLDivElement>(null);

  // Portfolio-only params: neither is hoisted out of smartSearch by
  // useTableController, so they ride the path directly.
  const customPathParam = useMemo(() => {
    // recursiveTeam is what makes "Manager + Team" mean the whole reporting
    // subtree rather than direct reports only, so the listing reconciles with
    // the Owner accordion's cards. It is opt-in per request BECAUSE the
    // ORIGINAL My Client Portfolio calls this same endpoint and must keep its
    // existing direct-reports-only behaviour — it never sends this flag.
    const parts: string[] = ["recursiveTeam=true"];
    if (pastCompanies) parts.push("pastCompanies=true");
    if (serviceScoreFilter) {
      parts.push(`serviceScore=${encodeURIComponent(serviceScoreFilter)}`);
    }
    return parts.join("&");
  }, [pastCompanies, serviceScoreFilter]);

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
    setSmartSearch,
    setColumnOrder,
    columnOrder,
  } = useTableController({
    endpoint: endPoints.portfolioCompanies,
    searchFieldName: SEARCH_FIELD_NAME,
    // Companies + KPIs load only once a report is applied (auto on a complete
    // drilldown, or via View Report) — matching every other Enhanced page,
    // rather than the original screen's immediate-on-load behavior.
    enabled: !skipQuery && orgScope.hasReport,
    // Emitted as &field=policyFrom whenever the period popover produces a
    // from/to range, so the period filters policyFrom (the original screen's
    // "Period (Policy from)" semantics).
    defaultFieldName: "policyFrom",
    customPathParam,
  });

  const { selectedValues } = useFormWatcher({
    formMethods,
    setSearchTerm: () => {
      /* no free-text search on this page — Company is a select in the toolbar */
    },
    searchFieldName: SEARCH_FIELD_NAME,
    searchDefaultValues: defaultValues,
  });

  // The org-hierarchy widget's period popover is the single source of the
  // report's date range. A bare whole-FY selection sends financialYear alone;
  // quarter / month / custom-range selections send from/to (which makes
  // useTableController add &field=policyFrom).
  const periodFilters = useMemo(() => {
    const range = timelineToRange(orgScope.appliedTimeline);
    return range.financialYear !== undefined
      ? { financialYear: range.financialYear }
      : { from: range.from ?? "", to: range.to ?? "" };
  }, [orgScope.appliedTimeline]);

  // Applied org scope as search filters (organisationId:[1], sbuId:[2], …) —
  // the shape the portfolio endpoint's search parser understands. `allLevels`
  // covers levels + fork only, so the Owner level never leaks in here (it has
  // its own dedicated ownerId/viewBy channel below).
  const scopeSearchFilters = useMemo(() => {
    const applied = orgScope.appliedSelection ?? {};
    // Branch is multiselect, so a level can contribute a list of ids — the
    // listing's search parser renders it as branchId:[a,b].
    const filters: Record<string, number | number[]> = {};
    allLevels(clientPortfolioScopeConfig).forEach((level) => {
      const id = applied[level.key];
      if (id != null) filters[level.queryParam] = id;
    });
    return filters;
  }, [orgScope.appliedSelection]);

  // The APPLIED accordion owner + view-by, this page's only owner channel.
  // An explicit ownerId always scopes server-side (even for leadership roles),
  // so the table matches the selected card.
  const ownerLevelKey = clientPortfolioScopeConfig.ownerLevel?.key;
  const appliedOwnerId = ownerLevelKey
    ? orgScope.appliedSelection?.[ownerLevelKey]
    : undefined;
  const ownerFilters = useMemo(
    () =>
      appliedOwnerId != null
        ? { ownerId: appliedOwnerId, viewBy: orgScope.appliedOwnerViewBy }
        : {},
    [appliedOwnerId, orgScope.appliedOwnerViewBy]
  );

  // Fields that must never reach the backend query in their raw form shape:
  // serviceScore (its own query param, set from pushFilters), status (a
  // leftover of the original screen's default values that the portfolio
  // endpoint doesn't understand), and orgScope (Save-View metadata).
  //
  // period / financialYear are ALSO stripped: on this page the
  // OrgFinancialFilter's period popover is the single date channel, and it
  // emits the window as explicit from/to (merged in fresh via periodFilters).
  // A seeded default or saved view can carry a stale `period` duration string
  // (e.g. "3 Months") or a `financialYear` — either of which the backend
  // PREFERS over the popover's explicit from/to, silently querying a different
  // window than the org cards. That makes the KPIs/listing diverge from the
  // cards and from the original page (which only ever sends from/to). from/to
  // themselves are kept — periodFilters overrides them for the query, and the
  // drill-down child tables need the applied window.
  const sanitizeFilters = (vals: Record<string, any> | undefined) => {
    const {
      serviceScore: _serviceScore,
      status: _status,
      orgScope: _orgScope,
      period: _period,
      financialYear: _financialYear,
      ...rest
    } = vals ?? {};
    return rest;
  };

  // The single commit point. `raw` = the form values (kept verbatim as the
  // chip source and the merge base); the org scope, period and owner are
  // always merged in fresh so stale keys can't linger.
  const pushFilters = useCallback(
    (raw: Record<string, any>) => {
      lastFiltersRef.current = raw;
      setSmartSearch(
        stripEmpty({
          ...sanitizeFilters(raw),
          ...scopeSearchFilters,
          ...periodFilters,
          ...ownerFilters,
        })
      );
      setAppliedValues(raw);
      setServiceScoreFilter(extractServiceScoreValue(raw?.serviceScore));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopeSearchFilters, periodFilters, ownerFilters, setSmartSearch]
  );

  // Seeds the page on load, then re-pushes whenever the applied scope/period
  // changes (View Report, auto-apply on a complete drilldown, an owner card
  // click). Guarded on a serialized snapshot so a re-render with identical
  // defaults is a no-op, and on isDirty so it never clobbers user edits.
  const prefilledFilterValues = useMemo(
    () => (location.state?.filters ? { ...location.state.filters } : undefined),
    [location.state]
  );

  const seededDefaultsRef = useRef<string>();
  useEffect(() => {
    if (!formMethods) return;
    const valuesToApply = prefilledFilterValues ?? defaultValues;
    const serialized = JSON.stringify(valuesToApply);
    if (seededDefaultsRef.current === serialized) return;
    if (
      seededDefaultsRef.current !== undefined &&
      formMethods.formState.isDirty
    ) {
      seededDefaultsRef.current = serialized;
      return;
    }
    seededDefaultsRef.current = serialized;
    // Carry the hidden org ids through the reset — the org-sync effect writes
    // them with setValue, which never marks the form dirty, so a reset seeded
    // from defaultValues alone would blank them and leave Vertical's
    // SBU-scoped lookup with nothing to query.
    formMethods.reset({
      ...valuesToApply,
      organisationId: orgScope.appliedSelection?.organisation ?? 0,
      sbuId: orgScope.appliedSelection?.unit ?? "",
    });
    pushFilters(valuesToApply);
    setSkipQuery(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formMethods, defaultValues, prefilledFilterValues]);

  // Re-push on every scope/period/owner change so the table + KPIs follow the
  // widget without waiting for a drawer Apply.
  useEffect(() => {
    if (skipQuery || !orgScope.hasReport) return;
    pushFilters(lastFiltersRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scopeSearchFilters,
    periodFilters,
    ownerFilters,
    orgScope.hasReport,
    skipQuery,
  ]);

  // Toolbar Company applies IMMEDIATELY on selection (same UX as every other
  // Enhanced page). Read from useFormWatcher's live snapshot, and merge ONLY
  // companyName into the last committed values — un-Applied drawer drafts must
  // not leak into the query.
  const toolbarCompany = selectedValues?.companyName as
    | { value: number | string; label: string }
    | undefined;
  useEffect(() => {
    if (skipQuery) return;
    const current = lastFiltersRef.current ?? {};
    const committed = (current.companyName as any)?.value;
    const picked =
      toolbarCompany?.value != null && toolbarCompany?.value !== ""
        ? toolbarCompany.value
        : undefined;
    if (committed === picked) return;
    const next = { ...current };
    if (picked != null) next.companyName = toolbarCompany;
    else delete next.companyName;
    // A different company invalidates the open drill-down.
    setSelectedCompanyData(null);
    pushFilters(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolbarCompany?.value, skipQuery]);

  // Same scroll-into-view UX as My Client Portfolio: the drill-down section
  // renders after selection, then scrolls under the companies table.
  useEffect(() => {
    if (!selectedCompanyData || !companyPoliciesRef.current) return;
    const timer = setTimeout(() => {
      companyPoliciesRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedCompanyData]);

  // ---------------------------------------------------------------- filters

  // Company type, keyed to the policy-context attribute map so it filters the
  // policy-driven results by the company's type.
  const companyTypeField = useMemo<FormFieldConfig>(
    () => ({
      key: PORTFOLIO_COMPANY_TYPE_FILTER_KEY,
      name: PORTFOLIO_COMPANY_TYPE_FILTER_KEY,
      label: "Company type",
      type: "select",
      gridColumn: 2.9,
      apiDependencies: {
        endPoint: endPoints.lookUpByName(COMPANY_TYPE_LOOKUP_NAME),
        isSmartSearch: true,
        defaultValue: "",
      },
      placeholder: "Search",
    }),
    []
  );

  // Every field this page registers on the shared form — the hidden
  // SmartSearch mounts all of these; the toolbar and drawer render visible
  // subsets bound to the same formMethods.
  //
  // The field set is kept at PARITY with the original My Client Portfolio
  // screen (CompanyOverView), which derives its filters purely from
  // PolicySearchConfig. That means:
  //   - Company name -> the always-visible toolbar select;
  //   - Company type / priority / service score -> the "Company" group;
  //   - the rest of PolicySearchConfig (policy type, IIRM type, industry,
  //     renewal period, policy-expiry dates, Business month, ISG manager) ->
  //     the "Policy" group — INCLUDING Business month, exactly as the original.
  //
  // NOT included, matching the original: the Organisation/SBU/Vertical/Branch/
  // Owner dropdowns and periodConfig (now the OrgFinancialFilter widget's job),
  // and the Insurer set (insurerId/insurerBranchId/branchViewBy) — those live
  // in the separate InsurerSearchConfig, which the original screen never pulls
  // in, so this page must not either.
  // Vertical is a plain drawer filter now, not an accordion step (the widget's
  // Vertical level is hidden — see OrgFinancialFilter's visibleLevels slice).
  // Reused verbatim from the non-Enhanced listings' shared config so it behaves
  // identically: multiselect, options scoped to the selected SBU,
  // storeSelectedOption so the applied-filter chip reads names not ids.
  const verticalField = useMemo(
    () => CommonFieldsconfig.find((field: any) => field.key === "verticalId"),
    []
  );

  // Vertical's options hang off `sbuId` (dependentField), which this page has
  // no visible control for — the accordion owns Organisation/SBU. These two
  // register on the shared form so the lookup has something to read; they're
  // filtered out of the drawer below, and the query still gets its org scope
  // through scopeSearchFilters exactly as before.
  const hiddenOrgFields = useMemo(
    () =>
      ["organisationId", "sbuId"].map((key) => ({
        key,
        name: key,
        type: "text",
      })),
    []
  ) as FormFieldConfig[];

  useEffect(() => {
    if (!formMethods) return;
    const applied = orgScope.appliedSelection ?? {};
    formMethods.setValue("organisationId", applied.organisation ?? 0);
    formMethods.setValue("sbuId", applied.unit ?? "");
  }, [formMethods, orgScope.appliedSelection]);

  const allFieldsConfig = useMemo(() => {
    const policyFields = PolicySearchConfig();
    const companyNameField = policyFields.filter(
      (field) => field.key === "companyName"
    );
    const companyPriorityField = policyFields.filter(
      (field) => field.key === "policyCompanyPriority"
    );
    const serviceScoreField = tableSearchConfig.filter(
      (field) => field.key === "serviceScore"
    );
    const otherPolicyFields = policyFields.filter(
      (field) =>
        field.key !== "companyName" && field.key !== "policyCompanyPriority"
    );

    return [
      ...hiddenOrgFields,
      ...companyNameField,
      // Leads the drawer: it's the org-level filter the accordion no longer
      // offers, and it sits above the Company/Policy groups it doesn't belong to.
      ...(verticalField ? [verticalField] : []),
      GeneratesmartSearchTitleConfig("Company"),
      companyTypeField,
      ...companyPriorityField,
      ...serviceScoreField,
      GeneratesmartSearchTitleConfig("Policy"),
      ...otherPolicyFields,
    ] as FormFieldConfig[];
  }, [companyTypeField, hiddenOrgFields, verticalField]);

  const toolbarFieldConfig = useMemo(
    () =>
      allFieldsConfig
        .filter((field: any) =>
          CLIENT_PORTFOLIO_ENHANCED_TOOLBAR_FIELD_NAMES.includes(field.name)
        )
        .map((field: any) => ({ ...field, gridColumn: 3.2 })),
    [allFieldsConfig]
  );

  const drawerFieldConfig = useMemo(
    () =>
      allFieldsConfig
        .filter(
          (field: any) =>
            !CLIENT_PORTFOLIO_ENHANCED_TOOLBAR_FIELD_NAMES.includes(field.name)
        )
        // The hidden org ids exist only to feed Vertical's lookup — they stay
        // registered on the shared form but must never render as controls.
        .filter(
          (field: any) => !["organisationId", "sbuId"].includes(field.name)
        )
        .map((field: any) => ({ ...field, gridColumn: 12 })),
    [allFieldsConfig]
  );

  const appliedFilterFieldConfig = useMemo(
    () =>
      drawerFieldConfig
        .filter(
          (field: any) =>
            field.name &&
            field.type !== "title" &&
            field.type !== "segmentedcontrol"
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
    pushFilters(formMethods.getValues());
  };

  const appliedFilterGroups = useMemo(
    () =>
      buildAppliedFilterGroups(
        appliedFilterFieldConfig,
        appliedValues,
        removeFilterValue
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appliedFilterFieldConfig, appliedValues]
  );

  // Apply (drawer): commit everything together — the drawer's own fields plus
  // the always-visible toolbar's Company, plus the applied scope/period/owner
  // (merged inside pushFilters).
  const handleRun = () => {
    setSelectedCompanyData(null);
    setCurrentPage(1);
    pushFilters(formMethods?.getValues() ?? selectedValues ?? {});
  };

  // The applied org/period scope in the shape useOrgScope's `initial` expects,
  // so it can be handed straight back on restore.
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

  // Reset must only clear the DRAWER's own fields, not the whole form —
  // formMethods.reset(defaultValues) would also wipe the always-visible
  // toolbar's Company selection, since it lives on the same formMethods
  // instance (same rationale as RO / Biz Done Enhanced's onReset).
  const onReset = (options?: { successMessage?: string }) => {
    if (!formMethods) return;
    // System default only, never the saved view — otherwise a view's own
    // company type / priority can't be cleared. An explicit empty value
    // (shape-preserving) rather than undefined, since reset() leaves a
    // controlled field untouched when its key is absent and the chips would
    // keep showing a value the query already dropped.
    const systemDefaults = (systemSmartSearchDefaultValues ?? {}) as Record<
      string,
      any
    >;
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
    setSelectedCompanyData(null);
    pushFilters(next);
    dispatch(
      updateUserDefaultConfig({
        entityKey: TABLE_CONTROLLER_ENTITY_KEY.clientPortfolioEnhancedEntity,
        selectedFilterValues: { ...next, orgScope: appliedScope },
        columns: buildColumnSettingsPayload(columnOrder),
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
        ...(appliedScope && { scope: appliedScope }),
      },
    });
  };

  // ------------------------------------------------------------ breadcrumbs

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);

  const breadcrumbState = useMemo(() => {
    const filters = Object.keys(selectedValues ?? {}).length
      ? selectedValues
      : location.state?.filters;
    return {
      ...(filters && { filters }),
      ...(appliedScope && { scope: appliedScope }),
    };
  }, [selectedValues, location.state?.filters, appliedScope]);

  const portfolioCrumb = {
    label: CLIENT_PORTFOLIO_ENHANCED,
    path: "/my-client-portfolio-enhanced",
    key: BREADCRUMB_KEYS.CLIENT_PORTFOLIO,
    state: breadcrumbState,
  };

  useBreadcrumbTrail(portfolioCrumb);

  const portfolioBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [createBreadcrumbEntry(portfolioCrumb)];

  // ------------------------------------------------------------ table wiring

  const columns = useMemo(
    () => getColumns(localizationData?.data),
    [localizationData?.data]
  );

  const kpis = useMemo(
    () => kpisData(overallData?.kpiData || {}),
    [overallData?.kpiData]
  );

  const ActionButtonRenderer = useCallback(
    (params: any) => (
      <ActionButton
        onClick={() => setSelectedCompanyData(params.data)}
        buttonText={VIEW_DETAILS}
        imageSrc={showIcon}
        imageStyles={{ width: "20px", height: "20px" }}
        customStyles={{ gap: "10px", border: "none" }}
      />
    ),
    []
  );

  // Renders "premium (#count)" cells for the Policy / RO / SO columns. The
  // premium and count field names are supplied per column via
  // cellRendererParams.
  const PremiumCountCell = useCallback(
    (params: any) => {
      const premiumValue = params?.data?.[params?.premiumField];
      const countValue = params?.data?.[params?.countField] ?? 0;
      const premium =
        premiumValue != null
          ? formatCurrencyByLocalization(premiumValue, localizationData?.data)
          : "--";
      return soRoPremiumCell(premium, `(#${countValue})`);
    },
    [localizationData?.data]
  );

  const gridComponents = useMemo(
    () => ({
      ActionButton: ActionButtonRenderer,
      ChipRenderer,
      PremiumCountCell,
    }),
    [ActionButtonRenderer, PremiumCountCell]
  );

  const onCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "companyName") {
      const destinationConfig = {
        label: event.data.companyName,
        path: `/companies/${event?.data?.companyId}`,
        key: DETAILS_KEYS.COMPANY,
      };
      navigate(destinationConfig.path, {
        state: buildBreadcrumbState({
          breadcrumbs: portfolioBreadcrumb,
          crumb: destinationConfig,
          state: {
            from: "clientPortfolioEnhanced",
            filters: selectedValues ?? null,
            ...(appliedScope && { scope: appliedScope }),
            companyData: event?.data,
          },
        }),
      });
      return;
    }

    // If the user clicked inside the ActionButton cell, let its own handler
    // take it.
    const target = event?.event?.target as HTMLElement | null;
    const clickedInsideButton =
      !!target?.closest("button") || !!target?.closest('[role="button"]');
    if (clickedInsideButton) return;

    // Any other cell → select the row and show the details below the table.
    setSelectedCompanyData(event.data);
  };

  // Selecting an owner must update ONLY the Owner cards (and the table), never
  // the Organisation / SBU / Branch cards above — those stay at their hierarchy
  // totals as you drill, like every other Enhanced page. So we deliberately do
  // NOT feed the applied owner into the widget's upper-level aggregates:
  // passing userId there made the backend re-scope org/SBU/branch AS that owner,
  // so every card collapsed to the owner's number (e.g. all reading 39). The
  // owner accordion carries its own Manager/Team view-by via the widget's
  // ownerAggregateParams, independent of this.
  const orgWidgetExtraParams = useMemo(() => ({}), []);

  // Everything Save View needs to reproduce the current screen: the form
  // fields plus the applied org/period scope.
  const filtersForSaveView = useMemo(
    () => ({ ...selectedValues, orgScope: appliedScope }),
    [selectedValues, appliedScope]
  );

  // The applied period as explicit from/to for the drill-down tables. Unlike
  // periodFilters (which sends financialYear alone for a whole-FY selection, to
  // match the listing's FY handling), the child policy / RO / SO tables key off
  // from/to — and timelineToRange always yields both, even for a whole FY.
  const drilldownPeriod = useMemo(() => {
    const range = timelineToRange(orgScope.appliedTimeline);
    return {
      ...(range.from ? { from: range.from } : {}),
      ...(range.to ? { to: range.to } : {}),
    };
  }, [orgScope.appliedTimeline]);

  // Drill-down filters: the committed form values (policy attribute filters)
  // minus the fields the child tables don't understand, with the STALE form
  // from/to REPLACED by the org widget's applied window. Without this the
  // children inherit a leftover default window (e.g. today .. +3 months) that
  // has nothing to do with the selected period, so a company whose policies
  // fall in the chosen FY/quarter shows "No data to show".
  const drilldownFilters = useMemo(() => {
    const { from: _from, to: _to, ...rest } = sanitizeFilters(appliedValues) ?? {};
    return { ...rest, ...drilldownPeriod };
  }, [appliedValues, drilldownPeriod]);

  return (
    <CompanyListingContainer>
      {location?.state?.formDashboard ? (
        <CommonBreadcrumb crumbs={clientPortfolioEnhancedBreadcrumbs} />
      ) : existingBreadcrumbs?.length > 1 ? (
        <CommonBreadcrumb />
      ) : (
        <TitleContainer variant="h1">
          {CLIENT_PORTFOLIO_ENHANCED}
        </TitleContainer>
      )}

      {/* Hidden SmartSearch: wires formMethods into the query layer. The
          visible fields render in the toolbar (Company) and the filter drawer
          via the shared FilterDrawer. */}
      <HiddenSearchWrapper aria-hidden>
        <CardBackground>
          <SmartSearch
            searchFormConfig={allFieldsConfig}
            searchDefaultValues={defaultValues}
            searchFormMethods={setFormMethods}
            selectedValues={selectedValues}
            onReset={onReset}
            formMethods={formMethods}
            searchFieldName={SEARCH_FIELD_NAME}
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
        config={clientPortfolioScopeConfig}
        api={orgScope}
        extraAggregateParams={orgWidgetExtraParams}
        hideRootSummary={!isPrivileged}
        lockedLevels={[orgLevelKey]}
        popoverOrgFilter={{ disabled: !isPrivileged }}
        periodDateNote={CLIENT_PORTFOLIO_ENHANCED_PERIOD_DATE_NOTE}
      />

      {/* Table + KPIs show only for a report matching the CURRENT org scope:
          nothing until View Report is clicked, and they collapse again the
          moment any card changes, so a stale scope can never be misread as
          live data. The filter's own "Scope changed" hint says what to do. */}
      {orgScope.hasReport && !orgScope.isStale && (
        <>
          <KpiSection>
            {loading && !Object.keys(overallData ?? {}).length ? (
              <KpiSkeletonRow>
                {[0, 1, 2, 3].map((i) => (
                  <KpiSkeleton key={i} variant="rounded" />
                ))}
              </KpiSkeletonRow>
            ) : (
              <KPICards
                data={kpis}
                showPercentage={false}
                localization={localizationData?.data}
              />
            )}
          </KpiSection>

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
              filterButtonAriaLabel: "Client portfolio filters",
              filterButtonTestId: "client-portfolio-enhanced-filter-button",
              drawerTitle: "Client portfolio filters",
              drawerWidth: "420px",
              renderFilterContent: (close: () => void) => (
                <FilterDrawer
                  formConfig={drawerFieldConfig}
                  defaultValues={defaultValues}
                  existingMethods={formMethods}
                  resetTestId="client-portfolio-enhanced-filter-reset"
                  applyTestId="client-portfolio-enhanced-filter-apply"
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
            columns={columns}
            rowData={rowData}
            totalRows={totalRows}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            setPageSize={setPageSize}
            setSort={setSort}
            secondaryActionLabel={
              pastCompanies ? "Show active companies" : "Past companies"
            }
            onSecondaryActionClick={() => {
              setSelectedCompanyData(null);
              setCurrentPage(1);
              setPastCompanies((prev) => !prev);
            }}
            components={gridComponents}
            height={590}
            domLayout="autoHeight"
            onCellClicked={onCellClicked}
            title={COMPANY_OVERVIEW}
            subTitle={COMPANY_OVERVIEW_SUBTITLE}
            setColumnOrder={setColumnOrder}
            columnOrder={columnOrder}
            entityKey={TABLE_CONTROLLER_ENTITY_KEY.clientPortfolioEnhancedEntity}
            selectedFilterValues={filtersForSaveView}
          />

          {/* Drill-down sections — reused verbatim from My Client Portfolio;
              they are fully prop-driven, so nothing is duplicated here. */}
          {selectedCompanyData && (
            <PolicyTableContainer ref={companyPoliciesRef}>
              <CompanyPolicies
                companyData={selectedCompanyData}
                breadcrumbInfo={portfolioBreadcrumb}
                filters={drilldownFilters}
                pastCompanies={pastCompanies}
              />
              {!pastCompanies && (
                <>
                  <CompanyOpportunities
                    companyData={selectedCompanyData}
                    type="RO"
                    title="Renewal opportunities"
                    breadcrumbInfo={portfolioBreadcrumb}
                    filters={drilldownFilters}
                  />
                  <CompanyOpportunities
                    companyData={selectedCompanyData}
                    type="SO"
                    title="Sales opportunities"
                    breadcrumbInfo={portfolioBreadcrumb}
                    filters={drilldownFilters}
                  />
                </>
              )}
              <CompanyServiceScore companyData={selectedCompanyData} />
            </PolicyTableContainer>
          )}
        </>
      )}
    </CompanyListingContainer>
  );
};

export default ClientPortfolioEnhancedListing;
