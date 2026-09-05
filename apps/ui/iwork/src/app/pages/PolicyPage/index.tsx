import React from "react";
import PolicyListing from "./PolicyListing";
import {
  OpportunitiesPageStyledContainer,
  TableWrapper,
} from "../OpportunitiesPage/styles";

const PolicyPage: React.FC = () => (
  <OpportunitiesPageStyledContainer>
    <TableWrapper>
      <PolicyListing />
    </TableWrapper>
  </OpportunitiesPageStyledContainer>
);

export default PolicyPage;
