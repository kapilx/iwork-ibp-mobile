import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ReactNode } from "react";

type DashboardAccordionProps = {
  header: ReactNode;
  content: ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onChange?: (event: any, expanded: boolean) => void;
};

const DashboardAccordion = ({
  header,
  content,
  defaultExpanded = true,
  expanded,
  onChange,
}: DashboardAccordionProps) => {
  return (
    <Accordion
      sx={{ borderRadius: 0 }}
      defaultExpanded={defaultExpanded}
      expanded={expanded}
      onChange={onChange}
      disableGutters
      TransitionProps={{ unmountOnExit: false }}
      slotProps={{ transition: { timeout: 0 } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box width="100%">{header}</Box>
      </AccordionSummary>

      <AccordionDetails>{content}</AccordionDetails>
    </Accordion>
  );
};

export default DashboardAccordion;
