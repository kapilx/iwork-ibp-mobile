import { styled } from "@mui/material";

export const SectionContainer = styled("div")<{
  customStyles?: React.CSSProperties;
}>(({ theme, customStyles }) => ({
  display: "flex",
  flexDirection: "column",
  ...customStyles,
  gap: theme.spacing(5),
}));

export const CommonDetailsSectionTitle = styled("h3")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.bold,
  margin: theme.spacing(0),
  color: theme.palette.primary.main,
}));

export const ItemsWrapper = styled("div")<{
  itemStyles?: React.CSSProperties;
}>(({ theme, itemStyles }) => ({
  display: "grid",
  columnGap: theme.spacing(13),
  rowGap: theme.spacing(5),
  flexWrap: "wrap",
  gridTemplateColumns: "repeat(3, 1fr)",
  ...itemStyles,
  "@media (max-width: 1199px)": {
    gridTemplateColumns: "repeat(2, 1fr)",
    columnGap: theme.spacing(8),
  },
  "@media (max-width: 767px)": {
    gridTemplateColumns: "1fr",
    columnGap: theme.spacing(5),
  },
}));

export const ItemContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: `${theme.spacing(1)} !important`,
}));

export const ItemLabel = styled("div")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.lightGrey,
}));

export const ItemKey = styled("div")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(3),
  color: theme.palette.neutral.dark,
}));

export const MapLink = styled("a")(({ theme }) => ({
  color: theme.palette.button.secondary,
  textDecoration: "none",
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  display: "flex",
  alignItems: "center",
}));

export const LinkData = styled("span")(({ theme }) => ({
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  maxWidth: "150px",
}));

export const ImageSection = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const SectionImageIcon = styled("img")(({ theme }) => ({
  width: theme.spacing(7),
  height: theme.spacing(7),
}));
export const SectionImageContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  // marginTop: theme.spacing(5),
}));

export const SectionWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));
