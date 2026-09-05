import {
  ChipRenderer,
  DynamicObject,
  ImageText,
  useTableController,
  endPoints,
  Table,
  useLocalization,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  buildBreadcrumbState,
} from "@ui/ui-lib";
import { Container } from "./styles";
import { CREATE_QUICK_CONTACT, GENERIC_ERROR } from "../../constants";
import { columns } from "./tableConfig";
import { setToastMessage } from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CellClickedEvent } from "ag-grid-community";

import {
  OpportunityContainer,
  TitleContainer,
} from "../../pages/CompanyPage/CompanyDetails/styles";
import opportunitiesImage from "../../assets/svgs/opportunities.svg";

const ContactPolicyList = ({ values }: DynamicObject) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id: contactId } = useParams();
  const { localizationData } = useLocalization();
  const localization = localizationData?.data;

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
    endpoint: contactId
      ? endPoints.policyListBycontactId(parseInt(contactId))
      : "",
    searchFieldName: "policyName",
  });

  const location = useLocation();
  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const contactPolicyBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: "Contact Details",
            path: `/contact/${contactId}`,
            key: "contact-details",
          }),
        ];

  const onCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "policyName") {
      const destinationConfig = {
        label: "Policy Details",
        path: `/policies/${event?.data?.id}`,
        key: "policy-details",
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: contactPolicyBreadcrumb,
        crumb: destinationConfig,
        state: {
          companyName: values?.companyName,
          companyId: values?.companyId,
        },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/policies/${event?.data?.id}`, {
      //   state: {
      //     companyName: values?.companyName,
      //     companyId: values?.companyId,
      //     from: "contact",
      //   },
      // });
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
        columns={columns(localization)}
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
        primaryActionLabel={CREATE_QUICK_CONTACT}
        onPrimaryActionClick={() => {}}
        setSort={setSort}
        title={""}
      />
    </OpportunityContainer>
  );
};

export default ContactPolicyList;
