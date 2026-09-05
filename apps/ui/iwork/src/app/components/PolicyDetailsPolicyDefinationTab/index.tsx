import { endPoints, setToastMessage, useTableController, Table } from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { GENERIC_ERROR } from "../../constants/index.js";
import { policyDefinationColumns, policyDefinationData } from "./config.js";
import { useParams } from "react-router-dom";

export const renderListInCell = (value: any) => {
  if (!Array.isArray(value)) return value;
  return (
    <>
      {value.map((item, index) => (
        <div key={index}>{item ?? "--"}</div>
      ))}
    </>
  );
};

const PolicyDetailsPolicyDefinationTab = () => {
  const { id: policyId } = useParams();
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
    endpoint: endPoints.getCdDetailsByPolicyId(Number(policyId)),
    customPathParam: `section=cdDetails`,
    searchFieldName: "policyName",
  });
  const getDynamicRowHeight = (params: any) => {
    const baseHeight = 54;
    const maxLines = Math.max(
      params.data?.configuration?.length || 1,
      params.data?.max?.length || 1,
      params.data?.min?.length || 1,
      params.data?.total?.length || 1,
    );
    return maxLines * baseHeight;
  };

  return (
    <Table
      columns={policyDefinationColumns}
      rowData={policyDefinationData}
      totalRows={totalRows}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      loading={loading}
      pageSize={pageSize}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      setPageSize={setPageSize}
      onCellClicked={() => {}}
      onPrimaryActionClick={() => {}}
      setSort={setSort}
      title={""}
      getRowHeight={getDynamicRowHeight}
    />
  );
};

export default PolicyDetailsPolicyDefinationTab;
