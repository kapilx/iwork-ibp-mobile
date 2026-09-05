import { QuoteCoverDetailsWrapper } from "./styles";
import {
  CoverTypography,
  IconAndTextWrapper,
  IconTypography,
} from "../VersionsTabs/styles";
import { BASIC_COVERS, COMPARE, COVER_DETAILS, REFRESH } from "../../constants";
import { CommonTypography } from "../../pages/OpportunityActivities/Activities/RFPDataCollection/styles";
import RefreshIcon from "../../assets/svgs/refresh-icon.svg";
import CompareIcon from "../../assets/svgs/compare-logo.svg";
import { CustomDivider } from "../../pages/OpportunityActivities/Activities/EnterQuote/QuoteForm/styles";

interface LookUpCoverDetailsHeaderProps {
  isBasicCoverVisible?: boolean;
  showRefresh?: boolean;
}

const LookUpCoverDetailsHeader = ({
  isBasicCoverVisible = true,
  showRefresh = true,
}: LookUpCoverDetailsHeaderProps) => {
  return (
    <>
      <QuoteCoverDetailsWrapper>
        <CoverTypography>{COVER_DETAILS}</CoverTypography>
        <IconAndTextWrapper>
          {showRefresh && (
            <>
              <img src={RefreshIcon} alt="RefreshIcon" />
              <IconTypography>{REFRESH}</IconTypography>
              <CustomDivider />
            </>
          )}
          <img src={CompareIcon} alt="CompareIcon" />
          <IconTypography>{COMPARE}</IconTypography>
        </IconAndTextWrapper>
      </QuoteCoverDetailsWrapper>
      {isBasicCoverVisible && (
        <CommonTypography>{BASIC_COVERS}</CommonTypography>
      )}
    </>
  );
};

export default LookUpCoverDetailsHeader;
