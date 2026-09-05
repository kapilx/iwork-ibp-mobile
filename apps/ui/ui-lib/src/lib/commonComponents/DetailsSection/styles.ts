import { styled } from "@mui/material/styles";
import { Box, Button } from "@mui/material";

export const ContainerHeader = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

export const DetailRow = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: theme.spacing(2.5, 0),
  wordWrap: "break-word",
  gap: theme.spacing(5),
  "&:last-child": {
    borderBottom: "none",
  },
}));

// Label for Data
export const DetailsSectionLabel = styled("span")(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.sm,
  whiteSpace: "nowrap",
}));

// Value of Data
export const DetailsSectionValue = styled("span")(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.sm,
  wordBreak: "break-word",
}));

export const CardContainer = styled(Box)<{
  backgroundColor: string;
  textColor: string;
}>(({ theme, backgroundColor, textColor }) => ({
  padding: theme.spacing(6),
  marginBottom: theme.spacing(6),
  borderRadius: theme.shape.borderRadii.normal,
  backgroundColor: backgroundColor || theme.palette.background.paper,
  color: textColor || theme.palette.text.primary,
  boxShadow: theme.shadows[6],
  fontSize: theme.typography.fontSizes.sm,
}));

export const DetailsSectionStyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.text.secondary,
  borderRadius: theme.shape.borderRadii.small,

  "&:hover": {
    backgroundColor: theme.palette.primary.main,
  },
}));

export const LinkStyle = styled("a")(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: "underline",
  cursor: "pointer",
}));
