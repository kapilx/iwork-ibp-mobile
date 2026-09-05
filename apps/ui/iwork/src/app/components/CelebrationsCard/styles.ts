import { Avatar, Box, Typography, styled } from "@mui/material";
import CakeIcon from "@mui/icons-material/Cake";

export const CelebrationContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  overflowY: "auto",
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: theme.palette.grey[100],
    borderRadius: "3px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.grey[400],
    borderRadius: "3px",
    "&:hover": {
      backgroundColor: theme.palette.grey[500],
    },
  },
}));

export const CelebrationCard = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    transform: "translateY(-1px)",
    boxShadow: theme.shadows[2],
  },
}));

export const CelebrationImage = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export const CelebrationInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  minWidth: 0, // Allows text truncation
  flex: 1,
}));

export const NoDataContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(6),
  textAlign: "center",
  minHeight: "200px",
}));

export const CarouselContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  overflowX: "auto",
  padding: theme.spacing(1),
  "&::-webkit-scrollbar": {
    height: "6px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: theme.palette.grey[100],
    borderRadius: "3px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.grey[400],
    borderRadius: "3px",
    "&:hover": {
      backgroundColor: theme.palette.grey[500],
    },
  },
}));

export const CarouselItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  minWidth: "120px",
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[4],
    borderColor: theme.palette.primary.dark,
  },
}));

export const UpcomingSection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const SectionHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(2),
  fontSize: theme.typography.pxToRem(16),
}));

export const StyledSliderWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  ".slick-prev, .slick-next": {
    zIndex: 1,
    width: 32,
    height: 32,
    backgroundColor: "red",
    borderRadius: "50%",
    boxShadow: theme.shadows[2],
    display: "flex !important",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.3s ease",
    "&:before": {
      fontSize: 18,
      color: theme.palette.primary.main,
    },
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  ".slick-prev": {
    left: -40,
  },
  ".slick-next": {
    right: -40,
  },
  ".slick-dots": {
    bottom: -24,
    "li button:before": {
      fontSize: 24,
      color: theme.palette.grey[400],
    },
    "li.slick-active button:before": {
      color: theme.palette.primary.main,
    },
  },
}));

export const TodaysBirthdaySection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  minHeight: "160px",
}));

export const TodayCard = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  padding: theme.spacing(5),
  background: "#F5F9FF",
  border: `1px solid ${theme.palette.divider}`,
  display: "flex !important",
  alignItems: "center",
  boxShadow: theme.shadows[1],
  gap: theme.spacing(5),
}));

export const MetaText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: "0.85rem",
}));

export const TodayDate = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: theme.spacing(1),
  fontWeight: 600,
  marginBottom: theme.spacing(1),
}));

export const DateText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSize.md,
  color: theme.palette.primary.main,
}));
export const MonthText = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSize.sm,
  color: theme.palette.primary.light,
}));

export const EmployeeName = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSize.lg,
  maxWidth: "150px",
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textAlign: "center",
}));

export const TodaysCelebrationsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  fontSize: theme.typography.fontSize.lg,
}));

export const TodaysCelebrationsContainerHeading = styled(Typography)(
  ({ theme }) => ({
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    fontSize: theme.typography.fontSize.lg,
  })
);

export const TodaysCelebrationsContainerSubHeading = styled(Typography)(
  ({ theme }) => ({
    fontWeight: 400,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
    fontSize: theme.typography.fontSize.md,
  })
);

export const CardAvatar = styled(Avatar)(({ theme }) => ({
  width: 56,
  height: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  backgroundColor: theme.palette.background.yellow,
  color: theme.palette.common.white,
  fontSize: theme.typography.fontSize.lg,
}));

export const SmallCardAvatar = styled(Avatar)(({ theme }) => ({
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  backgroundColor: theme.palette.background.yellow,
  color: theme.palette.common.white,
  fontSize: theme.typography.fontSize.sm,
}));

export const UpcomingCardContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));

export const UpcomingCard = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2.5),
}));

export const UpcomingCardDetails = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const UpcomingCardDetailsName = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSize.md,
  maxWidth: "150px",
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textTransform: "capitalize",
}));

export const UpcomingCardDetailsDate = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSize.md,
}));

export const UpcomingHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
}));

export const UpcomingCardCardsContainer = styled(Box)(({ theme }) => ({
  gap: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  maxHeight: "110px",
  overflowY: "auto",
  scrollbarWidth: "none",
}));

export const NoUpcomingHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSize.md,
  textAlign: "center",
}));

export const CustomCakeIcon = styled(CakeIcon)(({ theme }) => ({
  color: "#FFBF00",
  fontSize: "medium",
}));
