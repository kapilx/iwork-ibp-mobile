import {
  AccordionTitles,
  Button,
  ImageText,
  endPoints,
  setToastMessage,
  useTableController,
  Table,
  ChipRenderer,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  buildBreadcrumbState,
  DETAILS_LABELS,
  DETAILS_KEYS,
  selectHasPermission,
  FeatureKey,
} from "@ui/ui-lib";
import { useDispatch, useSelector } from "react-redux";
import { GENERIC_ERROR } from "../../constants/index";
import { opportunityColumns } from "./config";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { BREADCRUMB_KEYS } from "@ui/ui-lib";
import {
  TitleContainer,
  OpportunityContainer,
} from "../../pages/CompanyPage/CompanyDetails/styles";
import opportunitiesImage from "../../assets/svgs/opportunities.svg";
import { CellClickedEvent } from "ag-grid-community";

export interface CompanyData {
  companyId: number;
  companyName?: string;
  displayName?: string;
}

// activeTabKey is a string representing the CompanyDetails tab to open on return
const CompanySalesOpportunities = ({
  companyData,
  activeTabKey,
}: {
  companyData: CompanyData;
  activeTabKey: string;
}) => {
  const { id: companyId } = useParams();
  const dispatch = useDispatch();
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
  } = useTableController({
    endpoint: endPoints.opportunityByCompanyId(Number(companyId)),
    // No `type` filter: this table lists both SO and RO for the company.
    // Won opportunities are dropped server-side.
    customPathParam: `excludeWon=true`,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const canCreateOpportunity = useSelector(
    selectHasPermission(FeatureKey.CREATE_OPPORTUNITY)
  );

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const companyBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: `${companyData?.companyName ?? "Company"}`,
            path: `/companies/${companyId}`,
            key: BREADCRUMB_KEYS.COMPANY_DETAILS,
          }),
        ];

  const onCellClicked = (event: CellClickedEvent) => {
    if (
      event.colDef.field === "policyTypeData.value" ||
      event.colDef.field === "activityName"
    ) {
      // This table mixes SO and RO rows, so the destination crumb has to follow
      // the clicked row's own type - otherwise every row reads "SO details".
      const isRenewal = event.data?.opportunityType === "RO";
      const destinationConfig = {
        label: isRenewal
          ? DETAILS_LABELS.RENEWAL_OPPORTUNITY
          : DETAILS_LABELS.SALES_OPPORTUNITY,
        path: `/opportunities/${event.data.opportunityId}`,
        key: isRenewal
          ? DETAILS_KEYS.RENEWAL_OPPORTUNITY
          : DETAILS_KEYS.SALES_OPPORTUNITY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: companyBreadcrumb,
        crumb: destinationConfig,
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
    }
  };
  return (
    <OpportunityContainer>
      <TitleContainer>
        <ImageText
          sectionImage={opportunitiesImage}
          sectionTitle={
            totalRows.length > 0
              ? `Opportunities (${totalRows.length})`
              : "Opportunities"
          }
          imageStyles={{
            width: "20px",
            height: "24px",
            marginTop: "-2px",
            marginLeft: "3px",
          }}
        />
        {canCreateOpportunity && (
          <Button
            variantType="secondary"
            onClick={() => {
              navigate("/create2", {
                state: {
                  ...location.state,
                  [AccordionTitles.COMPANY_SELECTION]: {
                    companyName:
                      companyData?.companyName || companyData?.displayName,
                    id: companyData?.companyId,
                    label: companyData?.companyName || companyData?.displayName,
                  },
                  searchedString:
                    companyData?.companyName || companyData?.displayName,
                  isCreated: false,
                  pathname: AccordionTitles.CONTACT_SELECTION,
                  originPath: `/companies/${companyData?.companyId}`,
                  activeTabKey: activeTabKey,
                },
              });
            }}
          >
            Add opportunity
          </Button>
        )}
      </TitleContainer>

      <Table
        columns={opportunityColumns}
        rowData={rowData}
        totalRows={totalRows}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={onCellClicked}
        onPrimaryActionClick={() => {}}
        setSort={setSort}
        components={{ ChipRenderer }}
        title={""}
        showLoader={false}
      />
    </OpportunityContainer>
  );
};

export default CompanySalesOpportunities;
