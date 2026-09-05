import { Box, Divider, styled, Typography } from "@mui/material";
import { Button } from "@ui/ui-lib";

export const QuoteFormContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(4),
}));

export const BasicContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(10),
  marginBottom: theme.spacing(4),
}));

export const CreateQuoteContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: theme.spacing(0),
}));

export const QuoteDetailsContainer = styled(Box)<{ isFirst?: boolean }>(
  ({ theme, isFirst }) => ({
    marginTop: isFirst ? 0 : theme.spacing(5), // Set marginTop to 0 for the first item
    paddingBottom: theme.spacing(3),
    display: "flex",
    flexDirection: "column",
    borderBottom: `${theme.shape.borderSizes.medium} solid ${theme.palette.neutral.light}`,
  })
);

export const QuoteEntrySpan = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.neutral.lightMedium,
}));

export const AddQuoteButton = styled(Button)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: theme.spacing(1),
  width: "100px",
}));

export const QuoteTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
  lineHeight: theme.spacing(5),
  marginTop: theme.spacing(2.5),
  marginBottom: theme.spacing(2),
}));

export const CommonTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: theme.spacing(5),
  marginBottom: theme.spacing(2),
}));

export const QuoteHeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  marginBottom: theme.spacing(2),
}));

export const QuoteContentContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  gap: theme.spacing(7),
}));

export const CommonQuoteContentContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const CommonQuoteTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xss,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
}));

export const SecondaryQuoteBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  justifyContent: "space-between",
  padding: theme.spacing(3),
  marginBottom: theme.spacing(5),
}));

export const QuoteCoverDetailsBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: theme.spacing(4),
}));

export const RemarksContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  padding: theme.spacing(4),
}));

export const UploadDocumentContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  padding: theme.spacing(4),
}));

export const QuoteCoverDetailsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  gap: theme.spacing(2),
}));

export const CustomDivider = styled(Divider)(({ theme }) => ({
  height: 18,
  width: 1,
  backgroundColor: theme.palette.neutral.lightMedium,
  alignSelf: "center",
  marginLeft: theme.spacing(3),
  marginRight: theme.spacing(3),
}));

export const CoverTitle = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(5),
}));

export const PlusIconStyles = styled("img")(({ theme }) => ({
  width: "15px",
  height: "17px",
  marginBottom: theme.spacing(0.3),
}));

export const ImageStyles = styled("img")(({ theme }) => ({
  cursor: "pointer",
}));
