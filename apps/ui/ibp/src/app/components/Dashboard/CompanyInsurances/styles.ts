import { Box, Typography, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";

export const InsuranceContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 7.75, 0, 18.75),
  width: "100%",
  maxWidth: "1366px",
  margin: "0 auto",
  position: "relative",
}));

export const InsuranceContent = styled(Box)(({ theme }) => ({
  position: "relative",
  marginTop: theme.spacing(8),
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}));

export const CarouselSection = styled(Box)(() => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  position: "relative",
  zIndex: 1,
  paddingLeft: "0px",
}));

export const CarouselWrapper = styled(Box)(() => ({
  overflow: "hidden",
  height: "fit-content",
  paddingTop: "26px",
  width: "1035px",
  margin: "0",
  zIndex: 1,
}));

export const InsuranceCards = styled(Box)(() => ({
  display: "flex",
  gap: "30px",
  width: "fit-content",
}));

export const DogOverlayImage = styled("img")<{ hasCarousel?: boolean }>(
  ({ hasCarousel }) => ({
    position: "absolute",
    bottom: hasCarousel ? 30 : 0,
    right: 0,
    zIndex: 0,
    mixBlendMode: "multiply",
    pointerEvents: "none",
    maxWidth: "300px",
    opacity: 0.9,
  })
);

export const InsuranceTitle = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.xl,
  lineHeight: "100%",
  letterSpacing: "0px",
  color: theme.palette.text.LightDark,
}));

export const ArrowContainer = styled(Box)(() => ({
  display: "flex",
  gap: "18px",
  alignItems: "center",
}));

export const ArrowButton = styled(IconButton)(({ theme }) => ({
  padding: "0px",
  "&:disabled": {
    opacity: 0.4,
  },
}));

export const Container = styled(Box)(() => ({
  display: "flex",
  maxWidth: "1035px",
  justifyContent: "space-between",
  alignItems: "center",
}));

export const Chevron = styled("img")(() => ({
  width: "24px",
  height: "24px",
}));

export const PaginationDots = styled(Box)(() => ({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: "12px",
  marginTop: "24px",
  paddingLeft: "calc((1035px - (32px * 3 + 24px)) / 2)", // Center dots relative to the cards
}));

export const Dot = styled("div")<{ active?: boolean }>(({ active }) => ({
  width: "32px",
  height: "5px",
  borderRadius: "10px",
  backgroundColor: active ? "#FF7A00" : "#C4C4C4",
  cursor: "pointer",
  transition: "background-color 0.3s ease",
}));

export const CardContainer = styled(Box)(({ theme }) => ({
  flex: "0 0 325px",
  display: "flex",
  justifyContent: "center",
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(4),
  cursor: "pointer",
}));
