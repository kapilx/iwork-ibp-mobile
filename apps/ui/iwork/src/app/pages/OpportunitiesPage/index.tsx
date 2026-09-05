import React from "react";
import { OpportunitiesPageStyledContainer, TableWrapper } from "./styles";
import OpportunitiesListing from "./OpportunitiesListing";

const OpportunitiesPage: React.FC = () => {
  return (
    <OpportunitiesPageStyledContainer>
      <TableWrapper>
        <OpportunitiesListing />
      </TableWrapper>
    </OpportunitiesPageStyledContainer>
  );
};

export default OpportunitiesPage;
