import { Box, styled } from "@mui/material";

export const LeftContainer = styled(Box)(({ theme }) => ({
  width: "70%",
  [theme.breakpoints.down("lg")]: {
    width: "65%",
  },
  [theme.breakpoints.down("md")]: {
    width: "100%",
  },
}));

export const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flex: 1,
  gap: theme.spacing(5),
  paddingTop: theme.spacing(5),
  [theme.breakpoints.down("lg")]: {
    gap: theme.spacing(4),
  },
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    gap: theme.spacing(3),
  },
}));
