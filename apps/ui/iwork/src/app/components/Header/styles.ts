import { Avatar, Badge, Box, colors, Divider, styled } from "@mui/material";
import navActiveIcon from "../../assets/svgs/triangle-icon.svg";
export const HeaderContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.lightGrey,
  padding: theme.spacing(1, 2),
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  position: "fixed",
  width: "100%",
  zIndex: 1,
}));

export const LogoImage = styled("img")(({ theme }) => ({
  width: 80,
  height: 40,
  objectFit: "contain",
  cursor: "pointer",
}));

export const FlexBox = styled("div")`
  display: flex;
  align-items: center;
`;

export const RightContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
}));

export const NameText = styled("div")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.md,
  whiteSpace: "nowrap",
}));

export const DividerLine = styled(Divider)(({ theme }) => ({
  height: 18,
  width: 0.5,
  backgroundColor: theme.palette.text.primary,
  alignSelf: "center",
}));

export const HeaderIconContainer = styled("div")(() => ({
  width: 24,
  height: 24,
  cursor: "pointer",
  verticalAlign: "middle",
}));

export const QuickLinksText = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
}));

export const KnowledgeCentralText = styled("span", {
  shouldForwardProp: (prop) => prop !== "isActive" && prop !== "isOpen",
})<{ isActive?: boolean; isOpen?: boolean }>(({ theme, isActive, isOpen }) => ({
  fontSize: theme.typography.fontSizes.md,
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  borderRadius: theme.shape.borderRadius,
  cursor: "pointer",
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  color: isActive || isOpen ? theme.palette.primary.main : "inherit",
  backgroundColor: isOpen ? colors.grey[100] : "transparent",
  maxHeight: "29px",
  "&:hover": {
    color: theme.palette.primary.main,
    backgroundColor: colors.grey[100],
  },

  "&::before": isActive
    ? {
        content: '""',
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "-14px",
        width: "30px",
        height: "16px",
        backgroundImage: `url("${navActiveIcon}")`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        right: "0",
      }
    : {},
}));

export const AvatarContainer = styled(Avatar)(({ theme }) => ({
  width: 28,
  height: 28,
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.text.primary}`,
  backdropFilter: "blur(21px)",
  fontSize: theme.typography.fontSizes.xs,
  cursor: "pointer",
}));

export const StyledIcon = styled("img")(({ theme }) => ({
  width: 14,
  height: 19,
  objectFit: "contain",
}));

export const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: theme.palette.chips.senary,
    width: 14.4,
    height: 14.4,
    minWidth: 0,
    borderRadius: "50%",
    fontSize: theme.typography.fontSizes.xsss,
    top: 2,
    right: 2,
  },
}));

export const FeedbackText = styled("a")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  borderRadius: theme.shape.borderRadius,
  cursor: "pointer",
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  color: theme.palette.primary.main,
  // fontWeight: theme.typography.fontWeights.bold,
  textDecoration: "none",
  maxHeight: "29px",
  "&:hover": {
    backgroundColor: colors.grey[100],
  },
}));

export const UserDetailsModalContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  minWidth: 420,
  margin: theme.spacing(5),
}));

// Sits directly under the modal heading as an intro note, so the accent bar
// carries the emphasis instead of relying on the reader reaching the footer.
export const UserDetailsDescription = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.mutedSlate,
  backgroundColor: theme.palette.button.secondaryHover,
  borderLeft: `${theme.shape.borderSizes.thick} solid ${theme.palette.button.secondary}`,
  borderRadius: theme.shape.borderRadii.small,
  padding: theme.spacing(2, 2.5),
  lineHeight: 1.5,
  fontStyle: "italic",
}));
