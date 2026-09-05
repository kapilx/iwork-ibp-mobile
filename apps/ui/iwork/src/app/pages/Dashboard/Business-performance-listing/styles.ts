import { Box, styled } from "@mui/material";

export const StyledTableWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  marginTop: theme.spacing(6),
  "& .ag-row:nth-of-type(3n+1)": {
    backgroundColor: theme.palette.background.lightBlueActive,
  },
  "& .ag-row:nth-of-type(3n+2)": {
    backgroundColor: theme.palette.background.linenPeach,
  },
  "& .ag-row:nth-of-type(3n)": {
    backgroundColor: theme.palette.background.paper,
  },
  "& :is(.ag-cell, .ag-header-cell)[col-id='annual'], \
   & :is(.ag-cell, .ag-header-cell)[col-id^='q']": {
    backgroundColor: theme.palette.background.internalCircle,
  },
}));
