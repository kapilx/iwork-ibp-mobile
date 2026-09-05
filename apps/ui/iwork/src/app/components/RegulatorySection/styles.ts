import { styled } from "@mui/material";

export const SectionContainer = styled("div")(({ theme }) => ({
  // margin: theme.spacing(3),
}));

export const SectionCardsContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(5),
  marginTop: theme.spacing(5),
}));

export const SectionCard = styled("div")(({ theme }) => ({
  boxShadow: theme.shadows[13],
  backgroundColor: theme.palette.neutral.veryLight,
  borderRadius: theme.shape.borderRadii.medium,
  width: "18.6%",
  padding: `${theme.spacing(4)} ${theme.spacing(6)}`,
  textAlign: "center",
  minWidth: "232px",
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  justifyContent: "center",
  "@media (max-width: 1099px)": {
    flex: "1 1 calc(33.33% - 32px)",
    minWidth: "200px",
    maxWidth: "100%",
  },
}));

export const Image = styled("img")(({ theme }) => ({
  width: "42px",
  height: "42px",
  marginBottom: theme.spacing(4),
}));

export const Heading = styled("h5")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.lightGrey,
  margin: 0,
  marginBottom: theme.spacing(1),
}));

export const Subheading = styled("h3")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.primary,
  margin: 0,
}));
