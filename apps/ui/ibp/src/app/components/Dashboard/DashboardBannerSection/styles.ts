import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const BannerContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: "1366px",
  margin: "0 auto",
  alignItems: "center",
}));
// Banner main wrapper
export const BannerWrapper = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.border.secondary}`,
  margin: theme.spacing(8.5, 18, 15, 18),
  position: "relative",
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadii.large,
  display: "flex",
  gap: theme.spacing(8.75),
  padding: theme.spacing(7.5, 0),
  boxShadow: `0px 16px 24px 0px ${theme.palette.border.lightOrange}`,

}));

export const BannerBackgroundImage = styled("img")(({ theme }) => ({
  position: "absolute",
  bottom: 0,
  width: "100%",
  borderBottomLeftRadius: theme.shape.borderRadii.large,
  borderBottomRightRadius: theme.shape.borderRadii.large,
}));

export const BannerSectionContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  maxWidth: "514px",
  fontFamily: theme.typography.fontFamily,
  paddingLeft: theme.spacing(20.25),
  paddingBottom: theme.spacing(7.5),
  zIndex: 2,
  gap: theme.spacing(3),
}));

export const BannerSectionTitle = styled(Typography)<{ color?: string }>(
  ({ theme, color }) => ({
    fontWeight: theme.typography.fontWeights.semiBold,
    fontSize: theme.typography.fontSizes.xl,
    color: color ?? theme.palette.text.primary,
  })
);

export const BannerSectionDescription = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  lineHeight: "26px",
  color: theme.palette.text.fadeGrey,
}));

export const BannerSectionCards = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(5),
  alignItems: "center",
  justifyContent: "space-between",
  zIndex: 2,
  maxWidth: "54%",
  "@media (max-width: 1260px)": {
    flexWrap: "wrap",
  },
}));

export const BannerSectionCard = styled(Box)<{ background: string; index?: number }>(
  ({ theme, background, index }) => ({
    padding: index === 1 ? theme.spacing(8, 4.25) : theme.spacing(8, 5),
    minWidth: "193px",
    maxWidth: "193px",
    minHeight: "250px",
    background: background ?? theme.palette.background.paper,
    borderRadius: theme.shape.borderRadii.medium,
    position: "relative",
  })
);

export const BannerCardFlower = styled("img")(({ theme }) => ({
  position: "absolute",
  bottom: -10,
  right: -20,
}));

export const BannerFlowerImage = styled("img")(({ theme }) => ({
  position: "absolute",
  left: 0,
}));

export const BannerBirdImage = styled("img")(({ theme }) => ({
  position: "absolute",
  left: 50,
  top: -41,
  zIndex: 2,
}));

export const BannerCoudImageLeft = styled("img")(({ theme }) => ({
  position: "absolute",
  left: 30,
  top: -30,
}));

export const BannerCoudImageRight = styled("img")(({ theme }) => ({
  position: "absolute",
  right: "27%",
  top: -30,
}));

export const BannerCoudImageRightSide = styled("img")(({ theme }) => ({
  position: "absolute",
  right: -47,
  top: 38,
}));

export const BannerSectionCardContent = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  lineHeight: "26px",
  position: "relative",
  zIndex: 3,
  color: theme.palette.text.LightDark,
  marginTop: theme.spacing(2),
}));
