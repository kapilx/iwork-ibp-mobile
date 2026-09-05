import { Box, styled } from "@mui/material";

export const StyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(0, 18.75, 10),
  width:"100%",
  maxWidth: "1366px",
  margin :"0 auto",
  marginTop: theme.spacing(10),
}));

export const StyledHeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(5.5),
}));

export const StyledHeading = styled("div")(({ theme }) => ({
 fontSize: theme.typography.fontSizes.xl,
  fontWeight: 600,
  color: theme.palette.text.LightDark,
}));

export const StyledViewMoreBtn = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.primary.main,
  background: "none",
  border: `1px solid ${theme.palette.border.grey}`,
  borderRadius: theme.spacing(40),
  cursor: "default",
  padding: theme.spacing(1.5, 4.2),
  margin: 0,
  "&:hover": {
    textDecoration: "underline",
  },
}));

export const StyledInsuranceContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));

export const StyledInsuranceCard = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(5, 0, 5, 7.5),
  border: `1px solid ${theme.palette.border.main}`,
  borderRadius: theme.spacing(4),
  background: theme.palette.background.paper
}));

export const StyledInsuranceType = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  minWidth: "200px",
  //   gap: theme.spacing(0.5),
}));

export const StyledTypeText = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.ternary,
  maxWidth: "200px",
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
}));

export const StyledInsuranceNo = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.LightDark,
  maxWidth: "200px",
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
}));
export const StyledInsuranceData = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: theme.spacing(0.5),
}));

export const InsuranceLabel = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.LightDark,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const InsuranceSubHeading = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.fadeGrey,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const StyledImgcontainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
}));

export const StyledContent = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  columnGap: theme.spacing(10),
  alignItems: "center",
}));
