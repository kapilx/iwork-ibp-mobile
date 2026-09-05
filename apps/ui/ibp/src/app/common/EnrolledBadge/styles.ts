import { styled } from "@mui/material/styles";
import { ENROLLED } from "../../constants";
import { Chip } from "@mui/material";

interface EnrolledBadgeChipProps {
  label?: string;
}

export const EnrolledBadgeChip = styled(Chip)<EnrolledBadgeChipProps>(({ theme, label }) => ({
    height: "16px",
    "& .MuiChip-label": {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.small,
      padding: theme.spacing(0, 2),
    },
    backgroundColor:
      label === ENROLLED ? theme.palette.text.green : "transparent",
    border:
      label === ENROLLED ? "none" : `1px solid ${theme.palette.text.fadeGrey}`,
    borderRadius: theme.spacing(5),
    color:
      label === ENROLLED
        ? theme.palette.text.secondary
        : theme.palette.text.fadeGrey,
  })
);
