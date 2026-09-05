import { styled } from "@mui/material/styles";
import { Box, Button, IconButton, TableCell, Typography } from "@mui/material";

export const TableWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  marginTop: theme.spacing(2),
  overflowX: "auto",
  borderRadius: "10px 10px 0 0",
}));

export const HeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 400,
  fontSize: theme.typography.pxToRem(13),
  backgroundColor: theme.palette.background.tableHeader,
  color: theme.palette.text.primary,
}));

export const BodyCell = styled(TableCell)<{ fromDateField?: boolean }>(
  ({ theme, fromDateField = false }) => ({
    fontSize: theme.typography.pxToRem(13),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    verticalAlign: "middle",
    minWidth: fromDateField ? "200px" : undefined,
    maxWidth: fromDateField ? "300px" : undefined,
  })
);

export const UploadCellContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
}));

export const UploadButton = styled(Button)(({ theme }) => ({
  minWidth: 140,
  textTransform: "none",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
}));

export const UploadedFileName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.pxToRem(13),
  fontWeight: 500,
  color: theme.palette.text.primary,
  wordBreak: "break-word",
}));

export const FilePlaceholder = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.pxToRem(13),
  color: theme.palette.text.disabled,
}));

export const ActionsCell = styled(TableCell)(() => ({
  textAlign: "center",
  minWidth: 140,
}));

export const ActionButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  marginLeft: theme.spacing(0.5),
  marginRight: theme.spacing(0.5),
}));

export const AddRowContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-start",
  paddingTop: theme.spacing(1.5),
}));

export const StyledIconContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));
