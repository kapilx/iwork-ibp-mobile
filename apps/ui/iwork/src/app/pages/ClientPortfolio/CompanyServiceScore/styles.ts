import { Box, styled } from "@mui/material";

export const StyledTableWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  "& .clickable-row": {
    cursor: "pointer",
  },
}));
