import { Box, styled } from "@mui/material";
import { colors } from "@ui/ui-lib/styles/Theme/colors";

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginRight: theme.spacing(4),
}));

export const EnployeeBatchStyledCard = styled(Box)(({ theme }) => ({
  width: "70vw",
}));

export const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  // height: "90vh",
  gap: theme.spacing(5),
  ".success-count-cell": {
    textAlign: "right",
    color: colors.text.success,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semiBold,
  },
  ".failed-count-cell": {
    textAlign: "right",
    color: colors.text.failed,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semiBold,
  },
  ".success-count-header": {
    textAlign: "right",
  },
}));
