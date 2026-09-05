import { Box, Button, ButtonBase, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const CardContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "variant",
})<{ variant?: "button" | "link" }>(({ theme, variant }) => ({
  background: "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)",
  borderRadius: 8,
  padding: theme.spacing(6, 5),
  boxShadow: "0px 6px 100px 0px #0000001A",
  border: "1px solid #FFFFFF",
  ...(variant === "button" && {
    transition: "transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 320ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    transform: "translateZ(0)",
    willChange: "transform, box-shadow",
    "&:hover": {
      transform: "scale(1.010)",
      background: "linear-gradient(355deg, rgba(5, 109, 210, 0.03) 21.39%, rgba(5, 109, 210, 0.23) 183.31%)",
      "& .card-header::after": {
        width: "100%",
      },
      "& .arrow-button": {
        background: "#093F84",
        color: "#FFFFFF",
        "& svg": {
          color: "#FFFFFF",
        },
        "& .view-details-text": {
          color: "#FFFFFF",
        },
      },
    },
  }),
}));

export const PolicyIcon = styled(Box)<{ gradient?: string }>(
  ({ theme, gradient }) => ({
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.palette.common.black,
    flexShrink: 0,
    background:
      gradient || "linear-gradient(155.16deg, #FFAE65 18.69%, #E4520E 92.69%)",
  }),
);
export const CardHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== "variant",
})<{ variant?: "button" | "link" }>(({ theme, variant }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(5),
  marginBottom: theme.spacing(7),
  position: "relative",
  maxWidth:"fit-content",
  ...(variant === "button" && {
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: "-15px",
      left: 0,
      width: 0,
      height: "2px",
      backgroundColor: "#093F84",
      transition: "width 0.4s linear",
    },
  }),
}));

export const CardTitle = styled(Typography)(({ theme }) => ({
  fontSize: 24,
  fontWeight: 500,
  color: "#222222",
  fontFamily: theme.typography.fontFamily,
  [theme.breakpoints.down("md")]: {
    fontSize: 20,
  },
  "@media (max-width: 768px)": {
    fontSize: 18,
  },
  "@media (max-width: 480px)": {
    fontSize: 16,
  },
}));

export const CardBadge = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(1.5, 2.5),
  borderRadius: 8,
  backgroundColor: "#DFDFDF",
  color: "#222222",
  fontSize: 14,
  fontWeight: 400,
}));

export const DetailsGrid = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  "@media (max-width: 768px)": {
    flexDirection: "column",
    alignItems: "stretch",
    gap: theme.spacing(4),
  },
}));


export const LeftContainer = styled(Box)<{ alignRight?: boolean }>(({ theme, alignRight }) => ({
  display: "flex",
  gap: theme.spacing(7),
  [theme.breakpoints.between("sm", "md")]: {
    flexDirection: "column",
    gap: theme.spacing(3),
  },
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    gap: theme.spacing(2),
  },
}));
export const ButtonContainer = styled(Box)<{ alignRight?: boolean }>(({ theme, alignRight }) => ({
  marginBottom: theme.spacing(2),
  [theme.breakpoints.between("sm", "md")]: {
    marginBottom: 0,
  },
  [theme.breakpoints.down("sm")]: {
    marginBottom: 0,
  },
  "@media (max-width: 768px)": {
    width: "100%",
    marginBottom: 0,
  },
}));
export const DetailItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== "alignRight",
})<{ alignRight?: boolean }>(({ theme, alignRight }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: alignRight ? "flex-end" : "flex-start",
  justifyContent: "center",
  gap: theme.spacing(2),
}));

export const DetailLabel = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 400,
  color: "#222222",
  fontFamily: theme.typography.fontFamily,
  opacity: 0.6,
  "@media (max-width: 768px)": {
    fontSize: 13,
  },
  "@media (max-width: 480px)": {
    fontSize: 12,
  },
}));

export const DetailValue = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "colorVariant" && prop !== "isZero",
})<{ colorVariant?: "claimed" | "available"; isZero?: boolean }>(
  ({ theme, colorVariant, isZero }) => ({
    fontSize: 18,
    fontWeight: 400,
    color:
      isZero
        ? "#999"
        : colorVariant === "claimed"
        ? "#FA3535"
        : colorVariant === "available"
        ? "#1EB431"
        : "#222222",
    opacity: isZero ? 0.6 : 1,
    fontFamily: theme.typography.fontFamily,
    "@media (max-width: 768px)": {
      fontSize: 16,
    },
    "@media (max-width: 480px)": {
      fontSize: 14,
    },
  })
);

export const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  padding: theme.spacing(3.5, 5),
  textTransform: "none",
  fontSize: 14,
  fontWeight: 400,
  border: "1px solid #093F84",
  color: "#093F84",
  lineHeight: "100%",
  backgroundColor: "transparent",
  minWidth: 160,
  "&:hover": {
    backgroundColor: "#093F84",
    color: "#FFFFFF",
  },
  "&.Mui-disabled": {
    border: "1px solid #DFDFDF",
    color: "#9B9B9B",
  },
  "@media (max-width: 768px)": {
    width: "100%",
    minWidth: "unset",
    fontSize: 13,
    padding: theme.spacing(2.5, 3),
  },
}));

export const CardFooter = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const ActionLink = styled(ButtonBase)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1),
  color: "#6F23C7",
  cursor: "pointer",
  padding: 0,
}));

export const ActionLinkText = styled(Typography)(({ theme }) => ({
  fontSize: 16,
  fontWeight: 500,
  color: "inherit",
}));
