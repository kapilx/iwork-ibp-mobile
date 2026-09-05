import { ICellRendererParams } from "ag-grid-community";
import { IconButton, Tooltip } from "@mui/material";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import HowToRegIcon from "@mui/icons-material/HowToReg";

interface DeactivateCellRendererParams extends ICellRendererParams {
  onDeactivateClick?: (rowData: any) => void;
  onActivateClick?: (rowData: any) => void;
}

const DeactivateCellRenderer = (params: DeactivateCellRendererParams) => {
  const isInactive =
    params.data?.status?.lookUpValue?.toLowerCase().includes("inactive") ??
    false;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInactive) {
      params.onActivateClick?.(params.data);
    } else {
      params.onDeactivateClick?.(params.data);
    }
  };

  return (
    <Tooltip title={isInactive ? "Activate" : "Deactivate"} placement="top">
      <IconButton
        size="small"
        onClick={handleClick}
        sx={{
          padding: "2px",
          color: isInactive ? "success.main" : "error.main",
        }}
        aria-label={isInactive ? "Activate employee" : "Deactivate employee"}
      >
        {isInactive ? (
          <HowToRegIcon sx={{ fontSize: 18 }} />
        ) : (
          <PersonOffIcon sx={{ fontSize: 18 }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default DeactivateCellRenderer;
