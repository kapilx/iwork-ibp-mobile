import { Box, IconButton, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";

export const BalanceContainer = styled(Box)(({ theme }) => ({
  alignItems: "center",
  display: "flex",
  justifyContent: "space-between",
  gap: theme.spacing(0.125),
  width: "100%",
  "&:hover .balance-edit-button": {
    opacity: 1,
    visibility: "visible",
  },
  "& .balance-edit-button:focus-visible": {
    opacity: 1,
    visibility: "visible",
  },
}));

export const BalanceEditButton = styled(IconButton)(({ theme }) => ({
  opacity: 0,
  visibility: "hidden",
  transition: "opacity 0.2s ease",
  color: "#000", // 👈 black color
}));

export const BalanceValue = styled(Box)(({ theme }) => ({
  fontVariantNumeric: "tabular-nums",
}));

export const FormContainer = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  alignItems: "center",
  width: "100%",
  "@media (max-width: 767px)": {
    flexDirection: "column",
    alignItems: "flex-start",
  },
}));

export const Container = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  // gap: theme.spacing(5),
  background: theme.palette.background.paper,
  border: "0.5px solid #DFDFDF",
  boxShadow: "0px 4px 14px 0px #EFE6E399",
  padding: theme.spacing(5),
  borderRadius: theme.spacing(3),
}));

export const StyledTypography = styled("p")(({ theme }) => ({
  margin: 0,
  padding: 0,
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
}));

export const ButtonsContainer = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  marginTop: theme.spacing(4),
}));

export const ContainerCDDetailsHeader = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(2),
  gap: theme.spacing(2),
  "@media (max-width: 1099px)": {
    flexDirection: "column",
    alignItems: "flex-start",
  },
}));
export const FormFieldContainer = styled(Box)(({ theme }) => ({
  width: "80%",
}));

export const AccountEditContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const TableWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  background: theme.palette.background.paper,
  boxShadow: "0px 0px 15px 0px #00000026",
  borderRadius: theme.spacing(2),
  padding: theme.spacing(5),
}));

export const RecentlyUpdatedContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  border: "1px solid #FF4400",
  padding: theme.spacing(0.5, 2),
  borderRadius: theme.spacing(20),
}));

export const CDAccountNumberContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  "@media (max-width: 767px)": {
    flexWrap: "wrap",
  },
}));
