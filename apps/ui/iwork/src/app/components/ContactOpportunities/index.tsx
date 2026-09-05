import {
  AccordionTitles,
  Button,
  ImageText,
  endPoints,
  useTableController,
  setToastMessage,
  Table,
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
import {
  TitleContainer,
  OpportunityContainer,
} from "../../pages/CompanyPage/CompanyDetails/styles";
import opportunitiesImage from "../../assets/svgs/opportunities.svg";
import { CellClickedEvent } from "ag-grid-community";

export interface ContactData {
  contactId: number;
  companyId?: number;
  companyName?: string;
  displayName?: string;
}

const ContactSalesOpportunities = ({
  contactData,
}: {
  contactData: ContactData;
}) => {
  const { id: contactId } = useParams();
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
    endpoint: endPoints.opportunityByContactId(Number(contactId)),
  });
  const navigate = useNavigate();
  const location = useLocation();
  const canCreateOpportunity = useSelector(
    selectHasPermission(FeatureKey.CREATE_OPPORTUNITY)
  );

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const contactSOBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: contactData.displayName ?? DETAILS_LABELS.CONTACT,
            path: `/contact/${contactId}`,
            key: DETAILS_KEYS.CONTACT,
          }),
        ];

  const onCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "policyType.value") {
      const destinationConfig = {
        label: DETAILS_LABELS.SALES_OPPORTUNITY,
        path: `/opportunities/${event.data.opportunityId}`,
        key: DETAILS_KEYS.SALES_OPPORTUNITY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: contactSOBreadcrumb,
        crumb: destinationConfig,
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/opportunities/${event.data.opportunityId}`);
    }
  };
  return (
    <OpportunityContainer>
      <TitleContainer>
        <ImageText
          sectionImage={opportunitiesImage}
          sectionTitle={
            totalRows.length > 0 ? `SO (${totalRows.length})` : "SO"
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
                    companyName: contactData?.companyName,
                    id: contactData?.companyId,
                    label: contactData?.companyName || "--",
                  },
                  isCreated: false,
                  pathname: AccordionTitles.CONTACT_SELECTION,
                  originPath: `/contact/${contactData?.contactId}`,
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
        title={""}
      />
    </OpportunityContainer>
  );
};

export default ContactSalesOpportunities;
