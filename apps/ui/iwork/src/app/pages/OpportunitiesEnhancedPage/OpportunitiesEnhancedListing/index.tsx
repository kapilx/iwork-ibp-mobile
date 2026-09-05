import { CellClickedEvent } from "ag-grid-community";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CardBackground,
  ChipRenderer,
  DateStatusDotRenderer,
  SmartSearch,
  SEARCH,
  endPoints,
  DynamicForm,
  FilterDrawer,
  FormFieldConfig,
  useFormWatcher,
  useTableController,
  selectHasPermission,
  FeatureKey,
  useActivityRoleVisibility,
  useLocalization,
  useLookupIdByKey,
  getSessionStorageData,
  KPICards,
  Table,
  setToastMessage,
  CommonBreadcrumb,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  buildBreadcrumbState,
  useBreadcrumbTrail,
  BREADCRUMB_KEYS,
  CONTACTS,
  DETAILS_KEYS,
  DETAILS_LABELS,
  OrgFinancialFilter,
  useOrgScope,
  timelineToRange,
  allLevels,
  buildAppliedFilterGroups,
  VIEW_DETAILS,
  buildColumnSettingsPayload,
  updateUserDefaultConfig,
} from "@ui/ui-lib";
import {
  CREATE_OPPORTUNITY,
  LIST_OF_RECORDS,
  MANAGE_OPPORTUNITIES_ENHANCED,
  OPPORTUNITY,
  SO_ENHANCED_TOOLBAR_FIELD_NAMES,
  SO_ENHANCED_PERIOD_DATE_NOTE,
  TABLE_CONTROLLER_ENTITY_KEY,
  UNAVAILABLE_ERROR_MESSAGE,
} from "../../../constants";
import { useDispatch, useSelector } from "react-redux";
import { LookUpValues } from "../../../constants/lookupValues";
import { TitleContainer } from "../../CompanyPage/CompanyListing/styles";
import {
  HiddenSearchWrapper,
  OpportunitiesEnhancedListingContainer,
  RecordsSectionWrapper,
} from "./styles";
import { tableSearchConfig, getCompanyColumns } from "./tableConfig";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton";
import showIcon from "../../../assets/svgs/eye.svg";
import {
  breadCrumbs,
  getColumns,
  normalizeOpportunityStateField,
  opportunityData,
} from "../../OpportunitiesPage/OpportunitiesListing/tableConfig";
import { BreadCrumbWrapper } from "../../OpportunitiesPage/OpportunitiesListing/styles";
import {
  hasStatusSelection,
  withActiveLostStatusDefault,
} from "../../../Utils/smartSearchPrefill";
import {
  CommonFieldsconfig,
  GeneratesmartSearchTitleConfig,
} from "../../../Utils/smartSearchConfig";
import { soScopeConfig } from "./orgScope/soScopeConfig";
import { getOrgScopeAccess } from "../../../Utils/orgScopeAccess";
import { ToolbarFieldsWrapper } from "./orgScope/styles";

// Owner and View-by (Manager / Manager + Team) have NO form fields on this
// page: the org-scope widget's Owner accordion is the single owner channel —
// a card click and its Manager / Manager + Team toggle push ownerId/viewBy
// into the listing query directly (see the accordion sync effect below).
// True once this page has mounted at least once in the current app session.
// A full page load (first visit OR refresh) resets it to false, which is the
// only way to tell a refresh apart from a client-side return: History state
// survives F5, so `location.state.filters` is present either way.
let hasMountedSincePageLoad = false;

