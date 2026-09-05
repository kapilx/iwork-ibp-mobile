import {
  ChipRenderer,
  DynamicObject,
  ImageText,
  endPoints,
  setToastMessage,
  useTableController,
  Table,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  buildBreadcrumbState,
} from "@ui/ui-lib";
import { PolicyListContainer } from "./styles";
import { CREATE_COMPANY, GENERIC_ERROR } from "../../constants";
import { BREADCRUMB_KEYS } from "@ui/ui-lib";
import { columns } from "./tableConfig";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CellClickedEvent } from "ag-grid-community";
import {
  OpportunityContainer,
  TitleContainer,
} from "../../pages/CompanyPage/CompanyDetails/styles";
import opportunitiesImage from "../../assets/svgs/opportunities.svg";

const PolicyList = ({ values }: DynamicObject) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id: companyId } = useParams();
  const location = useLocation();

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
    endpoint: companyId ? endPoints.policyList(parseInt(companyId)) : "",
    searchFieldName: "policyName",
  });

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const companyBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: `${values?.companyName ?? "Company"}`,
            path: `/companies/${companyId}`,
            key: BREADCRUMB_KEYS.COMPANY_DETAILS,
          }),
        ];

  const onCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "policyNumber") {
      const destinationConfig = {
        label: event.data.policyNumber,
        path: `/policies/${event.data.id}`,
        key: BREADCRUMB_KEYS.POLICY_DETAILS,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: companyBreadcrumb,
        crumb: destinationConfig,
        state: {
          companyName: values?.companyName,
          companyId: values?.companyId,
          from: "company",
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/policies/${event?.data?.id}`, {
      //   state: {
      //     companyName: values?.companyName,
      //     companyId: values?.companyId,
      //     from: "company",
      //   },
      // });
    }
    if (event.colDef.field === "opportunityId") {
      if (event?.data?.opportunityId) {
        const destinationConfig = {
          label: event.data.companyName,
          path: `/opportunities/${event.data.opportunityId}`,
          key: BREADCRUMB_KEYS.COMPANY,
        };
        const destinationState = buildBreadcrumbState({
          breadcrumbs: companyBreadcrumb,
          crumb: destinationConfig,
        });

        navigate(destinationConfig.path, {
          state: destinationState,
        });
        // navigate(`/opportunities/${event?.data?.opportunityId}`);
      }
    }
  };

  return (
    <OpportunityContainer>
      <TitleContainer>
        <ImageText
          sectionImage={opportunitiesImage}
          sectionTitle={
            totalRows.length > 0
              ? `Our portfolio (${totalRows.length})`
              : "Our portfolio"
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
        columns={values.tableConfig ?? columns}
        rowData={rowData}
        totalRows={totalRows}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={onCellClicked}
        components={{ ChipRenderer }}
        primaryActionLabel={CREATE_COMPANY}
        onPrimaryActionClick={() => {}}
        setSort={setSort}
        title={""}
        showLoader={false}
        showDownloadIcon={values.showDownloadIcon} // <-- Pass the flag to Table
      />
    </OpportunityContainer>
  );
};

export default PolicyList;
