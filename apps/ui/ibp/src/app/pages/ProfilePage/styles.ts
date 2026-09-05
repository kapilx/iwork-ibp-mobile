import { Box, styled } from "@mui/material";

export const PageWrapper = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  width: "100%",
  marginTop: "69px",
  alignSelf: "flex-start",  // prevent InfoContainer justify-content:center adding top gap
  [theme.breakpoints.between("sm", "md")]: {
    marginTop: "62px",
  },
  [theme.breakpoints.down("sm")]: {
    marginTop: "60px",
  },
}));

export const BlueStrip = styled(Box)(({ theme }) => ({
  height: "160px",
  background: theme.palette.background.DarkBlue,
  [theme.breakpoints.down("md")]: {
    height: "120px",
    marginTop:"-10px",
  },
  [theme.breakpoints.down("sm")]: {
    height: "100px",
    marginTop:"-10px",
  },
}));

export const ContentWrapper = styled(Box)(({ theme }) => ({
  maxWidth: "1920px",
  margin: "0 auto",
  padding: "0 24px",
  position: "relative",
  top: "-100px",
  display: "flex",
  flexDirection: "column",
  width: "95%",
  [theme.breakpoints.down("md")]: {
    padding: "0 20px",
    top: "-80px",
    },
  [theme.breakpoints.down("sm")]: {
    padding: "0 16px",
    top: "-60px",
  },
}));
