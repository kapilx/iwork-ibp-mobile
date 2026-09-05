import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { text } from "stream/consumers";

export const Wrapper = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(4),
  borderRadius: "4px",
  background: "linear-gradient(180deg, #81D4CC -97.68%, #D6FAE8 52.93%)",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  width: "30%",
  height: "fit-content",
  [theme.breakpoints.down("lg")]: {
    width: "35%",
  },
  [theme.breakpoints.down("md")]: {
    width: "100%",
    paddingTop: theme.spacing(3),
  },
}));

export const Title = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.bold,
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.lg,
  },
}));

export const SectionContainer = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(5.5)} ${theme.spacing(6)}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  width: "95%",
  [theme.breakpoints.down("md")]: {
    padding: `${theme.spacing(4)} ${theme.spacing(4)}`,
    width: "90%",
  },
  [theme.breakpoints.down("sm")]: {
    padding: `${theme.spacing(3)} ${theme.spacing(3)}`,
    gap: theme.spacing(1.5),
  },
}));

export const StyledHeading = styled(Typography)<{ type?: string }>(
  ({ theme, type }) => ({
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semiBold,
    marginLeft: type === "list" ? theme.spacing(2.5) : theme.spacing(0),
    [theme.breakpoints.down("sm")]: {
      fontSize: theme.typography.fontSizes.xs,
      marginLeft: type === "list" ? theme.spacing(2) : theme.spacing(0),
    },
  })
);

export const Description = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  textAlign: "justify",
  margin: "0px",
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xs,
  },
}));

export const ReadMore = styled("a")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.button.secondary,
  whiteSpace: "nowrap",
  cursor: "pointer",
  "&: hover": {
    textDecoration: "underline",
  },
}));

export const CustomDivider = styled(Box)(({ theme }) => ({
  height: "1px",
  backgroundColor: theme.palette.divider,
}));

export const ListContainer = styled(Box)(({ theme }) => ({
  paddingLeft: theme.spacing(3.5),
  marginBottom: theme.spacing(5.5),
  marginTop: theme.spacing(5.5),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  width: "90%",
  [theme.breakpoints.down("sm")]: {
    paddingLeft: theme.spacing(2.5),
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(3),
    gap: theme.spacing(1.5),
  },
}));

export const List = styled("ul")(({ theme }) => ({
  paddingLeft: theme.spacing(2.7),
  margin: theme.spacing(0),
}));

export const ListItem = styled("li")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  "::marker": {
    fontSize: theme.typography.fontSizes.xss /* reduce size relative to text */,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xs,
  },
}));

export const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1), // 8px gap
}));

export const Image = styled("img")(({ theme }) => ({
  width: "40px",
  height: "40px",
  objectFit: "cover",
  marginLeft: theme.spacing(4.5),
  [theme.breakpoints.down("sm")]: {
    width: "32px",
    height: "32px",
    marginLeft: theme.spacing(3),
  },
}));

export const Text = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const BackgroundImageLink = styled("img")(({ theme }) => ({
  width: "250px",
  height: "auto",
  float: "right",
  [theme.breakpoints.down("md")]: {
    width: "200px",
  },
  [theme.breakpoints.down("sm")]: {
    width: "150px",
  },
}));

export const RichTextContainer = styled("div")(({ theme }) => ({
  "& p": {
    margin: 0,
    padding: 0,
  },
  "& strong": {
    margin: 0,
    padding: 0,
  },
}));
