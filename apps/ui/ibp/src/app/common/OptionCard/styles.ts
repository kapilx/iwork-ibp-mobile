import { styled, Box, Typography } from "@mui/material";

export const OptionCardContainer = styled(Box)<{ backgroundColor?: string }>(({ theme, backgroundColor }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: backgroundColor || theme.palette.background.paper,
  gap: theme.spacing(1),
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
  boxShadow: "0px 8.29px 19.89px 0px #0000001A",
  flex: 1,
  minWidth: "200px",
  maxWidth: "250px",
  width: "100%",
  minHeight: "100px",
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  borderRadius: theme.spacing(3),
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0px 12px 24px 0px #0000002A",
  },
  "@media (max-width: 420px)": {
    minWidth: "unset",
    maxWidth: "100%",
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(4),
    flexDirection: "row",
    gap: theme.spacing(2),
    justifyContent: "flex-start",
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
  },
}));

export const OptionCardIcon = styled("img")(({ theme }) => ({
  objectFit: "contain",
}));

export const OptionCardTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 400,
  fontSize: "15px",
  lineHeight: "100%",
  color: theme.palette.text.tertiary,
  letterSpacing: "0px",
  textAlign: "center",
}));

export const OptionCardSubtext = styled(Typography)(({ theme }) => ({
  fontFamily: "Figtree",
  fontWeight: 400,
  fontSize: "12px",
  lineHeight: "100%",
  color: theme.palette.text.tertiary,
  textAlign: "center",
  opacity: 0.6,
  maxWidth: "90%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));