const OpportunitiesEnhancedListing: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const userData = getSessionStorageData("user");
  const organisationId = userData?.organisationId ?? 1;

  // Shared with Manage SO: generic SO-field defaults (priority, policy type,
  // status, etc.) are safe to inherit from the same system-config record.
  // Strip fields that don't exist on Manage SO (orgScope) or whose shape
  // differs here (ownerId is a treeSelect there, a flat selectFieldByApi in
  // this page's toolbar) so a stale/incompatible saved value can't break
  // this page's fields.
  const systemSmartSearchDefaultValuesRaw = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.soEntity
      ]
  );
  const systemSmartSearchDefaultValues = useMemo(() => {
    if (!systemSmartSearchDefaultValuesRaw) return systemSmartSearchDefaultValuesRaw;
    const { orgScope: _orgScope, ownerId: _ownerId, ...rest } =
      systemSmartSearchDefaultValuesRaw;
    return rest;
  }, [systemSmartSearchDefaultValuesRaw]);
  // The user's own Save View stays on the isolated key — it can carry org
  // scope + toolbar state that must not leak into Manage SO's request.
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.soCompaniesEntity
      ]
  );
  const defValues =
    userSmartSearchDefaultValues || systemSmartSearchDefaultValues || {};

  // No toolbar owner default anymore: with no ownerId sent, the backend
  // applies its own viewer default (self + team; leadership roles see
  // org-wide) — identical to what pushing ownerId=me produced for everyone
  // else, and the correct org-wide baseline for leadership. The accordion
  // pushes an explicit ownerId once a branch drilldown selects an owner.
  const defaultValues = useMemo(
    () =>
      withActiveLostStatusDefault(
        normalizeOpportunityStateField(defValues),
        hasStatusSelection(userSmartSearchDefaultValues)
      ),
    [defValues, userSmartSearchDefaultValues]
  );

  // Org-hierarchy scope (backend-backed). A scope applied before drilling into
  // a record is restored on the way back via navigation state, falling back to
  // a saved view's scope on a fresh page load.
  // Every user starts scoped to their own org; only leadership/superusers may
  // change the Organisation level (or see the IIRM Holdings root summary).
  const { isPrivileged, userOrganisationId } = getOrgScopeAccess();
  const orgLevelKey = soScopeConfig.levels[0].key;
  const lockedOrgLevels =
    !isPrivileged && userOrganisationId != null ? [orgLevelKey] : undefined;
  const orgScope = useOrgScope({
    config: soScopeConfig,
    initial: location.state?.scope ?? defValues?.orgScope ?? null,
    baseSelection:
      userOrganisationId != null
        ? { [orgLevelKey]: userOrganisationId }
        : undefined,
    lockedLevels: lockedOrgLevels,
  });

  const [skipQuery, setSkipQuery] = useState(true);
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [selectedFilterValuesAfterRun, setSelectedFilterValuesAfterRun] =
    useState<Record<string, any>>({});
  const tableSelectionApiRef = useRef<{ clearSelection: () => void } | null>(null);
  // Last SO/owner filters pushed to the query — merge base for partial updates.
  const lastFiltersRef = useRef<Record<string, any>>({});

  const canCreateOpportunity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.CREATE_OPPORTUNITY)(state)
  );
  const { canViewBD, canViewISG } = useActivityRoleVisibility();
  const canBulkEditOpportunities = useSelector((state: any) =>
    selectHasPermission(FeatureKey.BULK_EDIT_WRITE)(state)
  );
  const companyContactId = useLookupIdByKey(LookUpValues.COMPANY_CONTACT);

  // Strips fields that must never reach the backend query in their raw form
  // shape: incomeType (pre-existing), orgScope (Save-View meta), and
  // companyName/ownerId (selectFieldByApi {value,label} shape — dedicated
  // watch effects extract the right scalar, companyName23/ownerId, and push
  // it themselves).
  const sanitizeOpportunityFilters = (filters?: Record<string, any>) => {
    if (!filters) return filters;
    const {
      incomeType: _incomeType,
      orgScope: _orgScope,
      companyName: _companyName,
      ownerId: _ownerId,
      companyName23: _companyName23,
      organisationId: _organisationId,
      sbuId: _sbuId,
      ...rest
    } = filters;
    return rest;
  };

  const scopeCustomPath = useMemo(() => {
    const parts: string[] = [];
    const range = timelineToRange(orgScope.appliedTimeline);
    if (range.from || range.to) {
      parts.push("field=expiryDate");
      if (range.from) parts.push(`from=${range.from}`);
      if (range.to) parts.push(`to=${range.to}`);
    }
    // Whole FY selected (no quarter/month/custom range) — send financialYear
    // too, same as the non-Enhanced SO listing.
    if (range.financialYear !== undefined) {
      parts.push(`financialYear=${range.financialYear}`);
    }
    return parts.join("&");
  }, [orgScope.appliedTimeline]);

  // Applied scope as search filters (organisationId:[1], sbuId:[2], …) — the
  // shape the listing's search parser understands, matching the org dropdowns.
  const scopeSearchFilters = useMemo(() => {
    const applied = orgScope.appliedSelection;
    // A multiselect level (Branch) contributes a list — the listing's search
    // parser renders it as branchId:[a,b] and the API filters with IN.
    const filters: Record<string, number | number[] | undefined> = {};
    const rootLevelKey = soScopeConfig.levels[0].key;
    allLevels(soScopeConfig).forEach((level) => {
      const id = applied?.[level.key];
      // Unselected non-root levels are OMITTED, not set to undefined: this
      // object is spread OVER the drawer filters in pushFilters, so an
      // undefined entry would wipe a drawer field that shares the key. That
      // is exactly the case for verticalId — the accordion's Vertical step is
      // hidden, so it never has a value, while the drawer's Vertical field
      // does. Levels the accordion HAS selected still win, as before.
      if (id != null) {
        filters[level.queryParam] = id;
      } else if (level.key === rootLevelKey) {
        filters[level.queryParam] = 0;
      }
    });
    return filters;
  }, [orgScope.appliedSelection]);

  // Portfolio-style flow (mirrors Biz Done Enhanced / My Client Portfolio):
  // the PRIMARY table lists companies; View details reveals that company's
  // opportunity records in a second table below, scoped by companyId.
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  // pushFilters is called from effects that captured older renders — the ref
  // always carries the CURRENT selection into the records query.
  const selectedCompanyRef = useRef<any | null>(null);
  const recordsSectionRef = useRef<HTMLDivElement>(null);

  // Records of the SELECTED company only (companyId rides the listing's
  // structured search, same channel as organisationId/sbuId).
  const {
    rowData,
    totalRows,
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    PAGE_SIZE_OPTIONS,
    setSearchTerm,
    setSort,
    setSmartSearch,
    error,
    setColumnOrder,
    columnOrder,
    refetch,
  } = useTableController({
    endpoint: endPoints.allOpurtunities,
    searchFieldName: "companyName23",
    customPathParam: scopeCustomPath,
    enabled:
      !skipQuery && orgScope.hasReport && selectedCompany?.companyId != null,
    defaultFieldName: "expiryDate",
  });

  // KPI cards keep TODAY'S semantics — whole report scope including drawer
  // filters, never company-scoped — via a dedicated listing query that gets
  // every committed filter EXCEPT the selected company.
  const {
    overallData: kpiOverallData,
    totalRows: kpiTotalRows,
    setSmartSearch: setKpiSmartSearch,
  } = useTableController({
    endpoint: endPoints.allOpurtunities,
    searchFieldName: "companyName23",
    customPathParam: scopeCustomPath,
    enabled: !skipQuery && orgScope.hasReport,
    defaultFieldName: "expiryDate",
  });

  const { selectedValues } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchFieldName: "companyName23",
    searchDefaultValues: systemSmartSearchDefaultValues,
  });

  // Drop empty values (e.g. an unset SO-status multiselect → state:[]) so they
  // don't clutter the query string.
  const stripEmpty = (obj: Record<string, any>) =>
    Object.fromEntries(
      Object.entries(obj).filter(([, v]) => {
        if (v == null || v === "") return false;
        if (Array.isArray(v) && v.length === 0) return false;
        return true;
      })
    );

  // `next` = the drawer/owner filters (kept as the merge base); the applied
  // org-hierarchy scope is always merged in fresh so stale scope keys can't
  // linger. The KPI query and the companies aggregate get the merged filters
  // as-is (companies = group-by of exactly this filtered set); the records
  // query additionally carries the selected company (exact companyId).
  const pushFilters = (next: Record<string, any>) => {
    lastFiltersRef.current = next;
    const merged = stripEmpty({ ...next, ...scopeSearchFilters });
    setKpiSmartSearch(merged);
    setCompaniesSmartSearch(merged);
    const company = selectedCompanyRef.current;
    setSmartSearch(
      company?.companyId != null
        ? { ...merged, companyId: company.companyId }
        : merged
    );
    setSelectedFilterValuesAfterRun({ ...merged, orgId: organisationId });
  };

  const handleSelectCompany = (row: any) => {
    if (row?.companyId == null) return;
    selectedCompanyRef.current = row;
    setSelectedCompany(row);
    setCurrentPage(1);
    pushFilters(lastFiltersRef.current);
  };

  // Same scroll-into-view UX as My Client Portfolio: the records section
  // renders after selection, then scrolls under the companies table.
  useEffect(() => {
    if (selectedCompany && recordsSectionRef.current) {
      const timer = setTimeout(() => {
        recordsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedCompany]);

  // Re-push whenever the applied scope changes (View Report / auto-apply) so the
  // table + KPIs reflect the new organisation/SBU/vertical/branch.
  useEffect(() => {
    if (!skipQuery && orgScope.hasReport) {
      pushFilters(lastFiltersRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeSearchFilters, orgScope.hasReport]);

  useEffect(() => {
    if (error && error.status === 504) {
      dispatch(setToastMessage(UNAVAILABLE_ERROR_MESSAGE));
    }
  }, [error]);

  // Company (selectFieldByApi field in the always-visible toolbar, bound to
  // the same formMethods as the drawer's SO-fields) applies immediately on
  // selection — not per keystroke — same UX RO Enhanced uses.
  const toolbarCompany = formMethods?.watch("companyName") as
    | { value: number; label: string }
    | undefined;

  useEffect(() => {
    if (skipQuery) return;
    const base = { ...lastFiltersRef.current };
    if (toolbarCompany?.label) base.companyName23 = toolbarCompany.label;
    else delete base.companyName23;
    pushFilters(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolbarCompany, skipQuery]);

  // The toolbar company pick, captured DIRECTLY from the select's own
  // onChange (invokeFunction/onActionMap) — the one channel that can't be
  // missed by form-subscription timing. Re-pushes the filters (which feed the
  // companies aggregate, KPIs, and records alike), so every query reacts to
  // the pick even if the watch-based effect above doesn't fire.
  const handleToolbarCompanyPick = (newValue?: any) => {
    const pick =
      newValue && typeof newValue === "object" && newValue.value != null
        ? { value: newValue.value, label: newValue.label ?? "" }
        : null;
    if (skipQuery) return;
    const base = { ...lastFiltersRef.current };
    if (pick?.label) base.companyName23 = pick.label;
    else delete base.companyName23;
    pushFilters(base);
  };

  // The APPLIED accordion owner + view-by, the page's only owner channel.
  const ownerLevelKey = soScopeConfig.ownerLevel?.key;
  const appliedOwnerId = ownerLevelKey
    ? orgScope.appliedSelection?.[ownerLevelKey]
    : undefined;

  // Selecting an owner must update ONLY the listing, never the Organisation /
  // SBU / Branch cards above — those stay at their hierarchy totals as you
  // drill. So we deliberately do NOT feed the applied owner into the widget's
  // aggregates: passing userId there made the backend re-scope org/SBU/branch
  // AS that owner, collapsing every card to that person's number the instant
  // View Report was clicked — and those are the very cards you picked from.
  // The owner accordion carries its own Manager/Team view-by via the widget's
  // ownerAggregateParams, independent of this. Same as Client Portfolio.
  const orgWidgetExtraParams = useMemo(() => ({}), []);

  // Owner accordion → listing (one-way). Whenever an owner is applied (a card
  // click, or the auto-selected self on branch pick) push ownerId + viewBy;
  // an explicit ownerId always scopes server-side, even for leadership roles,
  // so the table matches the selected card's numbers. Compared against the
  // last push so refreshes of the same applied state are no-ops.
  useEffect(() => {
    if (skipQuery) return;
    const viewBy = orgScope.appliedOwnerViewBy;
    const current = lastFiltersRef.current;
    
    if (appliedOwnerId == null) {
      if (current.ownerId == null) return;
      const { ownerId: _staleOwnerId, viewBy: _staleViewBy, ...withoutOwner } =
        current;
      pushFilters(withoutOwner);
      return;
    }
    if (
      Number(current.ownerId) === Number(appliedOwnerId) &&
      (current.viewBy ?? "team") === viewBy
    )
      return;
    pushFilters({
      ...current,
      ownerId: appliedOwnerId,
      viewBy,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedOwnerId, orgScope.appliedOwnerViewBy, skipQuery]);

  // Companies table query: the SAME listing request the KPI query makes
  // (identical smartSearch — drawer filters, toolbar company, owner, org
  // scope — pushed via pushFilters) with companyGrain=true, so the backend
  // returns per-company aggregates of exactly the filtered record set.
  // Companies, KPIs, and the drilldown records always reconcile.
  const {
    rowData: companyRowData,
    totalRows: companyTotalRows,
    currentPage: companyCurrentPage,
    loading: companiesLoading,
    setCurrentPage: setCompanyCurrentPage,
    pageSize: companyPageSize,
    setPageSize: setCompanyPageSize,
    PAGE_SIZE_OPTIONS: COMPANY_PAGE_SIZE_OPTIONS,
    setSort: setCompaniesSort,
    setSmartSearch: setCompaniesSmartSearch,
    columnOrder: companyColumnOrder,
    setColumnOrder: setCompanyColumnOrder,
  } = useTableController({
    endpoint: endPoints.allOpurtunities,
    searchFieldName: "companyName23",
    customPathParam: `${scopeCustomPath}&companyGrain=true`,
    enabled: !skipQuery && orgScope.hasReport,
    defaultFieldName: "expiryDate",
  });

  const restoredFiltersRef = useRef<Record<string, any> | undefined>(
    hasMountedSincePageLoad ? location.state?.filters : undefined
  );
  useEffect(() => {
    hasMountedSincePageLoad = true;
  }, []);

  const smartSearchSeedRef = useRef(defaultValues);

  const seededDefaultsRef = useRef<string>();
  
  const skipNextDefaultsSeedRef = useRef(false);
  useEffect(() => {
    if (!formMethods) return;
    const serialized = JSON.stringify(defaultValues);
    // Consumed BEFORE the equality check so a reset always disarms it, even
    // when the recomputed defaults happen to serialize identically.
    if (skipNextDefaultsSeedRef.current) {
      skipNextDefaultsSeedRef.current = false;
      seededDefaultsRef.current = serialized;
      return;
    }
    if (seededDefaultsRef.current === serialized) return;
    if (seededDefaultsRef.current !== undefined && formMethods.formState.isDirty) {
      seededDefaultsRef.current = serialized;
      return;
    }
    seededDefaultsRef.current = serialized;
    // Carry the hidden org ids through the reset — the org-sync effect writes
    // them with setValue, which never marks the form dirty, so a reset seeded
    // from defaultValues alone would blank them and leave Vertical's
    // SBU-scoped lookup with nothing to query.
    const seedValues = restoredFiltersRef.current ?? defaultValues;
    formMethods.reset({
      ...seedValues,
      organisationId: orgScope.appliedSelection?.organisation ?? 0,
      sbuId: orgScope.appliedSelection?.unit ?? "",
    });
    pushFilters({
      ...lastFiltersRef.current,
      ...(sanitizeOpportunityFilters(seedValues) || {}),
    });
    setSkipQuery(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formMethods, defaultValues]);

  // Reset must only clear the drawer's own SO-fields, not the whole form —
  // handleReset()'s formMethods.reset(searchDefaultValues) resets EVERY field
  // on the shared form, which would also wipe the always-visible toolbar's
  // company + owner selections since they live on the same formMethods
  // instance.
  const onReset = () => {
    if (!formMethods) return;
   
    restoredFiltersRef.current = undefined;
    // See skipNextDefaultsSeedRef: the persist at the end of this handler
    // feeds back into defaultValues, and without this the seed effect would
    // undo the clear.
    skipNextDefaultsSeedRef.current = true;
    const current = formMethods.getValues();
    const next = { ...current };
    soFilterConfig.forEach((field: any) => {
      next[field.name] = (systemSmartSearchDefaultValues as any)?.[field.name];
    });
    formMethods.reset(next);
    setSearchTerm("");
    // Push immediately so the cleared drawer filters take effect in the
    // actual query right away — otherwise the old values linger in
    // lastFiltersRef.current until the drawer happens to be re-applied or
    // the org scope changes. The accordion-owned owner channel (ownerId +
    // viewBy) survives a drawer reset untouched.
    const sanitized = sanitizeOpportunityFilters(next) || {};
    const { companyName23, ownerId, viewBy } = lastFiltersRef.current;
    const resetFilters = {
      ...sanitized,
      ...(companyName23 != null && { companyName23 }),
      ...(ownerId != null && { ownerId, viewBy }),
    };
    pushFilters(resetFilters);
    // Persist the org/period scope alongside the cleared drawer filters —
    // Reset doesn't touch org scope, but updateUserDefaultConfig replaces
    // the entity's whole saved blob, so omitting it here would wipe out
    // whatever org scope Save View had previously persisted.
    dispatch(
      updateUserDefaultConfig({
        // Silent: Clear all persists in the background and the chips
        // disappearing is the feedback — a toast on top is noise.
        successMessage: null,
        entityKey: TABLE_CONTROLLER_ENTITY_KEY.soCompaniesEntity,
        selectedFilterValues: {
          ...resetFilters,
          orgScope: orgScope.appliedSelection
            ? {
                selection: orgScope.appliedSelection,
                selectedNodes: orgScope.selectedNodes,
                timeline: orgScope.appliedTimeline,
                grouping: orgScope.grouping,
                ownerViewBy: orgScope.appliedOwnerViewBy,
              }
            : undefined,
        },
        columns: buildColumnSettingsPayload(companyColumnOrder),
      }) as any
    );
  };

  // Apply (drawer): commit EVERYTHING together — the additional-filter fields
  // (including View by), the toolbar company + owner, and the applied org
  // scope (merged inside pushFilters). This is the single commit point for
  // the drawer; nothing inside the drawer touches the query until Apply.
  const handleRun = () => {
    restoredFiltersRef.current = undefined;
    tableSelectionApiRef.current?.clearSelection?.();
    const sanitized = sanitizeOpportunityFilters(selectedValues) || {};
    const { ownerId, viewBy } = lastFiltersRef.current;
    pushFilters({
      ...sanitized,
      ...(toolbarCompany?.label && { companyName23: toolbarCompany.label }),
      ...(ownerId != null && { ownerId, viewBy }),
    });
  };

  const { localizationData } = useLocalization();
  const columns = React.useMemo(
    () => getColumns(localizationData?.data),
    [localizationData]
  );
  // KPIs from the dedicated whole-scope query — never company-scoped.
  const kpis = opportunityData(kpiOverallData, kpiTotalRows);

  const companyColumns = React.useMemo(
    () => getCompanyColumns(localizationData?.data),
    [localizationData]
  );

  // "View details" action per company row — same component/flow as My Client
  // Portfolio's CompanyOverView.
  const CompanyActionButtonRenderer = (params: any) => (
    <ActionButton
      onClick={() => handleSelectCompany(params.data)}
      buttonText={VIEW_DETAILS}
      imageSrc={showIcon}
      imageStyles={{ width: "20px", height: "20px" }}
      customStyles={{ gap: "10px", border: "none" }}
    />
  );

  // Customer Name navigates to the company details page; any other
  // non-button cell click selects the row in place (portfolio behavior).
  const onCompanyCellClicked = (event: CellClickedEvent) => {
    const target = event?.event?.target as HTMLElement | null;
    const clickedInsideButton =
      !!target?.closest("button") || !!target?.closest('[role="button"]');
    if (clickedInsideButton) return;
    if (event.colDef.field === "companyName" && event.data?.companyId != null) {
      const destinationConfig = {
        label: event.data?.companyName,
        path: `/companies/${event.data.companyId}`,
        key: DETAILS_KEYS.COMPANY,
      };
      navigate(destinationConfig.path, {
        state: buildBreadcrumbState({
          breadcrumbs: soBreadcrumb,
          crumb: destinationConfig,
          state: { from: "SO", ...(filtersToPersist && Object.keys(filtersToPersist).length > 0 ? { filters: filtersToPersist } : {}) },
        }),
      });
      return;
    }
    handleSelectCompany(event.data);
  };

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
  // register on the shared form so the lookup has something to read; nothing
  // renders them, and the query still gets its org scope through
  // scopeSearchFilters exactly as before.
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

  // Hidden SmartSearch keeps formMethods wired into the query layer; the visible
  // fields render inside the drawer via the shared FilterDrawer.
  const smartsearchConfig = useMemo(
    () => [
      ...hiddenOrgFields,
      GeneratesmartSearchTitleConfig("SO"),
      ...(verticalField ? [verticalField] : []),
      ...tableSearchConfig(
        companyContactId,
        organisationId,
        false,
        canViewBD,
        canViewISG
      ),
    ] as FormFieldConfig[],
    [hiddenOrgFields, verticalField, companyContactId, organisationId, canViewBD, canViewISG]
  );

  // Company + owner live in the always-visible toolbar (selectFieldByApi,
  // same field type/config the rest of the app uses for API-backed search),
  // not the drawer.
  const toolbarFieldConfig = useMemo(
    () =>
      tableSearchConfig(companyContactId, organisationId, false, canViewBD, canViewISG)
        .filter((field: any) => SO_ENHANCED_TOOLBAR_FIELD_NAMES.includes(field.name))
        // Direct pick callback (see handleToolbarCompanyPick) — resolved via
        // the toolbar DynamicForm's onActionMap.
        .map((field: any) =>
          field.name === "companyName"
            ? { ...field, invokeFunction: "onToolbarCompanyPick" }
            : field
        ),
    [companyContactId, organisationId, canViewBD, canViewISG]
  );

  // SO-only fields for the drawer (drop company/owner — they live in the
  // toolbar). Period lives entirely in the Organization filter's own
  // timeline control now, so it's not duplicated here. Vertical leads the
  // list: it's the org-level filter the accordion no longer offers.
  const soFilterConfig = useMemo(
    () =>
      [
        GeneratesmartSearchTitleConfig("SO"),
        ...(verticalField ? [verticalField] : []),
        ...tableSearchConfig(companyContactId, organisationId, false, canViewBD, canViewISG).filter(
          (field: any) => !SO_ENHANCED_TOOLBAR_FIELD_NAMES.includes(field.name)
        ),
      ].map((field: any) => ({ ...field, gridColumn: 12 })),
    [verticalField, companyContactId, organisationId, canViewBD, canViewISG]
  );

  const appliedFilterFieldConfig = useMemo(
    () =>
      soFilterConfig
        .filter(
          (field: any) =>
            field.name && field.type !== "title" && field.type !== "segmentedcontrol"
        )
        .map((field: any) => ({ name: field.name, label: field.label })),
    [soFilterConfig]
  );

  const removeFilterValue = (fieldName: string, itemValue?: any) => {
    if (!formMethods) return;
    const current = formMethods.getValues(fieldName);
    const next = Array.isArray(current)
      ? current.filter((v: any) => v !== itemValue)
      : null;
    formMethods.setValue(fieldName, next);
    const sanitized = sanitizeOpportunityFilters(formMethods.getValues()) || {};
    const { companyName23, ownerId, viewBy } = lastFiltersRef.current;
    pushFilters({
      ...sanitized,
      ...(companyName23 != null && { companyName23 }),
      ...(ownerId != null && { ownerId, viewBy }),
    });
  };

  // Sourced from selectedFilterValuesAfterRun (the last pushFilters snapshot),
  // not the live selectedValues watch — chips must reflect what's actually
  // driving the query, not an unapplied draft selection in the drawer.
  const appliedFilterGroups = useMemo(
    () =>
      buildAppliedFilterGroups(
        appliedFilterFieldConfig,
        selectedFilterValuesAfterRun,
        removeFilterValue
      ),
    [appliedFilterFieldConfig, selectedFilterValuesAfterRun]
  );

  // Everything Save View needs to reproduce the current screen: the SO-fields
  // + toolbar company/owner (all already in selectedValues, since they're
  // regular fields on the same watched form now), and the applied org/period
  // scope. Table's built-in Save View button persists + restores this
  // exactly like SmartSearch pages do.
  const filtersForSaveView = {
    ...selectedValues,
    orgScope: orgScope.appliedSelection
      ? {
          selection: orgScope.appliedSelection,
          selectedNodes: orgScope.selectedNodes,
          timeline: orgScope.appliedTimeline,
          grouping: orgScope.grouping,
          ownerViewBy: orgScope.appliedOwnerViewBy,
        }
      : undefined,
  };

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const filtersToPersist = useMemo(() => {
    if (selectedValues && Object.keys(selectedValues).length > 0) return selectedValues;
    if (location.state?.filters) return location.state.filters;
    return undefined;
  }, [location.state?.filters, selectedValues]);

  const breadcrumbState = useMemo(() => {
    const state: Record<string, unknown> = {};
    if (filtersToPersist && Object.keys(filtersToPersist).length > 0) {
      state.filters = filtersToPersist;
    }
    if (orgScope.appliedSelection) {
      state.scope = {
        selection: orgScope.appliedSelection,
        selectedNodes: orgScope.selectedNodes,
        timeline: orgScope.appliedTimeline,
        grouping: orgScope.grouping,
        ownerViewBy: orgScope.appliedOwnerViewBy,
      };
    }
    return Object.keys(state).length > 0 ? state : undefined;
  }, [
    filtersToPersist,
    orgScope.appliedSelection,
    orgScope.selectedNodes,
    orgScope.appliedTimeline,
    orgScope.grouping,
    orgScope.appliedOwnerViewBy,
  ]);

  useBreadcrumbTrail({
    label: MANAGE_OPPORTUNITIES_ENHANCED,
    path: "/opportunities-enhanced",
    key: BREADCRUMB_KEYS.SALES_OPPORTUNITY,
    state: breadcrumbState,
  });

  const soBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: MANAGE_OPPORTUNITIES_ENHANCED,
            path: "/opportunities-enhanced",
            key: BREADCRUMB_KEYS.SALES_OPPORTUNITY,
            state: { filters: selectedValues ?? null },
          }),
        ];

  const handleCreateOpportunity = () => {
    navigate("/create", {
      state: { pageTitle: OPPORTUNITY, cta: "createOpportunity", originPath: "/opportunities" },
    });
  };

  const onCellClicked = (event: CellClickedEvent) => {
    const filtersState =
      filtersToPersist && Object.keys(filtersToPersist).length > 0
        ? { filters: filtersToPersist }
        : {};

    if (event.colDef.field === "companyName") {
      const dest = {
        label: `${event.data.companyName}`,
        path: `/companies/${event.data.companyId}`,
        key: DETAILS_KEYS.COMPANY,
      };
      navigate(dest.path, {
        state: buildBreadcrumbState({
          breadcrumbs: soBreadcrumb,
          crumb: dest,
          state: { from: "SO", ...filtersState },
        }),
      });
    } else if (
      event.colDef.field === "policyType" ||
      event.colDef.field === "activityName"
    ) {
      const dest = {
        label: DETAILS_LABELS.SALES_OPPORTUNITY,
        path: `/opportunities/${event.data.opportunityId}`,
        key: DETAILS_KEYS.SALES_OPPORTUNITY,
      };
      navigate(dest.path, {
        state: buildBreadcrumbState({
          breadcrumbs: soBreadcrumb,
          crumb: dest,
          state: {
            companyId: event.data.companyId,
            opportunityId: event.data.opportunityId,
            from: "SO",
            ...filtersState,
          },
        }),
      });
    } else if (event.colDef.field === "contacts") {
      const dest = {
        label: CONTACTS,
        path: `/contact/${event.data.contacts[0].id}`,
        key: DETAILS_KEYS.SALES_OPPORTUNITY,
      };
      navigate(dest.path, {
        state: buildBreadcrumbState({
          breadcrumbs: soBreadcrumb,
          crumb: dest,
          state: {
            companyId: event.data.companyId,
            opportunityId: event.data.opportunityId,
            from: "SO",
            ...filtersState,
          },
        }),
      });
    } else if (event.colDef.field === "opportunityId") {
      const rowData = event.data;
      if (rowData.opportunityId) {
        const dest = {
          label: DETAILS_LABELS.SALES_OPPORTUNITY,
          path: `/opportunities/${rowData.opportunityId}`,
          key: DETAILS_KEYS.SALES_OPPORTUNITY,
        };
        navigate(dest.path, {
          state: buildBreadcrumbState({
            breadcrumbs: soBreadcrumb,
            crumb: dest,
            state: {
              companyId: rowData.companyId,
              opportunityId: rowData.opportunityId,
              from: "SO",
              ...filtersState,
            },
          }),
        });
      }
    }
  };

  return (
    <OpportunitiesEnhancedListingContainer>
      {existingBreadcrumbs?.length > 0 ? (
        <BreadCrumbWrapper>
          <CommonBreadcrumb crumbs={breadCrumbs({})} />
        </BreadCrumbWrapper>
      ) : (
        <TitleContainer variant="h1">{MANAGE_OPPORTUNITIES_ENHANCED}</TitleContainer>
      )}

      {/* Hidden SmartSearch: wires formMethods into the query layer. The visible
          fields render in the filter drawer via the shared FilterDrawer. */}
      <HiddenSearchWrapper aria-hidden>
        <CardBackground>
          <SmartSearch
            searchFormConfig={smartsearchConfig}
            searchFormMethods={setFormMethods}
            selectedValues={selectedValues}
            searchDefaultValues={smartSearchSeedRef.current}
            onReset={onReset}
            formMethods={formMethods}
            searchFieldName="companyName23"
            placeholder={SEARCH}
            enableSmartSearch={true}
            onRunFilters={handleRun}
          />
        </CardBackground>
      </HiddenSearchWrapper>

      {/* Org accordion is locked for EVERY role — the org is changed via the
          period popover's Organisation filter instead (selectable only for
          leadership/superusers). The useOrgScope-level lock stays role-based
          so the popover CAN move the org for privileged users. */}
      <OrgFinancialFilter
        config={soScopeConfig}
        api={orgScope}
        hideRootSummary={!isPrivileged}
        lockedLevels={[orgLevelKey]}
        popoverOrgFilter={{ disabled: !isPrivileged }}
        periodDateNote={SO_ENHANCED_PERIOD_DATE_NOTE}
        extraAggregateParams={orgWidgetExtraParams}
      />

      {/* The report area (table + its search/filter toolbar) shows only for a
          report matching the CURRENT org scope: nothing until View Report is
          clicked, and it collapses again the moment any card changes, so a
          stale scope can never be misread as live data. The filter's own
          "Scope changed" hint says what to do. */}
      {orgScope.hasReport && !orgScope.isStale && (
        <>
          {orgScope.hasReport && <KPICards data={kpis} localization={localizationData?.data} />}

          {/* Companies first (portfolio-style): the toolbar/drawer live on
              this primary table; View details on a row reveals that company's
              opportunity records below. */}
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
                    onActionMap={{
                      onToolbarCompanyPick: handleToolbarCompanyPick,
                    }}
                  />
                </ToolbarFieldsWrapper>
              ),
              filterButtonAriaLabel: "SO filters",
              filterButtonTestId: "so-filter-button",
              drawerTitle: "SO filters",
              drawerWidth: "420px",
              renderFilterContent: (close) => (
                <FilterDrawer
                  formConfig={soFilterConfig}
                  defaultValues={defaultValues}
                  existingMethods={formMethods}
                  resetTestId="so-filter-reset"
                  applyTestId="so-filter-apply"
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
                onClearAll: onReset,
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
            setSort={setCompaniesSort}
            components={{ ChipRenderer, ActionButton: CompanyActionButtonRenderer }}
            {...(canCreateOpportunity && {
              primaryActionLabel: CREATE_OPPORTUNITY,
              onPrimaryActionClick: handleCreateOpportunity,
            })}
            setColumnOrder={setCompanyColumnOrder}
            columnOrder={companyColumnOrder}
            entityKey={TABLE_CONTROLLER_ENTITY_KEY.soCompaniesEntity}
            selectedFilterValues={filtersForSaveView}
            selectedFilterValuesAfterRun={selectedFilterValuesAfterRun}
          />

          {/* Selected company's opportunity records — same columns/click
              behavior the page's single table had, now scoped by companyId. */}
          {selectedCompany && (
            <RecordsSectionWrapper ref={recordsSectionRef}>
              <Table
                columns={columns}
                rowData={rowData}
                totalRows={totalRows}
                currentPage={currentPage}
                title={`${LIST_OF_RECORDS} - ${selectedCompany.companyName ?? ""}`}
                setCurrentPage={setCurrentPage}
                loading={loading}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                setPageSize={setPageSize}
                onCellClicked={onCellClicked}
                components={{ ChipRenderer, DateStatusDotRenderer }}
                setSort={setSort}
                setColumnOrder={setColumnOrder}
                columnOrder={columnOrder}
                // Records table owns soEnhancedEntity for COLUMNS ONLY: it has
                // no filter bar, so its Save View posts an empty filterJson.
                // The page's filters live on soCompaniesEntity.
                entityKey={TABLE_CONTROLLER_ENTITY_KEY.soEnhancedEntity}
                enableRowSelection={canBulkEditOpportunities}
                rowSelectionIdKey="opportunityId"
                refetch={refetch}
                selectionApiRef={tableSelectionApiRef}
              />
            </RecordsSectionWrapper>
          )}
        </>
      )}
    </OpportunitiesEnhancedListingContainer>
  );
};

export default OpportunitiesEnhancedListing;
