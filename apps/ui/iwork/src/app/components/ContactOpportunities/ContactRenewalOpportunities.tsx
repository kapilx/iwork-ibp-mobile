import {
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
} from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { GENERIC_ERROR } from "../../constants/index";
import { opportunityColumns } from "./config";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  OpportunityContainer,
  TitleContainer,
} from "../../pages/CompanyPage/CompanyDetails/styles";
import opportunitiesImage from "../../assets/svgs/opportunities.svg";
import { CellClickedEvent } from "ag-grid-community";

const ContactRenewalOpportunities = () => {
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
    customPathParam: `type=RO`,
  });
  const navigate = useNavigate();
  const location = useLocation();

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const contactROBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: DETAILS_LABELS.CONTACT,
            path: `/contact/${contactId}`,
            key: DETAILS_KEYS.CONTACT,
          }),
        ];

  const onCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "policyType.value") {
      const destinationConfig = {
        label: DETAILS_LABELS.RENEWAL_OPPORTUNITY,
        path: `/opportunities/${event.data.opportunityId}`,
        key: DETAILS_KEYS.RENEWAL_OPPORTUNITY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: contactROBreadcrumb,
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
            totalRows.length > 0 ? `RO (${totalRows.length})` : "RO"
          }
          imageStyles={{
            width: "20px",
            height: "24px",
            marginTop: "-2px",
            marginLeft: "3px",
          }}
        />
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

export default ContactRenewalOpportunities;
