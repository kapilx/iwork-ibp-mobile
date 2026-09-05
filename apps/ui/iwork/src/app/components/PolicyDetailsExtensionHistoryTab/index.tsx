import { endPoints, Table, useTableController } from "@ui/ui-lib";
import React from "react";
import { extensionHistoryColumns } from "./config";
import { Container, Title } from "./styles";
import { EXTENSION_HISTORY } from "../../constants";

interface PolicyDetailsExtensionHistoryTabProps {
  policyId: number;
}

const PolicyDetailsExtensionHistoryTab: React.FC<
  PolicyDetailsExtensionHistoryTabProps
> = ({ policyId }) => {
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
    endpoint: endPoints.getPolicyExtensionAuditHistory(policyId),
  });

  return (
    <Container>
      <Title>{EXTENSION_HISTORY} </Title>
      <Table
        columns={extensionHistoryColumns}
        rowData={rowData}
        totalRows={totalRows}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={() => {}}
        setSort={setSort}
        title=""
      />
    </Container>
  );
};

export default PolicyDetailsExtensionHistoryTab;
