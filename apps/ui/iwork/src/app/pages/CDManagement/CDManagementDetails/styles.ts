import { Box, styled } from "@mui/material";
import { CardBackground } from "@ui/ui-lib";

export const Maincontainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(5),
}));

export const OverviewCardBackground = styled(CardBackground)(({ theme }) => ({
  width: "unset",
  margin: theme.spacing(4),
  padding: theme.spacing(5, 4),
  boxShadow: theme.shadows[12],
}));
export const TableContailer = styled(Box)(({ theme }) => ({
  ".debit-amount-cell": {
    color: theme.palette.text.success,
  },
}));
export const ButtonContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  width: "100%",
  display: "flex",
  justifyContent: "flex-end",
  paddingRight: theme.spacing(5),
}));
