import { Box, Grid, styled } from "@mui/material";

export const CardsGridContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  // marginTop: theme.spacing(4),
  flexDirection: "column",
  alignItems: "center",
}));

export const GridItem = styled(Grid)(({ theme }) => ({
  width: "100%",
  display: "flex",
  columnGap: theme.spacing(5),
  rowGap: theme.spacing(5),
}));

export const TitleContainer = styled(Box)(
  ({ theme }) => `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: ${theme.spacing(5)};
      width: 100%;`
);

export const NoCardsContactCard = styled(Box)(({ theme }) => ({
  boxShadow: theme.shadows[11],
  height: "272px",
  width: "192px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  marginTop: theme.spacing(4),
  position: "relative",
  marginRight: "auto",
}));

export const AddContactText = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.neutral.dark,
}));

export const TopCardBg = styled("img")(({ theme }) => ({
  position: "absolute",
  top: "0",
  right: "0",
}));
export const BottomCardBg = styled("img")(({ theme }) => ({
  position: "absolute",
  bottom: "0",
  left: "0",
  rotate: "180deg",
}));

export const CardsGridNoDataText = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.neutral.dark,
  alignContent: "center",
}));

export const NoDataBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: "center",
  color: theme.palette.text.primary,
  width: "100%",
  height: "calc(100vh - 418px)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  "& img": {
    maxWidth: "565px",
  },
}));
