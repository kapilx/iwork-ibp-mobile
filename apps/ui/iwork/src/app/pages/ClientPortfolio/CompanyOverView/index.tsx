import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  CellContainer,
  CompanyListingContainer,
  PremiumSpan,
  StyledCellPremium,
  TitleContainer,
  CardBackground,
  PolicyTableContainer,
} from "./styles";
import {
  SmartSearch,
  useTableController,
  endPoints,
  useFormWatcher,
  useLocalization,
  KPICards,
  Table,
  ChipRenderer,
  FormFieldConfig,
  formatCurrencyByLocalization,
  COMPANY_OVERVIEW_SUBTITLE,
  COMPANY_OVERVIEW,
  CLIENT_PORTFOLIO,
  CommonBreadcrumb,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  BREADCRUMB_KEYS,
  buildBreadcrumbState,
  DETAILS_KEYS,
} from "@ui/ui-lib";
import {
  getColumns,
  kpisData,
  tableSearchConfig,
  clientPortfolioBreadcrumbs,
  PORTFOLIO_COMPANY_TYPE_FILTER_KEY,
  COMPANY_TYPE_LOOKUP_NAME,
} from "./tableConfig";
import { PolicySearchConfig } from "../../PolicyPage/Constants";
import {
  GeneratesmartSearchTitleConfig,
  periodConfig,
  smartSearchConfig,
} from "../../../Utils/smartSearchConfig";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton";
import CompanyPolicies from "../CompanyPolicies";
import CompanyOpportunities from "../CompanyOpportunities";
import { CellClickedEvent } from "ag-grid-community";
import { useLocation, useNavigate } from "react-router-dom";
import CompanyServiceScore from "../CompanyServiceScore";
import showIcon from "../../../assets/svgs/eye.svg";
import { TABLE_CONTROLLER_ENTITY_KEY } from "../../../constants";
import { useDispatch, useSelector } from "react-redux";

