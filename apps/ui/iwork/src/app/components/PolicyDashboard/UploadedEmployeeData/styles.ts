import { Box, styled } from "@mui/material";

interface ErrorBlockProps {
  hasError: boolean;
}
export const ErrorBlock = styled(Box)<ErrorBlockProps>(
  ({ hasError, theme }) => ({
    backgroundColor: "transparent",
    padding: theme.spacing(1, 2),
    height: "100%",
    width: "100%",
    display: "flex",
    alignItems: "center",
    fontWeight: hasError ? `${theme.typography.fontWeights.medium}` : "normal",
  })
);
export const BottomContainer = styled(Box)<ErrorBlockProps>(({ theme }) => ({
  marginTop: theme.spacing(6),
  paddingTop: theme.spacing(3),
  borderTop: `1px solid ${theme.palette.neutral.light}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
}));
