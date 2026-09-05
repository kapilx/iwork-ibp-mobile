import { endPoints, Table, useLocalization, useTableController } from "@ui/ui-lib";
import { useMemo } from "react";
import { getSubAssetsColumns } from "./config";

interface SubAssetDataTableProps {
  policyId: number | string;
}

const SubAssetDataTable = ({ policyId }: SubAssetDataTableProps) => {
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
    endpoint: endPoints.policySubAssetData(Number(policyId)),
  });

  const { localizationData } = useLocalization();
      const SubAssetCols = useMemo(() => {
        return getSubAssetsColumns(localizationData?.data);
      }, [localizationData]);

      
  return (
    <Table
        columns={SubAssetCols}
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
        title={"Sub coverage details"}
        enableSaveView={false}
        displaySettingsButton={false}
        components={{}}
      />
  )
};

export default SubAssetDataTable;