export const soRoPremiumCell = (premium: string, countValue: string) => {
  return (
    <CellContainer>
      <PremiumSpan>{premium}</PremiumSpan>
      <StyledCellPremium>{countValue}</StyledCellPremium>
    </CellContainer>
  );
};
const CompanyOverview: React.FC = () => {
  const [selectedCompanyData, setSelectedCompanyData] = useState<any | null>(
    null
  );

  // Add ref for scrolling to CompanyPolicies
  const companyPoliciesRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const systemSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.clientPortfolioEntity
      ]
  );
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.clientPortfolioEntity
      ]
  );

  const defaultValues = useMemo(
    () => ({
      ...(userSmartSearchDefaultValues || systemSmartSearchDefaultValues || {}),
      period: "",
      month: "",
      from: "",
      to: "",
    }),
    [userSmartSearchDefaultValues, systemSmartSearchDefaultValues]
  );

  const { localizationData } = useLocalization();
  const columns = React.useMemo(
    () => getColumns(localizationData?.data),
    [localizationData]
  );

  const location = useLocation();

  const initialTotalRowsRef = useRef<number | null>(null);

  const [skipQuery, setSkipQuery] = useState(true);
  // "Past Companies" view — show companies whose policies have expired.
  const [pastCompanies, setPastCompanies] = useState(false);
  // Service score threshold (">90", ">80", ">70", "<70") — applied server-side
  const [serviceScoreFilter, setServiceScoreFilter] = useState<
    string | undefined
  >(undefined);
  const extractServiceScoreValue = (val: any): string | undefined => {
    if (!val) return undefined;
    if (typeof val === "string") return val || undefined;
    if (typeof val === "object" && typeof val.value === "string") {
      return val.value || undefined;
    }
    return undefined;
  };
  const customPathParam = useMemo(() => {
    const parts: string[] = [];
    if (pastCompanies) parts.push("pastCompanies=true");
    if (serviceScoreFilter)
      parts.push(`serviceScore=${encodeURIComponent(serviceScoreFilter)}`);
    return parts.length ? parts.join("&") : undefined;
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
    setSearchTerm,
    overallData,
    setSort,
    setSmartSearch,
    setColumnOrder,
    columnOrder,
  } = useTableController({
    endpoint: endPoints.portfolioCompanies,
    searchFieldName: "companyName",
    enabled: !skipQuery,
    defaultFieldName: "policyFrom",
    customPathParam,
  });

  useEffect(() => {
    if (initialTotalRowsRef.current === null && totalRows > 0) {
      initialTotalRowsRef.current = totalRows;
    }
  }, [totalRows]);

  // Keep the actions (eye icon) column first, regardless of stored order.
  useEffect(() => {
    const i = columnOrder?.findIndex((c: any) => c?.field === "actions") ?? -1;
    if (i > 0)
      setColumnOrder((p: any[]) => {
        const n = [...p];
        n.unshift(n.splice(i, 1)[0]);
        return n;
      });
  }, [columnOrder, setColumnOrder]);

  // Add useEffect to scroll when selectedCompanyData changes
  useEffect(() => {
    if (selectedCompanyData && companyPoliciesRef.current) {
      // Small delay to ensure the component is rendered before scrolling
      setTimeout(() => {
        companyPoliciesRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [selectedCompanyData]);

  const kpis = kpisData(overallData?.kpiData || {});

  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();

  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchFieldName: "companyName",
    searchDefaultValues: defaultValues,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.clientPortfolioEntity,
    columnOrder,
    dispatch,
  });

  const sanitizeFilters = (vals: any) => {
    const { serviceScore: _serviceScore, status: _status, ...rest } = vals || {};
    return rest;
  };
  const handleRun = () => {
    setSelectedCompanyData(null);
    setSmartSearch(sanitizeFilters(selectedValues));
    setServiceScoreFilter(extractServiceScoreValue(selectedValues?.serviceScore));
  };

  const prefilledFilterValues = useMemo(() => {
    if (location.state && location.state?.filters) {
      return { ...location.state.filters };
    }
  }, [location.state]);

  useEffect(() => {
    // Wait for the default filter config (carries ownerId/viewBy/org scope) to
    // load before firing the first query — otherwise the initial request goes
    // out unscoped and returns every company.
    const defaultsReady =
      Boolean(prefilledFilterValues) ||
      Boolean(userSmartSearchDefaultValues) ||
      Boolean(systemSmartSearchDefaultValues);
    if (formMethods && skipQuery && defaultsReady) {
      const defValues = prefilledFilterValues || defaultValues;
      formMethods.reset(defValues);
      setSmartSearch(sanitizeFilters(defValues)); // strip status/serviceScore
      setServiceScoreFilter(extractServiceScoreValue(defValues?.serviceScore));
      setSkipQuery(false);
    }
  }, [
    formMethods,
    skipQuery,
    selectedValues,
    prefilledFilterValues,
    userSmartSearchDefaultValues,
    systemSmartSearchDefaultValues,
    defaultValues,
    setSmartSearch,
  ]);

  // when navigated from clientPortfolio detail, preselect that row (once)
  useEffect(() => {
    if (
      location.state?.from === "clientPortfolio" &&
      location.state?.companyData
    ) {
      setSelectedCompanyData(location.state.companyData);
    }
  }, [location.state?.from, location.state?.companyData]);

  const prevSearchNameRef = useRef<string | null>(null);
  useEffect(() => {
    const searchName =
      typeof selectedValues?.companyName === "string"
        ? selectedValues.companyName
        : "";
    if (prevSearchNameRef.current === null) {
      prevSearchNameRef.current = searchName;
      return;
    }
    if (prevSearchNameRef.current !== searchName) {
      prevSearchNameRef.current = searchName;
      setSelectedCompanyData(null);
    }
  }, [selectedValues?.companyName]);

  const smartsearchConfig = useMemo(() => {
    // Company type filter (keyed to the policy-context attribute map so it filters
    // the policy-driven results by the company's type).
    const companyTypeField: FormFieldConfig = {
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
    };
    // Company priority comes from the policy filter config (it filters on company.priority).
    const companyPriorityField = PolicySearchConfig().filter(
      (field) => field.key === "policyCompanyPriority"
    );
    // Service score retained for parity with the original screen (display-only).
    const serviceScoreField = tableSearchConfig.filter(
      (field) => field.key === "serviceScore"
    );
    // Policy filters: drop company name (search box covers it) and company priority
    // (moved to the Company section); push insurer to the end.
    const policyFields = PolicySearchConfig().filter(
      (field) =>
        field.key !== "companyName" && field.key !== "policyCompanyPriority"
    );
    const insurerField = policyFields.filter(
      (field) => field.key === "insurerId"
    );
    const otherPolicyFields = policyFields.filter(
      (field) => field.key !== "insurerId"
    );

    return [
      ...smartSearchConfig,
      GeneratesmartSearchTitleConfig("Period (Policy from)"),
      ...periodConfig(false, selectedValues?.from, selectedValues?.to),
      GeneratesmartSearchTitleConfig("Company"),
      companyTypeField,
      ...companyPriorityField,
      ...serviceScoreField,
      GeneratesmartSearchTitleConfig("Policy"),
      ...otherPolicyFields,
      ...insurerField,
    ];
  }, [selectedValues?.from, selectedValues?.to]);

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const clientPortfolioBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: CLIENT_PORTFOLIO,
            path: "/my-client-portfolio",
            key: BREADCRUMB_KEYS.CLIENT_PORTFOLIO,
            state: {
              filters: selectedValues ? selectedValues : null,
            },
          }),
        ];

  const ActionButtonRenderer = (params: any) => {
    return (
      <ActionButton
        onClick={() => {
          // Store the complete company data instead of just the ID
          setSelectedCompanyData(params.data);
        }}
        buttonText=""
        imageSrc={showIcon}
        imageStyles={{ width: "20px", height: "20px" }}
        customStyles={{ gap: "10px", border: "none" }}
      />
    );
  };
  // Renders "premium (#count)" cells for Policy / RO / SO columns. The premium
  // and count field names are supplied per column via cellRendererParams.
  const PremiumCountCell = (params: any) => {
    const premiumValue = params?.data?.[params?.premiumField];
    const countValue = params?.data?.[params?.countField] ?? 0;
    const premium =
      premiumValue != null
        ? formatCurrencyByLocalization(premiumValue, localizationData?.data)
        : "--";
    return soRoPremiumCell(premium, `(#${countValue})`);
  };

  const onCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "companyName") {
      const destinationConfig = {
        label: event.data.companyName,
        path: `/companies/${event?.data?.companyId}`,
        key: DETAILS_KEYS.COMPANY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: clientPortfolioBreadcrumb,
        crumb: destinationConfig,

        state: {
          from: "clientPortfolio",
          filters: selectedValues ? selectedValues : null,
          companyData: event?.data,
        },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/companies/${event?.data?.companyId}`, {
      //   state: {
      //     from: "clientPortfolio",
      //     filters: selectedValues ? selectedValues : null,
      //   },
      // });
      return;
    }

    // If the user clicked inside the ActionButton cell, let the button handler do it
    const target = event?.event?.target as HTMLElement | null;
    const clickedInsideButton =
      !!target?.closest("button") || !!target?.closest('[role="button"]');
    if (clickedInsideButton) return;

    // Any other cell → select row and show details below the table
    setSelectedCompanyData(event.data);
  };

  return (
    <CompanyListingContainer>
      {location?.state?.formDashboard ? (
        <CommonBreadcrumb crumbs={clientPortfolioBreadcrumbs} />
      ) : (
        <TitleContainer variant="h1">{CLIENT_PORTFOLIO}</TitleContainer>
      )}

      <CardBackground>
        <SmartSearch
          searchFormConfig={smartsearchConfig}
          searchDefaultValues={defaultValues}
          searchFormMethods={setFormMethods}
          selectedValues={selectedValues}
          onReset={handleReset}
          formMethods={formMethods}
          searchFieldName="companyName"
          placeholder="Search by company name"
          enableSmartSearch={true}
          onRunFilters={handleRun}
        />
      </CardBackground>

      <KPICards data={kpis} showPercentage={false} />

      <Table
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
        components={{
          ActionButton: ActionButtonRenderer,
          ChipRenderer,
          PremiumCountCell,
        }}
        height={590}
        domLayout="autoHeight"
        onCellClicked={onCellClicked}
        title={COMPANY_OVERVIEW}
        subTitle={COMPANY_OVERVIEW_SUBTITLE}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.clientPortfolioEntity}
        selectedFilterValues={selectedValues}
      />

      {/* Render policies table when a row's action button is clicked */}
      {selectedCompanyData && (
        <PolicyTableContainer ref={companyPoliciesRef}>
          <CompanyPolicies
            companyData={selectedCompanyData}
            breadcrumbInfo={clientPortfolioBreadcrumb}
            filters={sanitizeFilters(selectedValues)}
            pastCompanies={pastCompanies}
          />
          {!pastCompanies && (
            <>
              <CompanyOpportunities
                companyData={selectedCompanyData}
                type="RO"
                title="Renewal opportunities"
                breadcrumbInfo={clientPortfolioBreadcrumb}
                filters={sanitizeFilters(selectedValues)}
              />
              <CompanyOpportunities
                companyData={selectedCompanyData}
                type="SO"
                title="Sales opportunities"
                breadcrumbInfo={clientPortfolioBreadcrumb}
                filters={sanitizeFilters(selectedValues)}
              />
            </>
          )}
          <CompanyServiceScore companyData={selectedCompanyData} />
        </PolicyTableContainer>
      )}
    </CompanyListingContainer>
  );
};

export default CompanyOverview;
