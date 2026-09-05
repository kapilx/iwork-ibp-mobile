import { Box, styled, Typography } from "@mui/material";

export const CardBackground = styled("div")<{
  customStyles?: React.CSSProperties;
}>(({ theme, customStyles }) => ({
  width: "100%",
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadii.medium,
  padding: theme.spacing(4.25, 4),
  boxShadow: theme.shadows[12],
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.tableBorder}`,
  marginTop: theme.spacing(5),
  marginBottom: theme.spacing(5),
  ...customStyles,
}));

export const Container = styled("div")(({ theme }) => ({
  padding: theme.spacing(5),
  margin: theme.spacing(5),
  borderRadius: theme.shape.borderRadii.medium,
  marginLeft: theme.spacing(0),
  border: "1px solid rgb(234, 234, 234)",
  boxShadow: "rgba(0, 0, 0, 0.2) 0px 0px 4px 0px",
  gap: "60px",
}));

export const MainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(5),
  marginTop: theme.spacing(0),
  marginRight: theme.spacing(5),
}));
export const Title = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(10),
}));

export const TableMainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: theme.spacing(7.5, 5),
  gap: theme.spacing(2.5),
  ".clickable-cell": {
    cursor: "pointer",
    color: `${theme.palette.secondary.selected} !important`,
    textDecoration: "underline",
  },
}));

export const CDListingContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(7.5, 5),
  ".clickable-cell": {
    cursor: "pointer",
    color: `${theme.palette.secondary.selected} !important`,
    textDecoration: "underline",
  },
  ".ag-row-disabled": {
    opacity: 0.5,
    backgroundColor: "#f5f5f5 !important",
    cursor: "not-allowed !important",
    pointerEvents: "none",
  },
  ".ag-row-disabled .ag-selection-checkbox": {
    opacity: 0.4,
    pointerEvents: "none !important",
  },
}));

export const ModalContentContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.5, 0),
}));

export const ModalText = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  fontSize: "14px",
  lineHeight: 1.5,
}));

export const ModalInfoSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const ModalLabel = styled("strong")(({ theme }) => ({
  fontSize: "14px",
  fontWeight: 600,
}));

export const ModalValue = styled(Typography)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  fontSize: "14px",
}));

export const CellCenterWrapper = styled(Box)(() => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
}));

export const CellCheckbox = styled("input")(() => ({
  width: "18px",
  height: "18px",
  cursor: "pointer",
  "&:disabled": {
    cursor: "not-allowed",
  },
}));

export const CellRadio = styled("input")(() => ({
  width: "18px",
  height: "18px",
  cursor: "pointer",
  "&:disabled": {
    cursor: "not-allowed",
  },
}));

export const CellLink = styled("span")(() => ({
  color: "#1976d2",
  cursor: "pointer",
  textDecoration: "underline",
  "&:hover": {
    color: "#1565c0",
  },
}));
