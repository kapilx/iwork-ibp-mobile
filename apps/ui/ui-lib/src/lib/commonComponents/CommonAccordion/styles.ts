import styled from "styled-components";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
} from "@mui/material";
import { theme } from "@ui/ui-lib/styles/Theme";
import { styled as muiStyled } from "@mui/system";

export const StyledAccordion = styled(Accordion)`
  // borderTop: ${theme.shape.borderSizes.thin} solid ${theme.palette.neutral
    .divider};
  // borderLeft: ${theme.shape.borderSizes.thin} solid ${theme.palette.neutral
    .divider};
  // borderRight: ${theme.shape.borderSizes.thin} solid ${theme.palette.neutral
    .divider};
  border-radius: ${theme.shape.borderRadius};
  border-bottom: ${theme.shape.borderSizes.thin} solid
    ${theme.palette.neutral.divider};
  // margin-bottom: ${theme.spacing(2)};
  box-shadow: ${theme.shadows[1]};
  padding: ${theme.spacing(0)};
  background-color: ${theme.palette.background.paper};
  width: 100%;
  &.Mui-expanded {
    margin: ${theme.spacing(4)} 0;
  }
`;

export const StyledAccordionSummary = styled(AccordionSummary)`
  // background-color: ${theme.palette.background.default};
  font-weight: ${theme.typography.fontWeights.medium};
  font-size: ${theme.typography.fontSizes.lg};
  & .MuiAccordionSummary-content {
    margin: ${theme.spacing(0)};
  }
  &:hover {
    background-color: transparent;
  }
  &.Mui-expanded {
    min-height: 45px;
    padding: ${theme.spacing(0, 4)};

    &:hover {
      background-color: transparent;
    }
  }
`;

export const StyledAccordionDetails = muiStyled(AccordionDetails)(
  ({ theme }) => ({
    padding: theme.spacing(4),
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
  })
);

export const SummaryBox = styled(Box)`
  flex: 1;
`;

export const ActionBox = styled(Box)`
  display: flex;
  gap: ${theme.spacing(2)};
  align-items: center;
`;

export const DetailsActionBox = styled(Box)`
  display: flex;
  justify-content: flex-end;
  margin-top: ${theme.spacing(2)};
  gap: ${theme.spacing(2)};
  align-items: center;
`;
export const CustomDivider = styled(Box)`
  width: 1px;
  height: 20px;
  background-color: ${theme.palette.neutral.divider};
`;
