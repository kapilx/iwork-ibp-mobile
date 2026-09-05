import { Checkbox, ChipRenderer } from "@ui/ui-lib";
import {
  OpportunityCompanyTypeStyleMap,
  OpportunitycrmLeadStyleMap,
} from "../OpportunityProgressStepper/opportunityCardTypes";
import {
  ChipContainer,
  OpportunityStepperCompanyName,
  CompanyTypeTypography,
  LabelStyles,
} from "../OpportunityProgressStepper/OpportunityProgessHeader/styles";
import {
  CommonTypography,
  ComparisonPrimarySection,
  ComparisonSecondarySection,
  QuoteComparisonMainContainer,
  VersionContainer,
  VersionDetailsContainer,
  VersionTypography,
} from "./styles";
import { DividerLine } from "../Header/styles";
import { useEffect } from "react";
import { Typography } from "@mui/material";
import { NO_QUOTES_AVAILABLE } from "../../constants";

const QuoteComparisonCard = ({
  selectedInsurers,
  setSelectedInsurers,
  dynamicInsurers,
  versionData,
  selectedVersionIndex,
  setSelectedVersionIndex,
  isQuoteNotAvailable,
}: {
  selectedInsurers: string[];
  setSelectedInsurers: (insurers: string[]) => void;
  dynamicInsurers: string[];
  versionData: any;
  selectedVersionIndex: number;
  setSelectedVersionIndex: (idx: number) => void;
  isQuoteNotAvailable?: boolean;
}) => {
  const activityTypes = [/* "RFP", */ "Broking Slip"];

  // Ensure only RFP is checked initially
  useEffect(() => {
    setSelectedInsurers((prev) => {
      const allowed = [...activityTypes, ...dynamicInsurers];
      const filtered = prev.filter((i) => allowed.includes(i));
      const isSame =
        filtered.length === prev.length &&
        filtered.every((v) => prev.includes(v));

      return isSame ? prev : filtered;
    });
  }, [dynamicInsurers]);

  const handleCheckboxChange = (insurer: string) => {
    if (selectedInsurers.includes(insurer)) {
      setSelectedInsurers(selectedInsurers.filter((i) => i !== insurer));
    } else {
      setSelectedInsurers([...selectedInsurers, insurer]);
    }
  };

  return (
    <>
      <QuoteComparisonMainContainer>
        {versionData?.data?.map((version: any, index: number) => (
          <>
            {selectedVersionIndex !== index ? (
              <VersionContainer
                key={index}
                onClick={() => setSelectedVersionIndex(index)}
              >
                <VersionTypography>
                  {version?.brokingSlipName || "--"}
                </VersionTypography>
              </VersionContainer>
            ) : (
              <VersionDetailsContainer key={index} className="expanded">
                <ComparisonPrimarySection>
                  <OpportunityStepperCompanyName>
                    {version?.brokingSlipName || "--"}
                  </OpportunityStepperCompanyName>
                  <ChipContainer>
                    <ChipRenderer
                      value={
                        <CommonTypography>
                          <LabelStyles>CRM - </LabelStyles>
                          <b>{version?.owner || "--"}</b>
                        </CommonTypography>
                      }
                      styleMap={OpportunitycrmLeadStyleMap}
                      size="small"
                      variant="withImage"
                      padding="4px 8px"
                    />
                    <ChipRenderer
                      value={
                        <CompanyTypeTypography>
                          {version?.opportunityType || "--"}
                        </CompanyTypeTypography>
                      }
                      styleMap={OpportunityCompanyTypeStyleMap}
                      size="small"
                      maxWidth="40px"
                    />
                  </ChipContainer>
                </ComparisonPrimarySection>
                <ComparisonSecondarySection>
                  {activityTypes.map((activity: string, idx: number) => (
                    <Checkbox
                      key={idx}
                      label={activity}
                      isChecked={selectedInsurers.includes(activity)}
                      isIndeterminate={false}
                      onChange={() => {
                        handleCheckboxChange(activity);
                      }}
                      isIcon={false}
                    />
                  ))}
                  <DividerLine />
                  {isQuoteNotAvailable === true ? (
                    <Typography>{NO_QUOTES_AVAILABLE}</Typography>
                  ) : (
                    dynamicInsurers.map((insurer: string, idx: number) => (
                      <Checkbox
                        key={idx}
                        label={insurer}
                        isChecked={selectedInsurers.includes(insurer)}
                        isIndeterminate={false}
                        onChange={() => {
                          handleCheckboxChange(insurer);
                        }}
                        isIcon={false}
                      />
                    ))
                  )}
                </ComparisonSecondarySection>
              </VersionDetailsContainer>
            )}
          </>
        ))}
      </QuoteComparisonMainContainer>
    </>
  );
};

export default QuoteComparisonCard;
