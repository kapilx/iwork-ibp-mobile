import { CommonTooltip } from "@ui/ui-lib";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRenewalAwareActivityLabel } from "../../../constants";
import {
  StyledLinkContainer,
  StyledLink,
  UpcomingIconStyled,
  UpcomingNextIconStyled,
  DoneIconStyled,
  ToolTipTypography,
  SelectedCompletedActivityDiv,
  OpportunityLostTypography,
} from "./styles.js";
import NavigateNextIcon from "../../../assets/svgs/navigateNextIcon.svg";
import DoneIcon from "../../../assets/svgs/done.svg";
import UpcommingIcon from "../../../assets/svgs/upcomming.svg";
import ColouredUpcommingIcon from "../../../assets/svgs/colored-upcomming-icon.svg";
import ColouredCancelIcon from "../../../assets/svgs/cancel-icon.svg";

type Crumb = {
  label?: string;
  path?: string;
  title: string;
  activityDueDate?: string | null;
};

interface CommonBreadcrumbProps {
  crumbs: Crumb[];
  flag: number;
  setBreadCumbStep: React.Dispatch<React.SetStateAction<number>>;
  isOpportunityLost?: boolean;
  isOpportunityWon?: boolean;
  opportunityDetails?: any;
}

const CommonOpportunityBreadcrumb: React.FC<CommonBreadcrumbProps> = ({
  crumbs,
  flag,
  setBreadCumbStep,
  isOpportunityLost = false,
  isOpportunityWon = false,
  opportunityDetails,
}) => {
  const [selectedCompletedIndex, setSelectedCompletedIndex] = useState<
    number | null
  >(null);

  const [selectedUpcomingIndex, setSelectedUpcomingIndex] = useState<
    number | null
  >(null);
  const navigate = useNavigate();
  // Display-only: show "Renewal Planning" instead of "BD Planning" for RO.
  // The underlying crumb data/values are unchanged; only the rendered text differs.
  const isRenewal = opportunityDetails?.opportunityType === "RO";
  const displayCrumbs = crumbs.map((crumb) => ({
    ...crumb,
    title: getRenewalAwareActivityLabel(crumb.title, isRenewal) as string,
  }));
  let upcomingSeparatorShown = false;
  const getCrumbType = (index: number): string => {
    if (index < flag - 1) return "past";
    if (index === flag - 1)
      return selectedCompletedIndex != null || selectedUpcomingIndex != null
        ? "past"
        : "justCurrent";
    if (index === flag) return "current";
    if (
      index > flag &&
      (selectedUpcomingIndex != null || selectedCompletedIndex != null)
        ? index < flag + 1
        : index < flag + 2
    )
      return "next";
    return "upcoming";
  };

  const renderCrumbContent = (type: string, crumb: Crumb, index: number) => {
    switch (type) {
      case "past":
        return (
          <StyledLink
            type={type}
            onClick={() => {
              crumb.path && navigate(crumb.path);
              setBreadCumbStep(index);
              setSelectedCompletedIndex(index);
              setSelectedUpcomingIndex(null);
            }}
          >
            {selectedCompletedIndex !== index && (
              <CommonTooltip
                title={
                  <>
                    <ToolTipTypography>{crumb.title}</ToolTipTypography>
                    <ToolTipTypography>
                      {crumb?.activityDueDate ?? "No Due Date"}
                    </ToolTipTypography>
                  </>
                }
              >
                <DoneIconStyled
                  src={DoneIcon}
                  alt="Done"
                  className="icon done"
                />
              </CommonTooltip>
            )}
            {/* Show activity name if all completed and this is the selected one */}

            {selectedCompletedIndex === index && (
              <>
                {selectedCompletedIndex !== 0 && (
                  <UpcomingNextIconStyled
                    src={NavigateNextIcon}
                    alt="next"
                    className="icon next"
                  />
                )}
                <DoneIconStyled
                  src={DoneIcon}
                  alt="Done"
                  className="icon done"
                />
                <span>{crumb.title}</span>
                {selectedCompletedIndex !== flag - 1 && (
                  <UpcomingNextIconStyled
                    src={NavigateNextIcon}
                    alt="next"
                    className="icon next"
                  />
                )}
              </>
            )}
          </StyledLink>
        );

      case "justCurrent":
        return (
          <StyledLink
            type={type}
            onClick={() => {
              crumb.path && navigate(crumb.path);
              setBreadCumbStep(index);
              setSelectedCompletedIndex(null);
            }}
          >
            {flag !== 1 && (
              <UpcomingNextIconStyled
                src={NavigateNextIcon}
                alt="next"
                className="icon next"
              />
            )}
            <DoneIconStyled src={DoneIcon} alt="Done" className="icon done" />
            {crumb.title}
          </StyledLink>
        );

      case "current":
        return (
          <StyledLink
            type={type}
            onClick={() => {
              crumb.path && navigate(crumb.path);
              setBreadCumbStep(index);
              setSelectedUpcomingIndex(null);
              setSelectedCompletedIndex(null);
            }}
          >
            {isOpportunityLost ||
            opportunityDetails?.opportunityStatus?.toLowerCase() === "lost" ? (
              flag === 0 ? (
                <>
                  <img
                    src={ColouredCancelIcon}
                    alt="Opportunity Lost"
                    className="icon cancel"
                  />
                  <OpportunityLostTypography>
                    {crumb.title}
                  </OpportunityLostTypography>
                </>
              ) : (
                <>
                  <SelectedCompletedActivityDiv>
                    <UpcomingNextIconStyled
                      src={NavigateNextIcon}
                      alt="next"
                      className="icon next"
                    />
                    <img
                      src={ColouredCancelIcon}
                      alt="cancel"
                      className="icon cancel"
                    />
                    <OpportunityLostTypography>
                      {crumb.title}
                    </OpportunityLostTypography>
                  </SelectedCompletedActivityDiv>
                </>
              )
            ) : flag === 0 ? (
              <>
                <img
                  src={ColouredUpcommingIcon}
                  alt="upcoming"
                  className="icon upcoming"
                />
                {crumb.title}
              </>
            ) : (
              <>
                <UpcomingNextIconStyled
                  src={NavigateNextIcon}
                  alt="next"
                  className="icon next"
                />
                <img
                  src={ColouredUpcommingIcon}
                  alt="upcoming"
                  className="icon upcoming"
                />
                {crumb.title}
              </>
            )}
          </StyledLink>
        );

      case "next":
        return (
          <StyledLink
            type={type}
            onClick={() => {
              crumb.path && navigate(crumb.path);
              setBreadCumbStep(index);
              setSelectedUpcomingIndex(null);
              setSelectedCompletedIndex(null);
            }}
          >
            <UpcomingNextIconStyled
              src={NavigateNextIcon}
              alt="next"
              className="icon next"
            />
            <img src={UpcommingIcon} alt="upcoming" className="icon upcoming" />
            {crumb.title}
          </StyledLink>
        );

      case "upcoming":
        return (
          <StyledLink
            type={type}
            data-testid={`upcoming-link-${index}`}
            onClick={() => {
              crumb.path && navigate(crumb.path);
              setBreadCumbStep(index);
              setSelectedUpcomingIndex(index);
              setSelectedCompletedIndex(null);
            }}
          >
            {!upcomingSeparatorShown && (
              <UpcomingNextIconStyled
                src={NavigateNextIcon}
                alt="next"
                className="icon next"
              />
            )}
            {selectedUpcomingIndex !== index && (
              <CommonTooltip
                title={
                  <>
                    <ToolTipTypography>{crumb.title}</ToolTipTypography>
                    <ToolTipTypography>
                      {crumb?.activityDueDate ?? "No Due Date"}
                    </ToolTipTypography>
                  </>
                }
              >
                <UpcomingIconStyled
                  src={UpcommingIcon}
                  alt="upcoming"
                  className="icon upcoming"
                />
              </CommonTooltip>
            )}
            {selectedUpcomingIndex === index && (
              <>
                <SelectedCompletedActivityDiv>
                  {index !== flag + 1 && (
                    <img
                      src={NavigateNextIcon}
                      alt="next"
                      className="icon next"
                    />
                  )}
                  <img
                    src={UpcommingIcon}
                    alt="upcoming"
                    className="icon upcoming"
                  />
                  <span>{crumb.title}</span>
                  {index < crumbs.length - 1 && (
                    <img
                      src={NavigateNextIcon}
                      alt="next"
                      className="icon next"
                    />
                  )}
                </SelectedCompletedActivityDiv>
              </>
            )}
          </StyledLink>
        );

      default:
        return null;
    }
  };

  return (
    <StyledLinkContainer>
      {displayCrumbs.map((crumb, index) => {
        const type = getCrumbType(index);
        const content = renderCrumbContent(type, crumb, index);

        if (type === "upcoming" && !upcomingSeparatorShown) {
          upcomingSeparatorShown = true;
        }

        return <React.Fragment key={index}>{content}</React.Fragment>;
      })}
    </StyledLinkContainer>
  );
};

export default CommonOpportunityBreadcrumb;
