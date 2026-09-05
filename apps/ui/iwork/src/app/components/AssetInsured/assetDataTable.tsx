import { endPoints, Table, useLocalization, useTableController } from "@ui/ui-lib";
import { getAssestsColumns } from "./config";
import { useMemo } from "react";

interface AssetDataTableProps {
  policyId: number;
}

const AssetDataTable = ({ policyId }: AssetDataTableProps) => {
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
    endpoint: endPoints.policyAssetData(Number(policyId)),
  });

   const { localizationData } = useLocalization();
    const AssetCols = useMemo(() => {
      return getAssestsColumns(localizationData?.data);
    }, [localizationData]);


  return (
    <Table
        columns={AssetCols}
        rowData={rowData}
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
        title={"Coverage details"}
        enableSaveView={false}
        displaySettingsButton={false}
        components={{}}
      />
  )
};

export default AssetDataTable;
