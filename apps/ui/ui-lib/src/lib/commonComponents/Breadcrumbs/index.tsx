import React, { useMemo } from "react";
import SeparatorArrow from "../../assets/svgs/pagination-left.svg";
import { useLocation, useNavigate } from "react-router-dom";
import {
  StyledBreadcrumbs,
  StyledLink,
  BreadCrumbStyledTypography,
  StyledTooltipBreadcrumb,
} from "./styles";
import { Box, Tooltip, TooltipProps, tooltipClasses } from "@mui/material";
import { styled } from "@mui/material/styles";

export const WhiteTooltip = styled((props: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: props.className }} />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "white",
    color: "black",
    boxShadow: "0px 2px 8px rgba(0,0,0,0.15)",
    fontSize: "0.875rem",
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "white",
  },
}));

type State = { [key: string]: any };

export type Crumb = {
  label: string;
  key: string;
  path?: string;
  state?: State;
};

interface CommonBreadcrumbProps {
  crumbs?: Crumb[];
}

const MAX_VISIBLE = 5;

const CommonBreadcrumb: React.FC<CommonBreadcrumbProps> = ({ crumbs }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const crumbsToRender = useMemo(() => {
    const stateCrumbs =
      location.state && Array.isArray(location.state.breadcrumbs)
        ? (location.state.breadcrumbs as Crumb[])
        : [];

    // return stateCrumbs;
    if (stateCrumbs.length > 0) {
      return stateCrumbs;
    }

    if (crumbs?.length) {
      return crumbs;
    }
    return [];
  }, [crumbs, location.state]);

  const collapsedBreadcrumbs = useMemo(() => {
    if (crumbsToRender && crumbsToRender.length <= MAX_VISIBLE) {
      return crumbsToRender;
    }

    const first = crumbsToRender[0];
    const last = crumbsToRender.slice(-4);

    return [first, { label: "...", key: "collapsed" }, ...last];
  }, [crumbsToRender]);

  if (!crumbsToRender.length) {
    return null;
  }

  const handleBreadCrumbClick = (crumb: Crumb, index: number) => {
    if (crumb.key === "collapsed") return;
    const newCrumbs = crumbsToRender.slice(0, index + 1);
    const lastCrumb = crumbsToRender[crumbsToRender.length - 1];
    crumb.path &&
      navigate(crumb.path, {
        state: {
          ...(crumb.state ?? {}),
          breadcrumbs: newCrumbs,
          lastRemovedBreadcrumb: lastCrumb ?? null,
        },
      });
  };

  return (
    <StyledBreadcrumbs
      separator={<img src={SeparatorArrow} alt="separator" />}
      aria-label="breadcrumb"
      data-testid={
        crumbsToRender[0].label.replace(" ", "-").toLowerCase() + "-breadcrumb"
      }
    >
      {collapsedBreadcrumbs.map((crumb, index) => {
        const isLast = index === collapsedBreadcrumbs.length - 1;

        // Special case for collapsed crumb
        if (crumb.key === "collapsed") {
          return (
            <WhiteTooltip
              key="collapsed"
              title={
                <Box>
                  {crumbsToRender.slice(1, -4).map((hiddenCrumb, idx) => (
                    <StyledTooltipBreadcrumb
                      key={idx}
                      onClick={() =>
                        handleBreadCrumbClick(hiddenCrumb, idx + 1)
                      }
                    >
                      {hiddenCrumb.label}
                    </StyledTooltipBreadcrumb>
                  ))}
                </Box>
              }
              arrow
            >
              <BreadCrumbStyledTypography
                sx={{
                  cursor: "pointer",
                }}
              >
                ...
              </BreadCrumbStyledTypography>
            </WhiteTooltip>
          );
        }

        // Normal link for non-last crumbs
        if (crumb.path && !isLast) {
          return (
            <StyledLink
              key={index}
              onClick={() => handleBreadCrumbClick(crumb, index)}
            >
              {crumb.label}
            </StyledLink>
          );
        }

        // Last crumb (current page)
        return (
          <Tooltip title={crumb.label} arrow key={index}>
            <BreadCrumbStyledTypography
              onClick={() => handleBreadCrumbClick(crumb, index)}
            >
              {crumb.label}
            </BreadCrumbStyledTypography>
          </Tooltip>
        );
      })}
    </StyledBreadcrumbs>
  );
};

export default CommonBreadcrumb;
