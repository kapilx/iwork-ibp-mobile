import { Button } from "@ui/ui-lib";
import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const StyledFormBox = styled("div")(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(5),
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  boxShadow: theme.shadows[12],
  border: "0.5px solid #DFDFDF",
  borderRadius: theme.spacing(3),
  marginTop: theme.spacing(4),
}));

export const PolicyDetailsCoverTabSectionTitle = styled("h3")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.bold,
  margin: theme.spacing(0),
  // color: theme.palette.chips.senary,
  //theme.palette.background.deepOrange,
}));

export const ButtonStyles = styled("div")(({ theme }) => ({
  display: "flex",
  width: "100%",
  justifyContent: "flex-end",
  marginTop: theme.spacing(5),
  gap: theme.spacing(2.5),
}));
export const HeaderSection = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  gap: 12,
}));
export const EditButtonButtonStyles = styled(Button)(({ theme }) => ({
  border: "unset",
  padding: 0,
  minWidth: "unset",
  gap: theme.spacing(1),
  ":hover": {
    backgroundColor: "unset",
  },
}));

export const HeaderContainer = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(4),
  background: theme.palette.background.tableHeader,
  padding: theme.spacing(2.5),
  borderTopLeftRadius: 10,
  borderTopRightRadius: 10,
}));

export const LabelText = styled("p")(({ theme }) => ({
  width: "40%",
  margin: 0,
}));

export const ValueText = styled("p")(({ theme }) => ({
  width: "60%",
  margin: 0,
  paddingLeft: theme.spacing(3),
}));
export const FormContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const CoverSectionTitle = styled("h4")(() => ({
  fontSize: "16px",
  fontWeight: 600,
  margin: "0 0 12px 0",
  padding: '12px',
}));

export const CoverSectionBlock = styled("div")<{
  isUnmapped?: boolean;
}>(({ theme, isUnmapped }) => ({
  marginBottom: theme.spacing(2),
  padding: isUnmapped ? 0 : theme.spacing(1.5),
  borderRadius: 10,
  border: isUnmapped ? "none" : "1px solid #E3E8F1",
  background: isUnmapped ? "transparent" : "#FFFFFF",
  "& [data-testid^='form-field-']:last-of-type .MuiBox-root": {
    borderBottom: "none !important",
  },
}));
