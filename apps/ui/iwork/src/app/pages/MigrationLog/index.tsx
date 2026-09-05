import { useMemo, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { endPoints, Table, useTableController } from "@ui/ui-lib";
import { TABLE_CONTROLLER_ENTITY_KEY } from "../../constants";
import { getColumns } from "./config";

const getFileNameFromUrl = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.substring(pathname.lastIndexOf("/") + 1)) || url;
  } catch {
    return url;
  }
};

const DownloadLinkRenderer: React.FC<{ value?: string | null }> = ({ value }) => {
  if (!value) {
    return <Typography variant="body2" color="text.disabled">--</Typography>;
  }
  return (
    <Link
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      underline="hover"
      variant="body2"
      title={getFileNameFromUrl(value)}
      sx={{
        cursor: "pointer",
        display: "block",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {getFileNameFromUrl(value)}
    </Link>
  );
};

const MigrationLog: React.FC = () => {
  const [systemFilter, setSystemFilter] = useState("");

  const {
    rowData,
    totalRows,
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    PAGE_SIZE_OPTIONS,
    setColumnOrder,
    columnOrder,
    setSort,
    refetch,
    overallData,
  } = useTableController({
    endpoint: endPoints.getMigrationLogs,
    enabled: true,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.migrationLogEntity,
    customPathParam: systemFilter ? `system=${encodeURIComponent(systemFilter)}` : undefined,
  });

  const systems: string[] = overallData?.systems ?? [];
  const columns = useMemo(() => getColumns(), []);

  const systemFilterControl = (
    <FormControl size="small" sx={{ minWidth: 240, ml: "auto", mr: 2 }}>
      <InputLabel id="migration-log-system-filter-label" shrink>
        Migration Source System
      </InputLabel>
      <Select
        labelId="migration-log-system-filter-label"
        displayEmpty
        value={systemFilter}
        renderValue={(selected) => (selected ? String(selected) : "All Systems")}
        input={<OutlinedInput notched label="Migration Source System" />}
        onChange={(e) => {
          setSystemFilter(e.target.value);
          setCurrentPage(1);
        }}
      >
        <MenuItem value="">All Systems</MenuItem>
        {systems.map((system) => (
          <MenuItem key={system} value={system}>
            {system}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <Box>
      <Table
        columns={columns}
        rowData={rowData}
        totalRows={totalRows}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        setSort={setSort}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        title="Migration Log"
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.migrationLogEntity}
        refetch={refetch}
        showLoader={false}
        onCellClicked={() => {}}
        enableSaveView={false}
        components={{ DownloadLinkRenderer }}
        showRefreshButton={true}
        headerSearchSlot={systemFilterControl}
        emptyDataMessage="No migration runs recorded yet"
      />
    </Box>
  );
};

export default MigrationLog;
