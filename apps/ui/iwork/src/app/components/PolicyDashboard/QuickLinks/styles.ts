import { Box, styled, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export const Wrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: 4,
  padding: `${theme.spacing(5)} ${theme.spacing(4)}`,
  boxShadow: `0px 2px 4px 0px #00000026`,
  width: "49%",
  "@media (max-width: 1099px)": {
    width: "100%",
  },
}));

export const TitleRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
}));

export const Grid = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
}));

export const GridItem = styled("div")(({ theme }) => ({
  textDecoration: "none",
  color: "inherit",
  padding: theme.spacing(6),
  display: "flex",
  alignItems: "flex-end",
  width: "50%",
  gap: theme.spacing(1),
  cursor: "pointer",
  "&:nth-of-type(1)": {
    borderBottom: `0.5px solid ${theme.palette.neutral.light}`,
    borderRight: `0.5px solid ${theme.palette.neutral.light}`,
    paddingLeft: theme.spacing(4),
  },
  "&:nth-of-type(2)": {
    borderBottom: `0.5px solid ${theme.palette.neutral.light}`,
    borderLeft: `0.5px solid ${theme.palette.neutral.light}`,
  },
  "&:nth-of-type(4)": {
    borderTop: `0.5px solid ${theme.palette.neutral.light}`,
    borderLeft: `0.5px solid ${theme.palette.neutral.light}`,
  },
  "&:hover": {
    border: `0.5px solid ${theme.palette.button.secondary}`,
    boxShadow: `0px 4px 8px 0px ${theme.palette.button.hover}`,
    borderRadius: "4px",
    "& .MuiTypography-root": {
      color: theme.palette.button.secondary,
      fontWeight: 500,
    },
  },
}));

export const Number = styled(Box)(({ theme }) => ({
  fontSize: "36px",
  fontWeight: 400,
  background: `linear-gradient(173.25deg, #E8E8E8 5.29%, #828282 151.65%)`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  display: "inline-block",
  lineHeight: "30px",
}));

export const Label = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  fontWeight: 500,
  textAlign: "center",
  color: theme.palette.text.primary,
  transition: "color 0.2s ease",
}));

export const ContentRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  width: "100%",
}));
