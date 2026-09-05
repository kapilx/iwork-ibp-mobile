import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

export const ModalOverlay = styled("div")({
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.4)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const ModalContent = styled("div")({
  background: "#fff",
  borderRadius: 8,
  minWidth: 400,
  maxWidth: "90vw",
  maxHeight: "80vh",
  overflow: "auto",
  padding: 24,
  boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
});

export const ModalHeader = styled("div")({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
});

export const StyledModalHeading = styled(Typography)(
  ({ theme }) => ({
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.palette.chips.quaternary,
  })
);

export const CloseButton = styled("button")({
  fontSize: 18,
  background: "none",
  border: "none",
  cursor: "pointer",
});


export const LoadingBox = styled("div")({
  textAlign: "center",
  padding: 32,
});

export const ErrorBox = styled("div")({
  color: "red",
  textAlign: "center",
  padding: 32,
});

export const ConfigTableWrapper: any = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
  margin: "0",
  border: "none",
  borderRadius: "0",
  boxShadow: "none",
  overflow: "hidden",
}));

export const ConfigTable: any = styled("table")(({ theme }) => ({
  width: "100%",
  borderCollapse: "collapse",
  border: `1px solid ${theme.palette.grey[200]}`,
  borderRadius: theme.spacing(2),
  maxHeight: `calc(100vh - ${theme.spacing(105)})`,
  overflow: "auto",
  display: "block",
}));

export const ConfigTableHead: any = styled("thead")({
  position: "sticky",
  top: 0,
  zIndex: 10,
});


export const ConfigTableHeaderCell: any = styled("th")(
  ({ theme }) => ({
    padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
    textAlign: "left",
    fontSize: theme.spacing(2.75),
    fontWeight: 700,
    backgroundColor: theme.palette.background.default,
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    borderRight: `1px solid ${theme.palette.grey[50]}`,
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
    width: "1%",
  })
);

export const ConfigHeaderContent: any = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const ConfigHeaderTitle: any = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  maxWidth: theme.spacing(30),
  "& > :first-of-type": {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
    minWidth: 0,
  }
}));

export const EllipsisText = styled("span")(() => ({
  display: "inline-block",
  maxWidth: 180,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  verticalAlign: "bottom",
}));

export const ConfigTableDataCell: any = styled("td")(
  ({ theme }) => ({
    padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
    fontSize: theme.typography.body2.fontSize,
    color: theme.palette.grey[700],
    borderBottom: `1px solid ${theme.palette.grey[100]}`,
    whiteSpace: "nowrap",
    width: "1%",
  })
);