import { Box, styled } from "@mui/material";
// import { theme } from "@ui/ui-lib/styles/Theme";

export const StyledContainer = styled(Box)(({ theme }) => ({
  position: "sticky",
  bottom: 0,
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderTopLeftRadius: "20px",
  borderTopRightRadius: "20px",
  backgroundImage:
    "linear-gradient(177.58deg, #FFFFFF -22.85%, #E1E1E1 269.71%)",
  border: `1px solid #FFCA61`,
  boxShadow: "0px -8px 24px 0px #FFE1CE",
  padding: "12px 20px",
  zIndex: 100,
  "@media (max-width: 799px)": {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(3),
  },
}));

export const StyledContent = styled("div")(({ theme }) => ({
  color: "#2E2E2E",
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  "@media (max-width: 799px)": {
    width: "100%",
    wordBreak: "break-word",
  },
}));

export const StyledActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(6),
  justifyContent: "flex-end",
  "@media (max-width: 799px)": {
    width: "100%",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: theme.spacing(2),
  },
}));
export const StyledContentWithOutButton = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));
