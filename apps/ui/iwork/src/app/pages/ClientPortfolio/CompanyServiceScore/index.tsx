import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  ChipRenderer,
  SERVICE_SCORE_TITLE,
  VIEW_DETAILS,
  PAGE_SIZE_OPTIONS,
} from "@ui/ui-lib";
import { TitleContainer } from "../../CompanyPage/CompanyListing/styles";
import { columnDefs } from "./tableConfig";
import { CardBackground } from "../CompanyOverView/styles";
import ServiceScoreDetails from "../ServiceScoreDetails/index";
import showIcon from "../../../assets/svgs/eye.svg";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton";
import { StyledTableWrapper } from "./styles";

interface CompanyPoliciesProps {
  companyData: any;
}

const CompanyServiceScore: React.FC<CompanyPoliciesProps> = ({
  companyData,
}) => {
  const [selectedScoreId, setSelectedScoreId] = useState<any | null>(null);
  const serviceScoreDetailsRef = useRef<HTMLDivElement>(null);

  const summaryData = companyData?.serviceScoreSummary;

  const months = (summaryData?.serviceScore ?? []).map((monthRow: any) => ({
    month: monthRow.month,
    marksScored: monthRow.scoredMarks,
    totalMarks: monthRow.totalMarks,
    percentage: monthRow.scorePercentage,
    indicator: monthRow.indicator,
    details: monthRow.details,
  }));

  // Handle row click - this will be called when any cell in the row is clicked
  // This has the exact same functionality as the original "View Details" button
  const handleRowClick = (params: any) => {
    setSelectedScoreId(params.data);
  };

  const ActionButtonRenderer = (params: any) => (
    <ActionButton
      onClick={() => {
        setSelectedScoreId(params.data);
      }}
      buttonText={VIEW_DETAILS}
      imageSrc={showIcon}
      imageStyles={{ width: "20px", height: "20px" }}
      customStyles={{ gap: "10px", border: "none" }}
    />
  );

  // When the selected company changes, clear any previously selected month.
  useEffect(() => {
    setSelectedScoreId(null);
  }, [companyData?.companyId]);

  // Add useEffect to scroll when selectedScoreId changes
  useEffect(() => {
    if (selectedScoreId !== null && serviceScoreDetailsRef.current) {
      // Small delay to ensure the component is rendered before scrolling
      setTimeout(() => {
        serviceScoreDetailsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [selectedScoreId]);

  return (
    <CardBackground>
      <TitleContainer variant="h1">
        {SERVICE_SCORE_TITLE}
      </TitleContainer>
      <StyledTableWrapper>
        <Table
          columns={columnDefs}
          rowData={months}
          totalRows={months.length}
          currentPage={1}
          setCurrentPage={() => {}}
          loading={false}
          pageSize={20}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          setPageSize={() => {}}
          onCellClicked={handleRowClick} // This handles the row click
          setSort={() => {}}
          height={700}
          components={{ ChipRenderer, ActionButton: ActionButtonRenderer }}
          rowClass="clickable-row"
        />
      </StyledTableWrapper>
      {selectedScoreId !== null && (
        <div ref={serviceScoreDetailsRef}>
          <ServiceScoreDetails details={selectedScoreId?.details} />
        </div>
      )}
    </CardBackground>
  );
};

export default CompanyServiceScore;
