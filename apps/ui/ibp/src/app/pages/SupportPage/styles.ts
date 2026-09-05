import { styled, Box, Button } from "@mui/material";

export const SupportPageContainer = styled(Box)(() => ({
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden",
}));

export const SupportContentWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "90%",
  boxSizing: "border-box",
  padding: theme.spacing(5, 10, 10, 10),
  justifyContent: "space-between",
  alignItems: "flex-start", 
  gap: theme.spacing(5),
  maxWidth:"1920px",
  margin: "0 auto",
  [theme.breakpoints.down("lg")]: {
    padding: theme.spacing(4),
    gap: theme.spacing(4),
  },
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    padding: theme.spacing(3, 2),
  },
}));

export const SupportContentLeftSection = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minWidth: 0,
  width:"100%",

}));
export const SupportTicketRaiseContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(10),
  background: theme.palette.background.paper,
  padding: theme.spacing(5),
  borderRadius: theme.spacing(3),
  boxShadow: "0px 5px 10px 0px #2626261A",

}));
export const SupportSectionQuickLinksContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(5),
  // boxShadow: "0px 5px 10px 0px #2626261A"
}));

export const SupportSheduleCallbackContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(10),
}));
export const SupportRecentRequestContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(10),
}));

export const SupportTicketSearchContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(10),
  background: theme.palette.background.paper,
  padding: theme.spacing(5),
  borderRadius: theme.spacing(3),
  boxShadow: "0px 5px 10px 0px #2626261A",
}));
export const SupportRightSectionWrapper = styled(Box)(() => ({
  display: "flex",
}));

export const SupportContentRightSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden",
  top: theme.spacing(16),
  [theme.breakpoints.down("md")]: {
    top: 0,
  },
}));

export const HelpCardsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(7.5),
  marginTop: theme.spacing(3.25),
  marginBottom: theme.spacing(5),
}));

export const ContactMatrixButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(136.55deg, #2A93FB 12.99%, #4BA4FD 41.03%, #68B4FF 53.7%, #47A2FD 68.47%, #2A93FB 92.72%)",
  color: theme.palette.common.white,
  fontWeight: 500,
  fontSize: "16px",
  textTransform: "none",
  padding: theme.spacing(1.5, 3),
  borderRadius: theme.spacing(1),
  width: "100%",
  "&:hover": {
    backgroundColor: "#1F79D4",
  },
}));
