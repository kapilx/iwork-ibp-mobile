import { styled, Box, Typography, Button } from "@mui/material";

interface RequestFieldsGridProps {
  columns?: number;
}

export const RequestContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const DateContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(6.5, 0, 5, 1),
}));

export const RequestDate = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  lineHeight: "100%",
  color: theme.palette.text.primary,
}));

export const DateLine = styled(Box)(({ theme }) => ({
  flex: 1,
  height: "1px",
  backgroundColor: theme.palette.divider,
}));

export const RequestCard = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4.75),
  padding: theme.spacing(7.5, 8.25, 7.5, 7.5),
  boxShadow: "0px 10px 24px 0px #0000001A",
  borderLeft: "4px solid #3EA0F1",
  backgroundColor: theme.palette.background.paper,
}));

export const RequestFieldsGrid = styled(Box)<RequestFieldsGridProps>(
  ({ theme, columns = 2 }) => ({
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: theme.spacing(3),
    columnGap: theme.spacing(3),
    rowGap: theme.spacing(4.75),
  }),
);

export const FieldContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const FieldLabel = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  lineHeight: "100%",
  letterSpacing: "0px",
  color: theme.palette.text.tertiary,
  marginBottom: theme.spacing(1),
}));

export const FieldValue = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.lg,
  lineHeight: "100%",
  letterSpacing: "0px",
  color: theme.palette.text.primary,
}));

export const DescriptionContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const DescriptionLabel = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xs,
  lineHeight: "100%",
  color: theme.palette.text.secondary,
}));

export const DescriptionText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.lg,
  lineHeight: "24px",
  letterSpacing: "0px",
  color: theme.palette.text.primary,
}));

export const ResubmitButton = styled(Button)(({ theme }) => ({
  color: theme.palette.common.white,
  background:
    "linear-gradient(136.55deg, #2A93FB 12.99%, #4BA4FD 41.03%, #68B4FF 53.7%, #47A2FD 68.47%, #2A93FB 92.72%)",
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  textTransform: "none",
  padding: theme.spacing(2.5, 10),
  borderRadius: theme.spacing(1),
  cursor: "pointer",
  alignSelf: "flex-start",
  marginTop: theme.spacing(1),
}));
