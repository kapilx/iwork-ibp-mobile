import {
  Button,
  CommonBreadcrumb,
  CustomTabs,
  Table,
  NestedGroupedDataCollectionHandle,
  ProfileSection,
  StrategySection,
  SummaryCard,
  endPoints,
  FormFieldConfig,
  environment,
  httpMethods,
  setToastMessage,
  useApiQuery,
  useLocalization,
  useLookupIdByKey,
  useApiMutation,
  FeatureKey,
  selectHasPermission,
  POLICY_ALERT_BOX_DETAILS,
  buildBreadcrumbState,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  DETAILS_LABELS,
  DETAILS_KEYS,
  DisplayDocuments,
  CustomModal,
  SmartSearch,
  useFormWatcher,
} from "@ui/ui-lib";
import {
  PolicyDocActivityType,
  policyDocumentsColumns,
} from "./documentsConfig";
import { employeeInsuredColumns } from "./insuredConfig";
import UploadDocumentModal from "./UploadDocumentModal";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CellClickedEvent } from "ag-grid-community";
import PolicyDashboard, {
  PolicyDashboardRef,
} from "../../../components/PolicyDashboard";
import PolicyDetailsCDDetailsTab from "../../../components/PolicyDetailsCDDetailsTab";
import PolicyDetailsExtensionHistoryTab from "../../../components/PolicyDetailsExtensionHistoryTab";
import PolicyDetailsContactsTab from "../../../components/PolicyDetailsContactsTab";
import PolicyDetailsCoversTab from "../../../components/PolicyDetailsCoversTab";
import PolicyDetailsInstallmentsTab from "../../../components/PolicyDetailsInstallmentsTab";
import PolicyEmployeeDataTab from "../../../components/PolicyEmployeeDataTab";
import InsuredDetailsTable from "../../../components/InsuredDetailsTable";
import {
  ACTIVATE_POLICY,
  ACTIVATION_MESSAGES,
  ACTIVE_POLICY,
  ACTIVATE_POLICY_CONFIRMATION,
  RECONFIGURE_POLICY,
  RECONFIGURE_POLICY_CONFIRMATION,
  RECONFIGURE_POLICY_SUCCESS,
  RECONFIGURE_POLICY_ERROR,
  CONFIGURATION_STATUS,
  COMPANY_CONFIGURATION_STATUS,
  CONFIGURE,
  CONFIGURE_POLICY_LABEL,
  CONFIGURE_COMPANY_LABEL,
  NO_DOCUMENTS_AVAILABLE_FOR_POLICY,
  POLICY_SECTION_STATUS_LABELS,
  SECTION_STATUS,
  VIEW_CONFIGURE,
  NO,
  YES,
  POLICY_DETAILS_TABS,
  UTILITY_UPLOAD_ENTITY,
  FINANCIAL_INFO_TABS,
} from "../../../constants";
import {
  cardSections,
  companyTabsConfig,
  policyDetailsViewMoreItems,
  policyAdditionalDetails,
  policyBreadcrumbs,
  policyDetails,
  setLocalizationConfig,
  policyRconDetails,
  policyPremiumAndBrokerageDetails,
  policyPremiumAndBrokerageDetailsLanka,
  insurerDetails,
  tpaDetails,
  companyContacts,
  coInsurer,
  crmAccountManagerDetails,
  premiumInstallmentDetails,
  policyDetailsViewMoreItemsOpportunity,
} from "./detailsConfig";
import {
  clientSpocColumns,
  premiumReceiptsColumns,
  commissionStatementsColumns,
  invoicesColumns,
  collectionsColumns,
} from "./financialInfoTableConfig";
import {
  installmentDates,
  policyDetailsFormConfig,
  premiumAndBrokerageDetails,
  premiumAndBrokerageDetailsLanka,
  rconDetails,
  smartSearchConfig,
} from "./formConfig";
import {
  ActivatePolicyButtonWrapper,
  ButtonContainer,
  ButtonWrapper,
  LoaderContainer,
  OverviewCardBackground,
  PolicyDetailsContainer,
  PolicyDetailsSectionTitle,
  TableContainer,
  priorityStyleMap,
  ActivationModalContent,
  FinancialInfoTitle,
  FinancialInfoSection,
  FinancialInfoSubTitle,
  FinancialInfoTableHeader,
  FinancialInfoSearchWrapper,
} from "./styles";
import { CircularProgress } from "@mui/material";
import {
  GROUP_POLICY_TYPE_KEYS,
  LookUpValues,
} from "../../../constants/lookupValues";
import AssetInsured from "../../../components/AssetInsured";
import {
  EditableDetailsSection,
  RequestAlert,
} from "@ui/ui-lib/commonComponents";

import { calculatePercentageAmountUpdate } from "../../../Utils/calculatePercentageAmountUpdate";
import PolicyActionPanel from "./policyActionPanel";
import { getCountrySpecificConfig } from "../../OpportunityActivities/Constants/countryConfigUtils";
import {
  AutoPopulateConfig,
  useAutoPopulateCalculatedFields,
} from "../../OpportunityActivities/Constants/autoPopulateFields";
import PortalConfigurationTab from "../../../components/PortalConfigurationTab";
import UtilityExcelUploadPage from "../../UtilityExcelUpload";

const sectionMap = {
  policyDetails,
  policyAdditionalDetails,
};

const componentMap: Record<string, React.FC> = {
  ProfileSection,
  StrategySection,
};

const parseNumericInput = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const createBrokerageAutoPopulateConfig = (
  amountField: string,
  baseField: string,
  percentageField: string
): AutoPopulateConfig => ({
  target: {
    section: "premiumAndBrokerageDetails",
    field: amountField,
  },
  fields: [
    { section: "premiumAndBrokerageDetails", field: baseField },
    { section: "premiumAndBrokerageDetails", field: percentageField },
  ],
  compute: ({ values }) => {
    const details = values?.premiumAndBrokerageDetails;

    if (!details || typeof details !== "object") {
      return "";
    }

    const baseNumeric = parseNumericInput(details?.[baseField]);
    const percentageNumeric = parseNumericInput(details?.[percentageField]);

    if (baseNumeric === null || percentageNumeric === null) {
      return "";
    }

    const computedAmount = Number(
      ((baseNumeric * percentageNumeric) / 100).toFixed(2)
    );

    const currentAmountNumeric = parseNumericInput(details?.[amountField]);

    if (
      currentAmountNumeric !== null &&
      Math.abs(currentAmountNumeric - computedAmount) < 0.01
    ) {
      return undefined;
    }

    return computedAmount;
  },
});

// Standalone component so hooks (useState) can be used for table pagination state
const BrokerageInfoTable = ({
  rowData,
  columns,
  setSort,
}: {
  rowData: any[];
  columns: any[];
  // Lifted to the parent so it can rebuild the query URL/queryKey and
  // actually refetch sorted data — an internal-only sort state here would
  // just reorder the already-fetched page's arrow icon, never the data.
  setSort?: React.Dispatch<
    React.SetStateAction<{ colId: string; sort: "asc" | "desc" }[]>
  >;
}) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [localSort, setLocalSort] = React.useState<{ colId: string; sort: "asc" | "desc" }[]>([]);
  const PAGE_SIZE_OPTIONS = [10, 20, 50];

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rowData.slice(start, start + pageSize);
  }, [rowData, currentPage, pageSize]);

  return (
    <Table
      columns={columns}
      rowData={paginatedData}
      totalRows={rowData.length}
      currentPage={currentPage}
      loading={false}
      setCurrentPage={setCurrentPage}
      pageSize={pageSize}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      setPageSize={setPageSize}
      onCellClicked={() => {}}
      setSort={setSort ?? setLocalSort}
      title=""
      height={550}
      domLayout="autoHeight"
      displaySettingsButton={false}
    />
  );
};

