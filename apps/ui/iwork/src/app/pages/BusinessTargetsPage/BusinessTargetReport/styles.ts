import { Box, styled } from "@mui/material";

// Same page shell as the other listings (mirrors ContactListingStyledContainer)
// so the report sits in the standard padded container instead of a bare
// fragment.
export const BusinessTargetReportContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6, 4.5),
}));

// Gap between the Smart search card and the table below it. CardBackground is
// shared across every listing and carries no bottom margin of its own, so the
// spacing lives here rather than in ui-lib.
export const FilterCardWrapper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));
