import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { FeatureKey, useHasPermission } from "@ui/ui-lib";

// Row-level Edit action for the Business Targets report. Same wiring the other
// listings use: a named cellRenderer ("ActionButton") registered through the
// Table's `components` map, rather than a bespoke column component.
interface TargetActionsCellProps {
  // ag-grid hands the row through `data`.
  data?: Record<string, any>;
  onEdit: (row: Record<string, any>) => void;
}

const TargetActionsCell: React.FC<TargetActionsCellProps> = ({
  data,
  onEdit,
}) => {
  const canManage = useHasPermission(FeatureKey.MANAGE_BUSINESS_TARGET);

  // Rows carry the underlying business_target.id — the report's group key is
  // that table's natural key, so it is always present. Guarded anyway: without
  // an id there is no record to open.
  if (!canManage || !data?.id) return null;

  return (
    <Tooltip title="Edit target">
      <IconButton
        size="small"
        aria-label="Edit target"
        onClick={(event) => {
          // The Table also wires onCellClicked; keep the icon from firing it.
          event.stopPropagation();
          onEdit(data);
        }}
      >
        <EditIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default TargetActionsCell;