const FinancialInfoTab = ({ policyId }: { policyId: number }) => {
  const [prFormMethods, setPrFormMethods] = React.useState<any>();
  const [csFormMethods, setCsFormMethods] = React.useState<any>();
  const [invFormMethods, setInvFormMethods] = React.useState<any>();
  const [colFormMethods, setColFormMethods] = React.useState<any>();

  const [prSearch, setPrSearch] = React.useState("");
  const [csSearch, setCsSearch] = React.useState("");
  const [invSearch, setInvSearch] = React.useState("");
  const [colSearch, setColSearch] = React.useState("");

  type SortState = { colId: string; sort: "asc" | "desc" }[];
  const [prSort, setPrSort] = React.useState<SortState>([]);
  const [csSort, setCsSort] = React.useState<SortState>([]);
  const [invSort, setInvSort] = React.useState<SortState>([]);
  const [colSort, setColSort] = React.useState<SortState>([]);
  const stringifySort = (sort: SortState) =>
    sort.length > 0
      ? sort.map((s) => `${s.colId}:${s.sort.toUpperCase()}`).join(",")
      : undefined;

  const prDefaultValues = React.useMemo(() => ({ search: "" }), []);
  const csDefaultValues = React.useMemo(() => ({ search: "" }), []);
  const invDefaultValues = React.useMemo(() => ({ search: "" }), []);
  const colDefaultValues = React.useMemo(() => ({ search: "" }), []);

  const { selectedValues: prSelected, handleReset: handlePrReset } = useFormWatcher({
    formMethods: prFormMethods,
    setSearchTerm: setPrSearch,
    searchFieldName: "search",
    searchDefaultValues: prDefaultValues,
  });
  const { selectedValues: csSelected, handleReset: handleCsReset } = useFormWatcher({
    formMethods: csFormMethods,
    setSearchTerm: setCsSearch,
    searchFieldName: "search",
    searchDefaultValues: csDefaultValues,
  });
  const { selectedValues: invSelected, handleReset: handleInvReset } = useFormWatcher({
    formMethods: invFormMethods,
    setSearchTerm: setInvSearch,
    searchFieldName: "search",
    searchDefaultValues: invDefaultValues,
  });
  const { selectedValues: colSelected, handleReset: handleColReset } = useFormWatcher({
    formMethods: colFormMethods,
    setSearchTerm: setColSearch,
    searchFieldName: "search",
    searchDefaultValues: colDefaultValues,
  });

  const { data: prData } = useApiQuery({
    url: endPoints.getPolicyPremiumReceipts(policyId, prSearch || undefined, stringifySort(prSort)),
    queryKey: ["policyPremiumReceipts", policyId, prSearch, prSort],
    enabled: !!policyId,
  });
  const { data: csData } = useApiQuery({
    url: endPoints.getPolicyCommissionStatements(policyId, csSearch || undefined, stringifySort(csSort)),
    queryKey: ["policyCommissionStatements", policyId, csSearch, csSort],
    enabled: !!policyId,
  });
  const { data: invData } = useApiQuery({
    url: endPoints.getPolicyInvoices(policyId, invSearch || undefined, stringifySort(invSort)),
    queryKey: ["policyInvoices", policyId, invSearch, invSort],
    enabled: !!policyId,
  });
  const { data: colData } = useApiQuery({
    url: endPoints.getPolicyCollections(policyId, colSearch || undefined, stringifySort(colSort)),
    queryKey: ["policyCollections", policyId, colSearch, colSort],
    enabled: !!policyId,
  });

  return (
    <OverviewCardBackground>
      <FinancialInfoTitle>
        {FINANCIAL_INFO_TABS.NAME}
      </FinancialInfoTitle>

      <FinancialInfoSection>
        <FinancialInfoSubTitle>
          {FINANCIAL_INFO_TABS.CLIENT_TABLE}
        </FinancialInfoSubTitle>
        <BrokerageInfoTable rowData={[]} columns={clientSpocColumns} />
      </FinancialInfoSection>

      <FinancialInfoSection>
        <FinancialInfoTableHeader>
          <PolicyDetailsSectionTitle>{FINANCIAL_INFO_TABS.PR_TABLE}</PolicyDetailsSectionTitle>
          <FinancialInfoSearchWrapper>
            <SmartSearch
              searchFormConfig={[]}
              searchDefaultValues={prDefaultValues}
              searchFormMethods={setPrFormMethods}
              formMethods={prFormMethods}
              selectedValues={prSelected}
              searchFieldName="search"
              placeholder="Search by PR ID or Name"
              onReset={handlePrReset}
              title={null}
              enableManualSearch={true}
            />
          </FinancialInfoSearchWrapper>
        </FinancialInfoTableHeader>
        <BrokerageInfoTable
          rowData={prData?.data?.premiumReceipts ?? []}
          columns={premiumReceiptsColumns}
          setSort={setPrSort}
        />
      </FinancialInfoSection>

      <FinancialInfoSection>
        <FinancialInfoTableHeader>
          <PolicyDetailsSectionTitle>{FINANCIAL_INFO_TABS.COMMISSION_TABLE}</PolicyDetailsSectionTitle>
          <FinancialInfoSearchWrapper>
            <SmartSearch
              searchFormConfig={[]}
              searchDefaultValues={csDefaultValues}
              searchFormMethods={setCsFormMethods}
              formMethods={csFormMethods}
              selectedValues={csSelected}
              searchFieldName="search"
              placeholder="Search by CS ID or Name"
              onReset={handleCsReset}
              title={null}
              enableManualSearch={true}
            />
          </FinancialInfoSearchWrapper>
        </FinancialInfoTableHeader>
        <BrokerageInfoTable
          rowData={csData?.data?.commissionStatements ?? []}
          columns={commissionStatementsColumns}
          setSort={setCsSort}
        />
      </FinancialInfoSection>

      <FinancialInfoSection>
        <FinancialInfoTableHeader>
          <PolicyDetailsSectionTitle>{FINANCIAL_INFO_TABS.INVOICE_TABLE}</PolicyDetailsSectionTitle>
          <FinancialInfoSearchWrapper>
            <SmartSearch
              searchFormConfig={[]}
              searchDefaultValues={invDefaultValues}
              searchFormMethods={setInvFormMethods}
              formMethods={invFormMethods}
              selectedValues={invSelected}
              searchFieldName="search"
              placeholder="Search by Invoice Number"
              onReset={handleInvReset}
              title={null}
              enableManualSearch={true}
            />
          </FinancialInfoSearchWrapper>
        </FinancialInfoTableHeader>
        <BrokerageInfoTable
          rowData={invData?.data?.invoices ?? []}
          columns={invoicesColumns}
          setSort={setInvSort}
        />
      </FinancialInfoSection>

      <FinancialInfoSection last>
        <FinancialInfoTableHeader>
          <PolicyDetailsSectionTitle>{FINANCIAL_INFO_TABS.COLLECTION_TABLE}</PolicyDetailsSectionTitle>
          <FinancialInfoSearchWrapper>
            <SmartSearch
              searchFormConfig={[]}
              searchDefaultValues={colDefaultValues}
              searchFormMethods={setColFormMethods}
              formMethods={colFormMethods}
              selectedValues={colSelected}
              searchFieldName="search"
              placeholder="Search by UTR Number"
              onReset={handleColReset}
              title={null}
              enableManualSearch={true}
            />
          </FinancialInfoSearchWrapper>
        </FinancialInfoTableHeader>
        <BrokerageInfoTable
          rowData={colData?.data?.collections ?? []}
          columns={collectionsColumns}
          setSort={setColSort}
        />
      </FinancialInfoSection>
    </OverviewCardBackground>
  );
};


const PolicyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Prepare default values for each form section
  const location = useLocation();
  const { localizationData } = useLocalization();
  React.useEffect(() => {
    setLocalizationConfig(localizationData?.data);
  }, [localizationData]);

  const premiumAndBrokerageFormConfig = React.useMemo(
    () =>
      getCountrySpecificConfig(premiumAndBrokerageDetails, {
        "Sri Lanka": premiumAndBrokerageDetailsLanka,
      }),
    []
  );
  const premiumAndBrokerageDetailsConfig = React.useMemo(
    () =>
      getCountrySpecificConfig(policyPremiumAndBrokerageDetails, {
        "Sri Lanka": policyPremiumAndBrokerageDetailsLanka,
      }),
    []
  );

  //for localization
  const premiumAndBrokerageFieldKeys = React.useMemo(() => {
    if (!Array.isArray(premiumAndBrokerageFormConfig)) {
      return null;
    }

    const keys = new Set<string>();
    premiumAndBrokerageFormConfig.forEach((field: FormFieldConfig) => {
      if (field?.name) {
        keys.add(field.name);
      }
      if (field?.key) {
        keys.add(field.key);
      }
    });

    return keys;
  }, [premiumAndBrokerageFormConfig]);

  const basicDetailsSubmitFieldKeys = React.useMemo(() => {
    return new Set(
      policyDetailsFormConfig
        .map((field) => field?.key)
        .filter((key): key is string => Boolean(key))
    );
  }, []);

  const policyMinedNoId = useLookupIdByKey(LookUpValues.IS_POLICY_MINED_NO);
  const policyMinedYesId = useLookupIdByKey(LookUpValues.IS_POLICY_MINED_YES);
  const toggleTypeYesId = useLookupIdByKey(LookUpValues.TOGGLE_TYPE_YES);
  const toggleTypeNoId = useLookupIdByKey(LookUpValues.TOGGLE_TYPE_NO);

  const stateFromListing = location.state;
  const { companyName, companyId, policyName, companyData, filters } =
    location.state || {};
  const from = location.state?.from;
  const activeTabFromState = location.state?.state?.activeTab;

  // Fetch policy details - needed for isGroupPolicyType
  const {
    data: policyDetailsData,
    isLoading: loading,
    refetch: refetchPolicyDetails,
  } = useApiQuery({
    url: endPoints.getBasicDetailsByPolicyId(Number(id)),
    queryKey: ["policyDetailsData"],
    enabled: !!id,
  });

  // Calculate isGroupPolicyType early - needed for tab config
  // Compared by lookUpKey (org-independent string), not id: lookup_data has
  // one row per organisation_id per key, so the same key resolves to a
  // different numeric id per org and an id-based comparison can mismatch.
  const isGroupPolicyType = (GROUP_POLICY_TYPE_KEYS as readonly string[]).includes(
    policyDetailsData?.data?.PolicyType?.lookUpKey
  );

  const resolvedActiveTabKey = React.useMemo(() => {
    if (!activeTabFromState) {
      return undefined;
    }

    const resolveTabKey = (tabKeyOrComponentKeyOrSectionKey: string) => {
      switch (tabKeyOrComponentKeyOrSectionKey) {
        case "POLICY_APPROVAL_POLICY_DETAILS":
          return "policyDetails";
        case "POLICY_APPROVAL_POLICY_COVERS":
          return "covers";
        case "POLICY_APPROVAL_POLICY_CD":
          return "cdDetails";
        default:
          return tabKeyOrComponentKeyOrSectionKey;
      }
    };

    return companyTabsConfig(isGroupPolicyType).find(
      (tab) =>
        tab.tabKey === resolveTabKey(activeTabFromState) ||
        tab.componentKey === resolveTabKey(activeTabFromState) ||
        tab.sectionKey === resolveTabKey(activeTabFromState)
    )?.tabKey;
  }, [activeTabFromState, isGroupPolicyType]);

  const basicDetailsFormRef =
    React.useRef<NestedGroupedDataCollectionHandle | null>(null);
  const additionalDetailsFormRef =
    React.useRef<NestedGroupedDataCollectionHandle | null>(null);
  const premiumAndBrokerageFormRef =
    React.useRef<NestedGroupedDataCollectionHandle | null>(null);
  const policyDashboardRef = React.useRef<PolicyDashboardRef | null>(null);

  //this is for the localisation in sri lanka and need to refactor in the future
  const sriLankaAutoPopulateConfigs = React.useMemo(() => {
    if (premiumAndBrokerageFormConfig !== premiumAndBrokerageDetailsLanka) {
      const field = (name: string) => ({
        section: "premiumAndBrokerageDetails",
        field: name,
      });

      return [
        {
          target: field("netPremium"),
          fields: [field("basicPremium"), field("terrorismAmount")],
        },
        {
          target: field("grossPremium"),
          fields: [field("netPremium"), field("gstAmount")],
        },
        {
          target: field("totalBrokerageAmount"),
          fields: [field("basicBrokerageAmount"), field("tcBrokerageAmount")],
        },
      ] as AutoPopulateConfig[];
    }

    // If your form values are structured as:
    // { premiumAndBrokerageDetails: { premiumCollected: 123, srccAmount: 456, ... } }
    // Then use this format:

    const netPremiumBaseFields = [
      { section: "premiumAndBrokerageDetails", field: "premiumAtInception" },
      { section: "premiumAndBrokerageDetails", field: "srccAmount" },
      { section: "premiumAndBrokerageDetails", field: "terrorismAmount" },
    ];

    const baseFields = [
      ...netPremiumBaseFields,
      { section: "premiumAndBrokerageDetails", field: "gstAmount" },
    ];

    const chargeFields = [
      ...baseFields,
      { section: "premiumAndBrokerageDetails", field: "feeAmount" },
      { section: "premiumAndBrokerageDetails", field: "otherAmount" },
      { section: "premiumAndBrokerageDetails", field: "adminCharges" },
      { section: "premiumAndBrokerageDetails", field: "cessAmount" },
    ];

    const brokerageAmountFields = [
      { section: "premiumAndBrokerageDetails", field: "basicBrokerageAmount" },
      { section: "premiumAndBrokerageDetails", field: "srccBrokerageAmount" },
      { section: "premiumAndBrokerageDetails", field: "tcBrokerageAmount" },
    ];

    const configs: AutoPopulateConfig[] = [
      {
        target: {
          section: "premiumAndBrokerageDetails",
          field: "netPremium",
        },
        fields: netPremiumBaseFields,
      },
      {
        target: {
          section: "premiumAndBrokerageDetails",
          field: "totalGrossPremiumIncTax",
        },
        fields: baseFields,
      },
      {
        target: {
          section: "premiumAndBrokerageDetails",
          field: "grossPremium",
        },
        fields: chargeFields,
      },
      {
        target: {
          section: "premiumAndBrokerageDetails",
          field: "totalBrokerageAmount",
        },
        fields: brokerageAmountFields,
      },
    ];

    const brokerageAutoPopulateConfigs: AutoPopulateConfig[] = [
      createBrokerageAutoPopulateConfig(
        "basicBrokerageAmount",
        "premiumAtInception",
        "basicBrokeragePercentage"
      ),
      createBrokerageAutoPopulateConfig(
        "srccBrokerageAmount",
        "srccAmount",
        "srccPercentage"
      ),
      createBrokerageAutoPopulateConfig(
        "tcBrokerageAmount",
        "terrorismAmount",
        "terrorismBrokeragePercentage"
      ),
      // Sri Lanka taxes net premium plus the charges, matching the slip's
      // gstAmount base of netPremium + adminCharges + other + cess + fee.
      {
        target: {
          section: "premiumAndBrokerageDetails",
          field: "gstAmount",
        },
        fields: [
          { section: "premiumAndBrokerageDetails", field: "gstPercentage" },
          { section: "premiumAndBrokerageDetails", field: "netPremium" },
          { section: "premiumAndBrokerageDetails", field: "adminCharges" },
          { section: "premiumAndBrokerageDetails", field: "otherAmount" },
          { section: "premiumAndBrokerageDetails", field: "cessAmount" },
          { section: "premiumAndBrokerageDetails", field: "feeAmount" },
        ],
        compute: ({ values }) => {
          const details = values?.premiumAndBrokerageDetails;
          const gstPercentage = parseNumericInput(details?.gstPercentage);
          if (gstPercentage === null) {
            return "";
          }

          const base = [
            "netPremium",
            "adminCharges",
            "otherAmount",
            "cessAmount",
            "feeAmount",
          ].reduce(
            (total, key) => total + (parseNumericInput(details?.[key]) ?? 0),
            0
          );

          return Number(((base * gstPercentage) / 100).toFixed(2));
        },
      },
    ];

    return [...configs, ...brokerageAutoPopulateConfigs];
  }, [premiumAndBrokerageFormConfig]);
  const handleSriLankaAutoPopulate = useAutoPopulateCalculatedFields(
    premiumAndBrokerageFormRef,
    sriLankaAutoPopulateConfigs,
    // The hook no-ops for non Sri Lanka users unless forced; India needs it too.
    { forceEnable: true }
  );

  // State to hold policy details data
  const [uploadRefreshKey, setUploadRefreshKey] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const [policyDetailsState, setPolicyDetailsState] = useState<any>({
    basicDetails: {},
    premiumAndBrokerageDetails: {},
    rconDetails: {},
    insurerDetails: [],
    tpaDetails: [],
    companyContacts: [],
    coInsurer: [],
    riskLocations: [],
    crmAndAccountManagerDetails: {},
    premiumInstallments: [],
  });
  const premiumAndBrokeragePrevValuesRef = React.useRef<Record<string, any>>(
    {}
  );
  const skipPremiumAndBrokerageSyncRef = React.useRef(false);

  // policyDetailsData is now defined earlier in the file

  const { data: policySectionStatusData } = useApiQuery({
    url: endPoints.policySectionStatus(Number(id)),
    queryKey: ["policySectionStatusData"],
    enabled: !!id,
  });

  const [statusKey, setStatusKey] = useState<any>({
    basicDetailsStatus: "",
    coversDetailsStatus: "",
    cdDetails: "",
  });
  const [sectionComments, setSectionComments] = useState<{
    basicDetails: string;
    coversDetails: string;
    cdDetails: string;
  }>({
    basicDetails: "",
    coversDetails: "",
    cdDetails: "",
  });
  const [sectionApprovalMeta, setSectionApprovalMeta] = useState<{
    basicDetails: { approvedBy: string; needToApproveBy: string };
    coversDetails: { approvedBy: string; needToApproveBy: string };
    cdDetails: { approvedBy: string; needToApproveBy: string };
  }>({
    basicDetails: { approvedBy: "", needToApproveBy: "" },
    coversDetails: { approvedBy: "", needToApproveBy: "" },
    cdDetails: { approvedBy: "", needToApproveBy: "" },
  });

  const canActivatePolicy = useSelector((state: any) =>
    selectHasPermission(FeatureKey.ACTIVATE_POLICY)(state)
  );

  const canReconfigurePolicy = useSelector((state: any) =>
    selectHasPermission(FeatureKey.RECONFIGURE_POLICY)(state)
  );
  const canApprovePolicy = useSelector((state: any) =>
    selectHasPermission(FeatureKey.POLICY_APPROVAL)(state)
  );

  const hasRbacExportPolicies = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EXPORT_POLICIES)(state)
  );

  const hasFinancialInfoPermission = useSelector((state: any) =>
    selectHasPermission(FeatureKey.FINANCIAL_INFORMATION)(state)
  );

  const handleSectionsUpdate = useCallback(
    (sections?: Record<string, any>) => {
      if (!sections) {
        setSectionComments({
          basicDetails: "",
          coversDetails: "",
          cdDetails: "",
        });
        setSectionApprovalMeta({
          basicDetails: { approvedBy: "", needToApproveBy: "" },
          coversDetails: { approvedBy: "", needToApproveBy: "" },
          cdDetails: { approvedBy: "", needToApproveBy: "" },
        });
        return;
      }

      setSectionComments({
        basicDetails: sections?.POLICY_DETAILS?.comments ?? "",
        coversDetails: sections?.POLICY_COVERS?.comments ?? "",
        cdDetails: sections?.POLICY_CD?.comments ?? "",
      });

      setSectionApprovalMeta({
        basicDetails: {
          approvedBy: sections?.POLICY_DETAILS?.approvedBy ?? "",
          needToApproveBy: sections?.POLICY_DETAILS?.needToApproveBy ?? "",
        },
        coversDetails: {
          approvedBy: sections?.POLICY_COVERS?.approvedBy ?? "",
          needToApproveBy: sections?.POLICY_COVERS?.needToApproveBy ?? "",
        },
        cdDetails: {
          approvedBy: sections?.POLICY_CD?.approvedBy ?? "",
          needToApproveBy: sections?.POLICY_CD?.needToApproveBy ?? "",
        },
      });
    },
    [setSectionComments, setSectionApprovalMeta]
  );

  useEffect(() => {
    const sections = policySectionStatusData?.data?.sections;
    setStatusKey({
      cdDetails: sections?.POLICY_CD?.statusKey || "",
      coversDetailsStatus: sections?.POLICY_COVERS?.statusKey || "",
      basicDetailsStatus: sections?.POLICY_DETAILS?.statusKey || "",
    });
    handleSectionsUpdate(sections);
  }, [policySectionStatusData, handleSectionsUpdate]);

  const { mutate: activatePolicyMutate } = useApiMutation({});
  const user = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    if (!policyDetailsData?.data) return;

    const basicDetails = policyDetailsData?.data?.basicDetails || {};
    const premiumAndBrokerageDetailsResponse =
      policyDetailsData?.data?.premiumAndBrokerageDetails || {};
    const normalizedPremiumAndBrokerageDetails = {
      ...premiumAndBrokerageDetailsResponse,
    };

    // if (
    //   normalizedPremiumAndBrokerageDetails.basicBrokeragePercentage ===
    //     undefined &&
    //   normalizedPremiumAndBrokerageDetails.basicPremiumPercentage !== undefined
    // ) {
    //   normalizedPremiumAndBrokerageDetails.basicBrokeragePercentage =
    //     normalizedPremiumAndBrokerageDetails.basicPremiumPercentage;
    // }

    setPolicyDetailsState({
      additionalDetails: policyDetailsData?.data?.additionalDetails || {},
      basicDetails: {
        ...basicDetails,
        policyType: basicDetails?.policyType?.id ?? null,
        policyTypeLookUpValue: basicDetails?.policyType?.lookUpValue ?? "N/A",
        companyType: basicDetails?.companyType?.id ?? null,
        companyTypeLookUpValue: basicDetails?.companyType?.lookUpValue ?? "N/A",
        isPolicyMinedLookUpValue: basicDetails?.isMined?.lookUpValue ?? "N/A",
        businessTypeLookUpValue:
          basicDetails?.businessType?.lookUpValue ?? "N/A",
        isMined: basicDetails?.isMined?.id ?? null,
        policyGroup: basicDetails?.policyGroup?.id ?? null,
        policyGroupLookUpValue: basicDetails?.policyGroup?.lookUpValue ?? "N/A",
        businessType: basicDetails?.businessType?.id ?? null,
        isEnrolmentPremiumBased:
          basicDetails?.isEnrolmentPremiumBased?.id ?? null,
        isEnrolmentPremiumBasedLookUpValue:
          basicDetails?.isEnrolmentPremiumBased?.lookUpValue ?? "N/A",
        ownerName: basicDetails?.owner?.name ?? "",
        ownerEmail: basicDetails?.owner?.email ?? "",
        ownerMobile: basicDetails?.owner?.mobile ?? "",
        createdBy: basicDetails?.policyCreatedBy?.name ?? "",
        updatedBy: basicDetails?.policyUpdatedBy?.name ?? "",
        createdAt: basicDetails?.policyCreatedAt ?? "",
        updatedAt: basicDetails?.policyUpdatedAt ?? "",
      },
      premiumAndBrokerageDetails: normalizedPremiumAndBrokerageDetails,
      rconDetails: policyDetailsData?.data?.rconDetails || {},
      insurerDetails: policyDetailsData?.data?.insurerDetails || [],
      tpaDetails: policyDetailsData?.data?.tpaDetails || [],
      companyContacts: policyDetailsData?.data?.companyContacts || [],
      coInsurer: policyDetailsData?.data?.coInsurer || [],
      riskLocations: policyDetailsData?.data?.riskLocations || [],
      crmAndAccountManagerDetails:
        policyDetailsData?.data?.crmAndAccountManagerDetails || {},
      premiumInstallments: policyDetailsData?.data?.premiumInstallments || [],
      // add more sections here if needed
    });
  }, [policyDetailsData]);

  useEffect(() => {
    if (!policyDetailsState?.premiumAndBrokerageDetails) return;
    premiumAndBrokeragePrevValuesRef.current = {
      ...policyDetailsState.premiumAndBrokerageDetails,
    };
  }, [policyDetailsState?.premiumAndBrokerageDetails]);

  const handleDetailsSubmit = (valuesWithKey: Record<string, any>) => {
    setPolicyDetailsState((prev) => {
      const newState = { ...prev };

      //for localization
      if (valuesWithKey.premiumAndBrokerageDetails) {
        if (premiumAndBrokerageFieldKeys?.size) {
          const filteredDetails = Object.keys(
            valuesWithKey.premiumAndBrokerageDetails
          ).reduce<Record<string, any>>((acc, key) => {
            if (premiumAndBrokerageFieldKeys.has(key)) {
              acc[key] = valuesWithKey.premiumAndBrokerageDetails[key];
            }
            return acc;
          }, {});

          // if (
          //   filteredDetails.basicBrokeragePercentage !== undefined &&
          //   filteredDetails.basicPremiumPercentage === undefined
          // ) {
          //   filteredDetails.basicPremiumPercentage =
          //     filteredDetails.basicBrokeragePercentage;
          // }

          valuesWithKey.premiumAndBrokerageDetails = filteredDetails;
        }
      }

      if (
        valuesWithKey.premiumInstallments &&
        Array.isArray(valuesWithKey.premiumInstallments)
      ) {
        const updatedPremiums = [...(prev.premiumInstallments || [])];

        valuesWithKey.premiumInstallments.forEach((newItem) => {
          const index = updatedPremiums.findIndex(
            (item) => item.id === newItem.id
          );
          if (index !== -1) {
            updatedPremiums[index] = newItem;
          } else {
            updatedPremiums.push(newItem);
          }
        });

        newState.premiumInstallments = updatedPremiums;
      }

      // Handle basicDetails with conditional isPolicyMinedLookUpValue
      if (valuesWithKey.basicDetails) {
        const basicDetailsPayload = Object.entries(valuesWithKey.basicDetails).reduce<Record<string, any>>(
          (acc, [key, value]) => {
            if (!basicDetailsSubmitFieldKeys.has(key)) {
              return acc;
            }
            acc[key] = value;
            return acc;
          },
          {}
        );
        const { isMined, isEnrolmentPremiumBased } = basicDetailsPayload;

        newState.basicDetails = {
          ...prev.basicDetails,
          ...basicDetailsPayload,
          isMined,
          isPolicyMinedLookUpValue:
            isMined === policyMinedNoId
              ? "No"
              : isMined === policyMinedYesId
              ? "Yes"
              : valuesWithKey.basicDetails?.isPolicyMinedLookUpValue ?? "N/A",
          ...(isEnrolmentPremiumBased != null && {
            isEnrolmentPremiumBasedLookUpValue:
              isEnrolmentPremiumBased === toggleTypeYesId
                ? "Yes"
                : isEnrolmentPremiumBased === toggleTypeNoId
                ? "No"
                : prev.basicDetails?.isEnrolmentPremiumBasedLookUpValue ?? "N/A",
          }),
          updatedBy: user?.firstName + " " + user?.lastName || "",
          updatedAt: new Date().toISOString().split("T")[0],
        };
      }

      // Merge other keys using spread operator to avoid mutation
      const { premiumInstallments, basicDetails, ...rest } = valuesWithKey;
      
      return { ...newState, ...rest };
    });
  };

  const resolveFormHandle = React.useCallback(
    (
      fallback: NestedGroupedDataCollectionHandle | null | undefined
    ): NestedGroupedDataCollectionHandle | null =>
      fallback ?? premiumAndBrokerageFormRef.current ?? null,
    []
  );

  const handlePremiumAndBrokerageValuesChange = React.useCallback(
    (
      values: Record<string, any>,
      providedHandle: NestedGroupedDataCollectionHandle | null
    ) => {
      const formHandle = resolveFormHandle(providedHandle);
      if (!formHandle) return;

      // Ignore the synthetic change that fires right after `setValues`
      if (skipPremiumAndBrokerageSyncRef.current) {
        skipPremiumAndBrokerageSyncRef.current = false;
        const latest =
          formHandle.getValues?.()?.premiumAndBrokerageDetails ??
          values?.premiumAndBrokerageDetails ??
          {};
        premiumAndBrokeragePrevValuesRef.current = { ...latest };
        return;
      }

      const current = values?.premiumAndBrokerageDetails;
      if (!current) return;

      // Bases mirror the placement slip: basic brokerage is a percentage of the
      // basic premium, terrorism brokerage of the terrorism premium, GST of net.
      const base = Number(current?.netPremium) || 0;
      const brokerageBase = Number(current?.basicPremium) || 0;
      const terrorismBase = Number(current?.terrorismAmount) || 0;
      const percentage = Number(current?.basicBrokeragePercentage) || 0;
      const amount = Number(current?.basicBrokerageAmount) || 0;
      const serviceTaxPercentage = Number(current?.gstPercentage) || 0;
      const serviceTaxAmount = Number(current?.gstAmount) || 0;
      const terrorismPercentage =
        Number(current?.terrorismBrokeragePercentage) || 0;
      const commissionTerrorism = Number(current?.tcBrokerageAmount) || 0;

      const prev = premiumAndBrokeragePrevValuesRef.current;
      const prevBase = Number(prev?.netPremium) || 0;
      const prevBrokerageBase = Number(prev?.basicPremium) || 0;
      const prevTerrorismBase = Number(prev?.terrorismAmount) || 0;
      const prevPercentage = Number(prev?.basicBrokeragePercentage) || 0;
      const prevAmount = Number(prev?.basicBrokerageAmount) || 0;
      const prevServiceTaxPercentage = Number(prev?.gstPercentage) || 0;
      const prevServiceTaxAmount = Number(prev?.gstAmount) || 0;
      const prevTerrorismPercentage =
        Number(prev?.terrorismBrokeragePercentage) || 0;
      const prevTerrorismAmount = Number(prev?.tcBrokerageAmount) || 0;

      const brokerageUpdate = calculatePercentageAmountUpdate(
        brokerageBase,
        percentage,
        amount,
        prevBrokerageBase,
        prevPercentage,
        prevAmount,
        "basicBrokeragePercentage",
        "basicBrokerageAmount"
      );
      const serviceTaxUpdate = calculatePercentageAmountUpdate(
        base,
        serviceTaxPercentage,
        serviceTaxAmount,
        prevBase,
        prevServiceTaxPercentage,
        prevServiceTaxAmount,
        "gstPercentage",
        "gstAmount"
      );
      const terrorismUpdate = calculatePercentageAmountUpdate(
        terrorismBase,
        terrorismPercentage,
        commissionTerrorism,
        prevTerrorismBase,
        prevTerrorismPercentage,
        prevTerrorismAmount,
        "terrorismBrokeragePercentage",
        "tcBrokerageAmount"
      );

      const updates = Object.assign(
        {},
        brokerageUpdate || {},
        serviceTaxUpdate || {},
        terrorismUpdate || {}
      );

      // netPremium, grossPremium and totalBrokerageAmount are derived by the
      // auto-populate configs below, which cascade over the pair updates.

      if (Object.keys(updates).length > 0 && formHandle.setValues) {
        skipPremiumAndBrokerageSyncRef.current = true;
        formHandle.setValues({
          premiumAndBrokerageDetails: updates,
        });
      }

      const fallbackValues =
        Object.keys(updates).length > 0 ? { ...current, ...updates } : current;
      const latestValues =
        formHandle.getValues?.()?.premiumAndBrokerageDetails ?? fallbackValues;

      if (values) {
        // Feed the pair updates forward so the sums see them in the same tick.
        handleSriLankaAutoPopulate({
          ...values,
          premiumAndBrokerageDetails: fallbackValues,
        });
      }

      premiumAndBrokeragePrevValuesRef.current = {
        ...latestValues,
      };
    },
    [handleSriLankaAutoPopulate, resolveFormHandle]
  );

  const handleActivatePolicy = React.useCallback(() => {
    if (!id) {
      dispatch(setToastMessage("Policy id is missing."));
      return;
    }

    const policyId = Number(id);
    if (Number.isNaN(policyId)) {
      dispatch(setToastMessage("Policy id is invalid."));
      return;
    }

    activatePolicyMutate(
      {
        endpoint: endPoints.activatePolicy(policyId),
        method: httpMethods.PUT,
        data: { isActivate: true },
      },
      {
        onSuccess: () => {
          dispatch(setToastMessage("Policy activated successfully."));
          refetchPolicyDetails();
        },
        onError: (error: any) => {
          const message =
            error?.message ||
            "Failed to activate the policy. Please try again.";
          dispatch(setToastMessage(message));
        },
      }
    );
  }, [activatePolicyMutate, dispatch, id, refetchPolicyDetails]);

  const [reconfigureModalOpen, setReconfigureModalOpen] =
    React.useState(false);
  const { mutate: reconfigurePolicyMutate } = useApiMutation({});

  const handleConfirmReconfigure = React.useCallback(() => {
    setReconfigureModalOpen(false);
    const policyId = Number(id);
    if (!id || Number.isNaN(policyId)) {
      dispatch(setToastMessage("Policy id is invalid."));
      return;
    }

    reconfigurePolicyMutate(
      {
        endpoint: endPoints.reconfigurePolicy(policyId),
        method: httpMethods.PUT,
      },
      {
        onSuccess: () => {
          dispatch(
            setToastMessage(RECONFIGURE_POLICY_SUCCESS)
          );
          refetchPolicyDetails();
        },
        onError: (error: any) => {
          dispatch(
            setToastMessage(
              error?.message || RECONFIGURE_POLICY_ERROR
            )
          );
        },
      }
    );
  }, [dispatch, id, reconfigurePolicyMutate, refetchPolicyDetails]);

  const handleDocumentCellClicked = React.useCallback(
    (event: CellClickedEvent, setActiveTab: (key: string) => void) => {
      if (event.colDef.field === "activityName") {
        if (
          event.data?.activityName === PolicyDocActivityType.INCEPTION &&
          event.data?.activityId
        ) {
          navigate(
            `/${policyDetailsData?.data?.policyId}/create-inception/${event.data.activityId}`
          );
        } else if (
          event.data?.activityName === PolicyDocActivityType.ENDORSEMENT &&
          event.data?.activityId
        ) {
          navigate(
            `/${policyDetailsData?.data?.policyId}/create-endorsement/${event.data.activityId}`
          );
        } else if (event.data?.activityName === PolicyDocActivityType.CLAIM) {
          setActiveTab("policyDashboard");
          // Scroll to claims section after tab change
          setTimeout(() => {
            policyDashboardRef.current?.scrollToClaimsSection();
          }, 100);
        }
      }
    },
    [navigate, policyDetailsData]
  );

  const [isBasicDetailsEditing, setIsBasicDetailsEditing] =
    React.useState(false);
  const [isAdditionalDetailsEditing, setIsAdditionalDetailsEditing] =
    React.useState(false);
  const [isCoversEditing, setIsCoversEditing] = React.useState(false);
  const [isCdDetailsEditing, setIsCdDetailsEditing] = React.useState(false);
  const [activationModalOpen, setActivationModalOpen] = React.useState(false);

  const handleBasicDetailsEditStateChange = React.useCallback(
    (editing: boolean) => {
      setIsBasicDetailsEditing(editing);
    },
    []
  );

  const handleAdditionalDetailsEditStateChange = React.useCallback(
    (editing: boolean) => {
      setIsAdditionalDetailsEditing(editing);
    },
    []
  );

  const isAnySectionEditing =
    isBasicDetailsEditing ||
    isAdditionalDetailsEditing ||
    isCoversEditing ||
    isCdDetailsEditing;

  // Policy type constants and isGroupPolicyType are now defined earlier in the file

  const isGMCPolicy = isGroupPolicyType;
  const FF_IWORK_POLICY_CONFIGURATOR =
    environment.featureFlag.FF_IWORK_POLICY_CONFIGURATOR;
  const FF_IWORK_POLICY_DASHBOARD =
    environment.featureFlag.FF_IWORK_POLICY_DASHBOARD;
  const FF_IWORK_PORTAL_CONFIGURATION =
    environment.featureFlag.FF_IWORK_PORTAL_CONFIGURATION;

  const areRequiredSectionsApproved =
    statusKey.basicDetailsStatus === SECTION_STATUS.APPROVED &&
    statusKey.coversDetailsStatus === SECTION_STATUS.APPROVED &&
    statusKey.cdDetails === SECTION_STATUS.APPROVED;

  const configureStatus =
    policyDetailsData?.data?.configurationStatus?.lookUpKey;
  const isLive = configureStatus === CONFIGURATION_STATUS.LIVE;
  const isComplete = configureStatus === CONFIGURATION_STATUS.COMPLETED;

  const companyConfigurationStatus =
    policyDetailsData?.data?.companyPortalConfigurationStatus?.lookUpKey;
  // TEMP: keep company config status for future gating, but do not block activation.
  // Re-enable once portal configuration becomes mandatory again.
  // const isCompanyConfigurationActive = true;
  // const isCompanyConfigurationActive =
  //   companyConfigurationStatus === COMPANY_CONFIGURATION_STATUS.ACTIVE;

  const policyStatus =
    policyDetailsData?.data?.headerDetails?.status ??
    policyDetailsData?.data?.headerDetails?.statusName;
  const isPolicyStatusActive =
    typeof policyStatus === "string" &&
    policyStatus.trim().toLowerCase() === "active";
  const isEnrolmentPremiumBased =
    policyDetailsState?.basicDetails?.isEnrolmentPremiumBased === toggleTypeYesId;

  const requiresConfigureStep = isGroupPolicyType && !isEnrolmentPremiumBased;

  const isActivatePolicyDisabled =
    (requiresConfigureStep && !isComplete && !isLive) ||
    !areRequiredSectionsApproved;
    // || !isCompanyConfigurationActive;

  const activationBlockersMessage = React.useMemo(() => {
    const pendingItems: string[] = [];

    if (requiresConfigureStep && !isComplete && !isLive) {
      pendingItems.push(CONFIGURE_POLICY_LABEL);
    }
    // TODO: Enable company configuration check when the feature is ready and config service is enabled
    // if (!isCompanyConfigurationActive) {
    //   pendingItems.push(CONFIGURE_COMPANY_LABEL);
    // }

    POLICY_SECTION_STATUS_LABELS.forEach(({ key, label }) => {
      const sectionStatus = statusKey?.[key];
      if (sectionStatus !== SECTION_STATUS.APPROVED) {
        pendingItems.push(label);
      }
    });

    if (pendingItems.length === 0) {
      return ACTIVATION_MESSAGES.ALL_PREREQUISITES;
    }

    const itemsText =
      pendingItems.length === 1
        ? pendingItems[0]
        : `${pendingItems.slice(0, -1).join(", ")} and ${
            pendingItems[pendingItems.length - 1]
          }`;

    return ACTIVATION_MESSAGES.PENDING_TEMPLATE.replace("{{items}}", itemsText);
  }, [
    isComplete,
    isGroupPolicyType,
    isLive,
    requiresConfigureStep,
    // isCompanyConfigurationActive,
    statusKey.basicDetailsStatus,
    statusKey.cdDetails,
    statusKey.coversDetailsStatus,
  ]);

  const handleBlockedActivationAttempt = React.useCallback(() => {
    dispatch(setToastMessage(activationBlockersMessage));
  }, [activationBlockersMessage, dispatch]);

  const handleActivatePolicyAttempt = React.useCallback(() => {
    if (isActivatePolicyDisabled) {
      handleBlockedActivationAttempt();
      return;
    }

    setActivationModalOpen(true);
  }, [handleBlockedActivationAttempt, isActivatePolicyDisabled]);

  const handleConfirmActivation = React.useCallback(() => {
    setActivationModalOpen(false);
    handleActivatePolicy();
  }, [handleActivatePolicy]);
  const handleUpdateCompany = () => {
    if (!policyDetailsData?.data?.headerDetails) return;

    navigate(`/policies/configure/${id}`, {
      state: {
        policyId: id,
        companyId: companyId,
        // policyStatus: policyDetailsData?.data?.headerDetails?.status,
        // policyDetails: {
        //   label: policyDetailsData?.data?.headerDetails?.displayName,
        // },
        policyConfiguartionStatusLid:
          policyDetailsData?.data?.configurationStatus?.id,
        policyTypeLid: policyDetailsData?.data?.PolicyType?.id,
        companyName: stateFromListing?.companyName,
        accountManager: stateFromListing?.accountManager,
        policyName: policyDetailsData?.data?.headerDetails?.displayName,
      },
    });
  };

  const tabs = companyTabsConfig(isGroupPolicyType)
    .filter((tab: any) => {
      // Exclude the tab if it's policyEmployeeData and isGroupPolicyType is false
      if (tab.componentKey === "policyEmployeeData" && !isGroupPolicyType) {
        return false;
      }
      // Exclude insuredDetails tab if it's not a group policy
      if (
        tab.componentKey === POLICY_DETAILS_TABS.INSURED_DETAILS &&
        !isGroupPolicyType
      ) {
        return false;
      }
      // Exclude assetInsured tab if it IS a group policy (only show for non-group)
      if (
        tab.componentKey === POLICY_DETAILS_TABS.ASSET_INSURED &&
        isGroupPolicyType
      ) {
        return false;
      }
      if (
        tab.componentKey === POLICY_DETAILS_TABS.POLICY_DASHBOARD &&
        !FF_IWORK_POLICY_DASHBOARD
      ) {
        return false;
      }
      if (
        tab.componentKey === POLICY_DETAILS_TABS.PORTAL_CONFIGURATION &&
        (!isGroupPolicyType || !FF_IWORK_PORTAL_CONFIGURATION)
      ) {
        return false;
      }
      if (
        tab.componentKey === POLICY_DETAILS_TABS.FINANCIAL_INFO &&
        !hasFinancialInfoPermission
      ) {
        return false;
      }
      if (
        tab.componentKey === POLICY_DETAILS_TABS.EXTENSION_HISTORY &&
        isGroupPolicyType
      ) {
        return false;
      }
      if (tab.componentKey === POLICY_DETAILS_TABS.UPLOAD_DOCUMENTS) {
        return false;
      }
      return true;
    })
    .map((tab: any) => {
      if (tab.sectionKey === "policyDetails") {
        const section = sectionMap[tab.sectionKey];
        return {
          ...tab,
          content: (
            <div data-testid="policy-basic-details">
              {statusKey?.basicDetailsStatus === SECTION_STATUS.REJECTED && (
                <RequestAlert
                  title={POLICY_ALERT_BOX_DETAILS.TITLE}
                  message={sectionComments.basicDetails}
                />
              )}
              <OverviewCardBackground>
                <EditableDetailsSection
                  sections={section}
                  data={policyDetailsState?.basicDetails}
                  formConfig={policyDetailsFormConfig}
                  formKey="basicDetails"
                  formRef={basicDetailsFormRef}
                  onSubmit={handleDetailsSubmit}
                  onEditStateChange={handleBasicDetailsEditStateChange}
                  isEditButtonVisible={
                    statusKey?.basicDetailsStatus !== SECTION_STATUS.APPROVED &&
                    statusKey?.basicDetailsStatus !== SECTION_STATUS.SUBMITTED
                  }
                />
              </OverviewCardBackground>
              {/* <OverviewCardBackground>
                <EditableDetailsSection
                  sections={additionalSection}
                  data={policyDetailsState?.additionalDetails}
                  formConfig={policyAdditionalDetailsFormConfig}
                  formKey="additionalDetails"
                  formRef={additionalDetailsFormRef}
                  onSubmit={handleDetailsSubmit}
                  onEditStateChange={handleAdditionalDetailsEditStateChange}
                />
              </OverviewCardBackground> */}
              <OverviewCardBackground>
                <EditableDetailsSection
                  sections={premiumAndBrokerageDetailsConfig}
                  data={policyDetailsState?.premiumAndBrokerageDetails}
                  formConfig={premiumAndBrokerageFormConfig}
                  formKey="premiumAndBrokerageDetails"
                  formRef={premiumAndBrokerageFormRef}
                  onSubmit={handleDetailsSubmit}
                  onEditStateChange={handleAdditionalDetailsEditStateChange}
                  isEditButtonVisible={
                    statusKey?.basicDetailsStatus !== SECTION_STATUS.APPROVED &&
                    statusKey?.basicDetailsStatus !== SECTION_STATUS.SUBMITTED
                  }
                  onFormValuesChange={(vals, handle) =>
                    handlePremiumAndBrokerageValuesChange(
                      vals,
                      handle ?? premiumAndBrokerageFormRef.current
                    )
                  }
                />
              </OverviewCardBackground>

              {policyDetailsState?.insurerDetails?.length > 0 &&
                policyDetailsState?.insurerDetails?.map(
                  (insurer: any, index: number) => (
                    <OverviewCardBackground key={index}>
                      <EditableDetailsSection
                        sections={insurerDetails}
                        data={{
                          ...insurer,
                          riskLocations:
                            policyDetailsState?.riskLocations ?? [],
                        }}
                        formConfig={rconDetails}
                        formKey="insurerDetails"
                        formRef={additionalDetailsFormRef}
                        onSubmit={handleDetailsSubmit}
                        onEditStateChange={
                          handleAdditionalDetailsEditStateChange
                        }
                      />
                    </OverviewCardBackground>
                  )
                )}

              {policyDetailsState?.tpaDetails?.length > 0 &&
                policyDetailsState?.tpaDetails?.map(
                  (tpa: any, index: number) => (
                    <OverviewCardBackground key={index}>
                      <EditableDetailsSection
                        sections={tpaDetails}
                        data={tpa}
                        formConfig={rconDetails}
                        formKey="tpaDetails"
                        formRef={additionalDetailsFormRef}
                        onSubmit={handleDetailsSubmit}
                        onEditStateChange={
                          handleAdditionalDetailsEditStateChange
                        }
                      />
                    </OverviewCardBackground>
                  )
                )}
              {/* {policyDetailsState?.crmAccountManagerDetails?.map(
                (crmAccDetails: any, index: number) => ( */}
              <OverviewCardBackground key={0}>
                <EditableDetailsSection
                  sections={crmAccountManagerDetails}
                  data={policyDetailsState?.crmAndAccountManagerDetails}
                  formConfig={rconDetails}
                  formKey="crmAndAccountManagerDetails"
                  formRef={additionalDetailsFormRef}
                  onSubmit={handleDetailsSubmit}
                  onEditStateChange={handleAdditionalDetailsEditStateChange}
                />
              </OverviewCardBackground>
              {/* )
              )} */}
              <OverviewCardBackground>
                <EditableDetailsSection
                  sections={policyRconDetails}
                  data={policyDetailsState?.rconDetails}
                  formConfig={rconDetails}
                  formKey="rconDetails"
                  formRef={additionalDetailsFormRef}
                  onSubmit={handleDetailsSubmit}
                  onEditStateChange={handleAdditionalDetailsEditStateChange}
                  isEditButtonVisible={
                    statusKey?.basicDetailsStatus !== SECTION_STATUS.APPROVED &&
                    statusKey?.basicDetailsStatus !== SECTION_STATUS.SUBMITTED
                  }
                />
              </OverviewCardBackground>

              {policyDetailsState?.premiumInstallments?.length > 0 &&
                policyDetailsState?.premiumInstallments?.map(
                  (installment: any, index: number) => (
                    <OverviewCardBackground key={index}>
                      <EditableDetailsSection
                        sections={premiumInstallmentDetails}
                        data={installment}
                        formConfig={installmentDates}
                        formKey="premiumInstallments"
                        formRef={additionalDetailsFormRef}
                        onSubmit={handleDetailsSubmit}
                        onEditStateChange={
                          handleAdditionalDetailsEditStateChange
                        }
                        isEditButtonVisible={
                          statusKey?.basicDetailsStatus !==
                            SECTION_STATUS.APPROVED &&
                          statusKey?.basicDetailsStatus !==
                            SECTION_STATUS.SUBMITTED
                        }
                      />
                    </OverviewCardBackground>
                  )
                )}

              {policyDetailsState?.companyContacts?.length > 0 &&
                policyDetailsState?.companyContacts?.map(
                  (contact: any, index: number) => (
                    <OverviewCardBackground key={index}>
                      <EditableDetailsSection
                        sections={companyContacts}
                        data={contact}
                        formConfig={rconDetails}
                        formKey="companyContacts"
                        formRef={additionalDetailsFormRef}
                        onSubmit={handleDetailsSubmit}
                        onEditStateChange={
                          handleAdditionalDetailsEditStateChange
                        }
                      />
                    </OverviewCardBackground>
                  )
                )}

              {policyDetailsState?.coInsurer?.length > 0 &&
                policyDetailsState?.coInsurer?.map(
                  (coInsur: any, index: number) => (
                    <OverviewCardBackground key={index}>
                      <EditableDetailsSection
                        sections={coInsurer}
                        data={coInsur}
                        formConfig={rconDetails}
                        formKey="coInsurer"
                        formRef={additionalDetailsFormRef}
                        onSubmit={handleDetailsSubmit}
                        onEditStateChange={
                          handleAdditionalDetailsEditStateChange
                        }
                      />
                    </OverviewCardBackground>
                  )
                )}

              <PolicyActionPanel
                statusKey={statusKey}
                setStatusKey={setStatusKey}
                policyId={Number(id)}
                section={"POLICY_DETAILS"}
                isAnySectionEditing={isAnySectionEditing}
                canApprove={canApprovePolicy}
                approvedBy={sectionApprovalMeta.basicDetails.approvedBy}
                needToApproveBy={
                  sectionApprovalMeta.basicDetails.needToApproveBy
                }
                onSectionsUpdate={handleSectionsUpdate}
              />
              {/* <OverviewCardBackground>
                <EditableDetailsSection
                  sections={additionalSection}
                  data={policyDetailsState?.additionalDetails}
                  formConfig={policyAdditionalDetailsFormConfig}
                  formKey="additionalDetails"
                  formRef={additionalDetailsFormRef}
                  onSubmit={handleDetailsSubmit}
                  onEditStateChange={handleAdditionalDetailsEditStateChange}
                />
              </OverviewCardBackground> */}

              {/* <TopRightButtonWrapper>
                <Button
                  variantType="primary"
                  type="button"
                  onClick={handleApproval}
                  disabled={isAnySectionEditing}
                >
                  {SUBMIT_FOR_APPROVAL}
                </Button>
              </TopRightButtonWrapper> */}
            </div>
          ),
        };
      }
      if (tab.componentKey === POLICY_DETAILS_TABS.CARD_GRID) {
        return {
          ...tab,
          content: (
            <PolicyDetailsContactsTab
              values={{
                companyId: companyId,
                companyName: companyName,
              }}
            />
          ),
        };
      }
      if (tab.componentKey === POLICY_DETAILS_TABS.COVERS) {
        return {
          ...tab,
          content: (
            // Commented for future development
            <div>
              {statusKey?.coversDetailsStatus === SECTION_STATUS.REJECTED && (
                <RequestAlert
                  title={POLICY_ALERT_BOX_DETAILS.TITLE}
                  message={sectionComments.coversDetails}
                />
              )}
              <PolicyDetailsCoversTab
                isEditButtonVisible={
                  statusKey?.coversDetailsStatus !== SECTION_STATUS.APPROVED &&
                  statusKey?.coversDetailsStatus !== SECTION_STATUS.SUBMITTED
                }
                onEditStateChange={setIsCoversEditing}
              />

              <PolicyActionPanel
                statusKey={statusKey}
                setStatusKey={setStatusKey}
                policyId={Number(id)}
                section={"POLICY_COVERS"}
                isAnySectionEditing={isAnySectionEditing}
                canApprove={canApprovePolicy}
                approvedBy={sectionApprovalMeta.coversDetails.approvedBy}
                needToApproveBy={
                  sectionApprovalMeta.coversDetails.needToApproveBy
                }
                onSectionsUpdate={handleSectionsUpdate}
              />
            </div>
          ),
        };
      }
      if (tab.componentKey === POLICY_DETAILS_TABS.CD_DETAILS) {
        return {
          ...tab,
          content: (
            <TableContainer>
              {statusKey?.cdDetails === SECTION_STATUS.REJECTED && (
                <RequestAlert
                  title={POLICY_ALERT_BOX_DETAILS.TITLE}
                  message={sectionComments.cdDetails}
                />
              )}
              <PolicyDetailsCDDetailsTab
                isEditButtonVisible={
                  statusKey?.cdDetails !== SECTION_STATUS.APPROVED &&
                  statusKey?.cdDetails !== SECTION_STATUS.SUBMITTED
                }
                onEditStateChange={setIsCdDetailsEditing}
              />
              <PolicyActionPanel
                statusKey={statusKey}
                setStatusKey={setStatusKey}
                policyId={Number(id)}
                section={"POLICY_CD"}
                isAnySectionEditing={isAnySectionEditing}
                canApprove={canApprovePolicy}
                approvedBy={sectionApprovalMeta.cdDetails.approvedBy}
                needToApproveBy={sectionApprovalMeta.cdDetails.needToApproveBy}
                onSectionsUpdate={handleSectionsUpdate}
              />
            </TableContainer>
          ),
        };
      }
      if (tab.componentKey === POLICY_DETAILS_TABS.EXTENSION_HISTORY) {
        return {
          ...tab,
          content: (
            <PolicyDetailsExtensionHistoryTab
              policyId={Number(id)}
            />
          ),
        };
      }
      if (tab.componentKey === POLICY_DETAILS_TABS.ASSET_INSURED) {
        return {
          ...tab,
          content: <AssetInsured policyId={id} />,
        };
      }
      if (tab.componentKey === POLICY_DETAILS_TABS.INSTALLMENTS) {
        return {
          ...tab,
          content: (
            <TableContainer>
              <PolicyDetailsInstallmentsTab
                premiumAndBrokerageDetails={
                  policyDetailsData?.data?.premiumAndBrokerageDetails
                }
              />
            </TableContainer>
          ),
        };
      }
      if (tab.componentKey === POLICY_DETAILS_TABS.POLICY_EMPLOYEE_DATA) {
        return {
          ...tab,
          content: (
            <PolicyDetailsContainer>
              <PolicyEmployeeDataTab />
            </PolicyDetailsContainer>
          ),
        };
      }

      if (tab.componentKey === POLICY_DETAILS_TABS.INSURED_DETAILS) {
        const insuredColumns = isGroupPolicyType ? employeeInsuredColumns : "";

        return {
          ...tab,
          content: (
            <TableContainer>
              <InsuredDetailsTable
                isGroupPolicyType={isGroupPolicyType}
                policyId={Number(id)}
                columns={insuredColumns}
                policyFrom={policyDetailsState?.basicDetails?.policyFrom ?? null}
                policyTo={policyDetailsState?.basicDetails?.policyTo ?? null}
              />
            </TableContainer>
          ),
        };
      }

      // Uncomment this section when PolicyDetailsPolicyDefinationTab is ready
      // if (tab.componentKey === "policyDefinition") {
      //   return {
      //     ...tab,
      //     content: (
      //       <Container>
      //         <PolicyDetailsPolicyDefinationTab />
      //       </Container>
      //     ),
      //   };
      // }
      if (tab.componentKey === POLICY_DETAILS_TABS.POLICY_DASHBOARD) {
        return {
          ...tab,
          content: (
            <TableContainer>
              <PolicyDashboard
                ref={policyDashboardRef}
                isConfigStatusLive={isLive}
                handleUpdateCompany={handleUpdateCompany}
                isGroupPolicyType={isGroupPolicyType}
                isEnrolmentPremiumBased={isEnrolmentPremiumBased}
                inceptionId={policyDetailsData?.data?.inceptionId}
                isInceptionCompleted={
                  policyDetailsData?.data?.isInceptionCompleted
                }
                companyId={policyDetailsData?.data?.companyId}
                policyStatus={policyStatus}
              />
            </TableContainer>
          ),
        };
      }

      if (tab.componentKey === POLICY_DETAILS_TABS.PORTAL_CONFIGURATION) {
        return {
          ...tab,
          content: (
            <OverviewCardBackground>
              <PortalConfigurationTab
                policyId={policyDetailsData?.data?.policyId}
                isGMCPolicy={isGMCPolicy}
                policyDetailsData={policyDetailsData}
              />
            </OverviewCardBackground>
          ),
        };
      }

      if (tab.componentKey === POLICY_DETAILS_TABS.DOCUMENTS) {
        const policyPrefix = `policy_${
          policyDetailsData?.data?.policyId || "unknown"
        }`;
        const policyId = Number(policyDetailsData?.data?.policyId);
        return {
          ...tab,
          content: (
            <>
              <DisplayDocuments
                endPoint={endPoints.policyDocs(policyId)}
                customColumns={(handleDownload) => policyDocumentsColumns(handleDownload, hasRbacExportPolicies)}
                emptyDataMessage={NO_DOCUMENTS_AVAILABLE_FOR_POLICY}
                onCellClicked={(e) =>
                  handleDocumentCellClicked(e, setActivePolicyTabKey)
                }
                smartSearchConfig={smartSearchConfig}
                fileNamePrefix={policyPrefix}
                downloadModuleKey="policies"
                isExportFeatureEnabled={environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD}
                permissionFeatureKey={FeatureKey.EXPORT_POLICIES}
                onUpload={() => setUploadModalOpen(true)}
                refreshKey={uploadRefreshKey}
              />
              <UploadDocumentModal
                open={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                policyId={policyId}
                onUploadSuccess={() => setUploadRefreshKey((k) => k + 1)}
              />
            </>
          ),
        };
      }

      if (tab.componentKey === POLICY_DETAILS_TABS.MAPPING_CONFIGURATION) {
        const flagEnabled = environment.featureFlag.FF_MAPPING_CONFIGURATION;
        const isPolicyActive = policyDetailsData?.data?.policyStatus?.lookUpValue?.toLowerCase() === "active";
        const isDisabled = !flagEnabled || (flagEnabled && !isPolicyActive);
        return {
          ...tab,
          content: (
            <UtilityExcelUploadPage entity={UTILITY_UPLOAD_ENTITY.UPLOAD_INCEPTION} />
          ),
          disabled: isDisabled
        };
      }
      
      if (tab.componentKey === POLICY_DETAILS_TABS.FINANCIAL_INFO) {
        return {
          ...tab,
          content: <FinancialInfoTab policyId={Number(id)} />,
        };
      }

      const Component = tab?.componentKey
        ? componentMap[tab.componentKey]
        : undefined;
      return {
        ...tab,
        content: Component ? <Component /> : null,
      };
    });

  const defaultTabKey = tabs[0]?.tabKey;

  const [activePolicyTabKey, setActivePolicyTabKey] = useState<
    string | undefined
  >(resolvedActiveTabKey ?? defaultTabKey);

  const handleTabChange = useCallback((key: string) => {
    setActivePolicyTabKey(key);
  }, []);

  //breadcrumbs
  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const policyBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: DETAILS_LABELS.POLICY,
            path: `/policies/${policyDetailsData?.data?.policyId}`,
            key: DETAILS_KEYS.POLICY,
            state: {},
          }),
        ];

  const handleClick = () => {
    const opportunityType =
      policyDetailsData?.data?.opportunityType + " details";
    const detailsKey =
      policyDetailsData?.data?.opportunityType.toLowerCase() + "-details";

    const destinationConfig = {
      label: opportunityType,
      path: `/opportunities/${policyDetailsData?.data?.opportunityId}`,
      key: detailsKey,
    };
    const destinationState = buildBreadcrumbState({
      breadcrumbs: policyBreadcrumb,
      crumb: destinationConfig,
      state: { from: policyDetailsData?.data?.opportunityType },
    });
    navigate(destinationConfig.path, {
      state: destinationState,
    });
  };

  const handleCompanyNameClick = (cardData?: Record<string, any>) => {
    const clickedCompanyId =
      cardData?.companyId ?? policyDetailsData?.data?.headerDetails?.companyId;
    if (!clickedCompanyId) return;

    const clickedCompanyName =
      cardData?.companyName ??
      policyDetailsData?.data?.headerDetails?.companyName;
    const currentPolicyName =
      policyDetailsData?.data?.headerDetails?.displayName;

    const destinationConfig = {
      label: DETAILS_LABELS.COMPANY,
      path: `/companies/${clickedCompanyId}`,
      key: DETAILS_KEYS.COMPANY,
    };
    const destinationState = buildBreadcrumbState({
      breadcrumbs: policyBreadcrumb,
      crumb: destinationConfig,
      state: {
        from: "policyDetails",
        companyName: clickedCompanyName,
        policyName: currentPolicyName,
        policyId: id,
      },
    });
    navigate(destinationConfig.path, {
      state: destinationState,
    });
  };

  if (loading) {
    return (
      <LoaderContainer>
        <CircularProgress />
      </LoaderContainer>
    );
  }

  return (
    <PolicyDetailsContainer>
      <ButtonContainer>
        <CommonBreadcrumb
          crumbs={policyBreadcrumbs(
            companyName,
            companyId,
            policyName,
            from,
            companyData,
            filters
          )}
        />
        {FF_IWORK_POLICY_CONFIGURATOR && (
          <ButtonWrapper>
            {!isEnrolmentPremiumBased && (
              <Button
                variantType={"secondary"}
                onClick={handleUpdateCompany}
                className="edit-button"
                data-testid="configure-button"
                disabled={!isGroupPolicyType}
              >
                {" "}
                {!isLive ? CONFIGURE : VIEW_CONFIGURE}
              </Button>
            )}
            {canActivatePolicy && (
              <ActivatePolicyButtonWrapper>
                <Button
                  variantType={"primary"}
                  onClick={handleActivatePolicyAttempt}
                  className="edit-button"
                  data-testid="activate-policy-button"
                  disabled={isPolicyStatusActive}
                >
                  {" "}
                  {isPolicyStatusActive ? ACTIVE_POLICY : ACTIVATE_POLICY}
                </Button>
              </ActivatePolicyButtonWrapper>
            )}
            {canReconfigurePolicy && isPolicyStatusActive && isGroupPolicyType && (
              <Button
                variantType="secondary"
                onClick={() => setReconfigureModalOpen(true)}
                data-testid="reconfigure-policy-button"
              >
                {RECONFIGURE_POLICY}
              </Button>
            )}
            {/* <Button
              variantType="secondary"
              onClick={handleUpdateCompany}
              className="edit-button"
              data-testid="add-endorsement-button"
              disabled={!isGroupPolicyType}
            >
              {" "}
              {ADD_ENDORSEMENT}
            </Button> */}
          </ButtonWrapper>
        )}
      </ButtonContainer>
      <SummaryCard
        data={{
          ...policyDetailsData?.data?.headerDetails,
          displayName:
            policyDetailsData?.data?.headerDetails?.displayName ||
            "No Title Available",
          policyId: policyDetailsData?.data?.policyId ?? null,
          company: {
            companyName:
              policyDetailsData?.data?.headerDetails?.companyName ||
              "Unknown Company",
            companyId: policyDetailsData?.data?.headerDetails?.companyId || 0,
          },
          opportunityId: policyDetailsData?.data?.opportunityId || "--",
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
        alwaysExpanded={true}
        onCompanyNameClick={handleCompanyNameClick}
      />

      <CustomTabs
        tabs={tabs}
        initialTabKey={defaultTabKey}
        activeTabKey={activePolicyTabKey}
        onTabChange={handleTabChange}
      />

      <CustomModal
        open={activationModalOpen}
        handleClose={() => setActivationModalOpen(false)}
        heading={ACTIVATE_POLICY}
        buttons={[
          {
            label: NO,
            variant: "secondary",
            onClick: () => setActivationModalOpen(false),
          },
          {
            label: YES,
            variant: "primary",
            onClick: handleConfirmActivation,
          },
        ]}
        headingStyles={{
          fontWeight: 500,
          color: "#111111",
        }}
        modalBoxStyles={{
          width: "30%",
        }}
      >
        <ActivationModalContent>
          {ACTIVATE_POLICY_CONFIRMATION}
        </ActivationModalContent>
      </CustomModal>
      <CustomModal
        open={reconfigureModalOpen}
        handleClose={() => setReconfigureModalOpen(false)}
        heading={RECONFIGURE_POLICY}
        buttons={[
          {
            label: NO,
            variant: "secondary",
            onClick: () => setReconfigureModalOpen(false),
          },
          { label: YES, variant: "primary", onClick: handleConfirmReconfigure },
        ]}
        headingStyles={{ fontWeight: 500, color: "#111111" }}
        modalBoxStyles={{ width: "30%" }}
      >
        <ActivationModalContent>
          {RECONFIGURE_POLICY_CONFIRMATION}
        </ActivationModalContent>
      </CustomModal>
    </PolicyDetailsContainer>
  );
};

export default PolicyDetails;
