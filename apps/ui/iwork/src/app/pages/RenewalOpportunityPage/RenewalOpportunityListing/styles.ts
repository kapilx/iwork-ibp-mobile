import { Box, styled, Typography } from "@mui/material";

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

export const RenewalOpportunitiesListingContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 18px 24px;
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
