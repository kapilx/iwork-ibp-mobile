import {
  ImageText,
  endPoints,
  setToastMessage,
  useTableController,
  Table,
  ChipRenderer,
} from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { GENERIC_ERROR } from "../../constants/index";
import { opportunityColumns } from "./config";
import { useNavigate, useParams } from "react-router-dom";
import {
  OpportunityContainer,
  TitleContainer,
} from "../../pages/CompanyPage/CompanyDetails/styles";
import opportunitiesImage from "../../assets/svgs/opportunities.svg";
import { CellClickedEvent } from "ag-grid-community";

const CompanyRenewalOpportunities = () => {
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
    customPathParam: `type=RO`,
  });
  const navigate = useNavigate();

  const onCellClicked = (event: CellClickedEvent) => {
    if (
      event.colDef.field === "policyTypeData.value" ||
      event.colDef.field === "activityName"
    ) {
      navigate(`/opportunities/${event.data.opportunityId}`);
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
        components={{ ChipRenderer }}
      />
    </OpportunityContainer>
  );
};

export default CompanyRenewalOpportunities;
