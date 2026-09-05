import { Box, Skeleton, styled, Typography } from "@mui/material";

export const RenewalOpportunitiesListingStyledContainer = styled(Box)`
  padding: 16px;
`;

export const StyledTitle = styled(Typography)`
  margin-bottom: 16px;
  font-weight: bold;
  font-size: 18px;
  color: #333;
  margin-left: 18px;
`;

export const KPICardContainer = styled(Box)`
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
`;

// The page container aligns flex children to flex-start, so any section
// wrapper must claim width:100% itself or it shrinks to its content.
export const RecordsSectionWrapper = styled("div")`
  width: 100%;
`;

export const RenewalOpportunitiesListingContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 18px 24px;
  gap: 20px;
  // margin-top: 50px;

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

export const KpiSkeletonRow = styled(Box)`
  display: flex;
  gap: 16px;
`;

export const KpiSkeleton = styled(Skeleton)`
  flex: 1;
  border-radius: 8px;
`;
