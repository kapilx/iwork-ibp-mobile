import { styled } from "@mui/material/styles";
import { Box, Divider, Typography } from "@mui/material";
import { Button } from "@ui/ui-lib";

export const PageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "100%",
  height: "100%",
  padding: theme.spacing(8),
  boxSizing: "border-box",
  flexDirection: "column",
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(4),
  },
}));

export const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(4),
}));

export const Title = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export const SubTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  color: theme.palette.text.grey,
}));

export const RowContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  height: "100%",
  flexDirection: "row",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    gap: theme.spacing(4),
  },
}));

export const LeftContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  [theme.breakpoints.down("md")]: {
    flex: "0 0 40%",
  },
}));

export const RightContainer = styled(Box)(({ theme }) => ({
  flex: "0 0 50%",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  maxWidth: "400px",
  [theme.breakpoints.down("md")]: {
    flex: "0 0 40%",
  },
}));
export const CompanyText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.neutral.dark,
  lineHeight: "100%",
  letterSpacing: "0%",
}));
export const VerticalDivider = styled(Divider)(({ theme }) => ({
  marginLeft: theme.spacing(4),
  marginRight: theme.spacing(4),
  height: "100%",
  [theme.breakpoints.down("md")]: {
    width:"500px",
    height: "1px",
  },
}));

export const ResultContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadii.medium,
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.divider}`,
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(9),
  paddingTop: theme.spacing(3),
  marginTop: theme.spacing(2),
  height: "100%",
  overflowY: "auto",
}));

export const SummaryLineText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.neutral.dark,
  marginBottom: theme.spacing(2),
}));
export const SummaryLine = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.neutral.dark,
}));

export const CreateRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "top",
  marginTop: theme.spacing(5),
  gap: theme.spacing(5),
}));

export const CreatePrompt = styled(Typography)<{ disabled?: boolean }>(
  ({ theme, disabled }) => ({
    color: disabled ? theme.palette.text.lightGrey : "inherit",
    maxWidth: "60%",
  })
);

export const ActionButton = styled(Button)(({ theme }) => ({
  marginLeft: theme.spacing(2),
  minWidth: "fit-content",
  paddingLeft: theme.spacing(5),
  paddingRight: theme.spacing(5),
}));

export const DividerContainer = styled(Box)(({ theme }) => ({
  margin: `${theme.spacing(4)} 0`,
}));

export const StyledPrevButton = styled(Button)(({ theme }) => ({
  minWidth: "fit-content",
  paddingLeft: theme.spacing(5),
  paddingRight: theme.spacing(5),
}));
export const DefaultIMageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
  width: "100%",
}));

export const FileUploadContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    flexDirection: "row",
    gap: theme.spacing(5),
  },
}));

export const SummaryContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
  paddingBottom: theme.spacing(2.5),
  borderBottom: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.divider}`,
}));

export const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
  minHeight: 150,
  width: "100%",
}));
