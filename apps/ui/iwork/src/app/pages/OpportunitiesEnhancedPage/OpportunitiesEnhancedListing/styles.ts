import { Box, styled } from "@mui/material";

// The page container aligns flex children to flex-start, so any section
// wrapper must claim width:100% itself or it shrinks to its content.
export const RecordsSectionWrapper = styled("div")`
  width: 100%;
`;

export const OpportunitiesEnhancedListingContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 18px 24px;
  gap: 20px;

  .clickable-cell {
    cursor: pointer;
    color: #1976d2;
    text-decoration: underline;
  }
  .titleContainer {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
  .searchContainer {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    align-items: center;
  }
`;

// Keeps the hidden SmartSearch mounted (wires formMethods into the query
// layer) without rendering it — the visible fields live in the filter drawer.
export const HiddenSearchWrapper = styled(Box)`
  display: none;
`;
