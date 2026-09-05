import React from "react";
import { OpportunitiesPageStyledContainer, TableWrapper } from "./styles";
import OpportunitiesEnhancedListing from "./OpportunitiesEnhancedListing";

const OpportunitiesEnhancedPage: React.FC = () => {
  return (
    <OpportunitiesPageStyledContainer>
      <TableWrapper>
        <OpportunitiesEnhancedListing />
      </TableWrapper>
    </OpportunitiesPageStyledContainer>
  );
};

export default OpportunitiesEnhancedPage;
