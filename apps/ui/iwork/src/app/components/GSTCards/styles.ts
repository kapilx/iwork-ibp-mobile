import { Box, styled, Typography } from "@mui/material";

export const CardWrapper = styled(Box)(({ theme }) => ({}));

export const Card = styled(Box)(({ theme }) => ({}));

export const GstTypeCircle = styled(Box)(({ theme }) => ({
  width: "56px",
  height: "56px",
  borderRadius: theme.shape.borderRadii.circle,
  backgroundColor: theme.palette.background.externalCircle,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

export const GstInnerCircle = styled(Box)(({ theme }) => ({
  width: "47px",
  height: "47px",
  borderRadius: theme.shape.borderRadii.circle,
  backgroundColor: theme.palette.background.internalCircle,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

export const GstTypeContent = styled(Box)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.bold,
  fontSize: theme.typography.fontSizes.xss,
}));

export const Field = styled(Box)(() => ({}));

export const GSTCardLabel = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.lightGrey,
  margin: 0,
  marginBottom: theme.spacing(1),
}));

export const GSTCardValue = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.primary,
  margin: 0,
}));

export const SectionContainer = styled(Box)(({ theme }) => ({
  margin: `${theme.spacing(8)} 0 ${theme.spacing(3)} ${theme.spacing(0)}`,
}));

export const CardList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  columnGap: theme.spacing(3.5),
}));

export const GstCard = styled(Box)(({ theme }) => ({
  boxShadow: theme.shadows[13],
  backgroundColor: theme.palette.neutral.veryLight,
  display: "flex",
  gap: theme.spacing(10),
  padding: `${theme.spacing(5.5)} ${theme.spacing(5)}`,
  borderRadius: theme.shape.borderRadii.medium,
  marginTop: theme.spacing(3.5),
  width: "32.5%",
  minWidth: "395px",
  "@media (max-width: 734px)": {
    flexWrap: "wrap",
    minWidth:"210px",
    flexDirection: "column",
  },
}));

export const CardContent = styled(Box)(({ theme }) => ({}));
