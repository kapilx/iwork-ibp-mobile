import { Box, styled, Typography } from "@mui/material";
import mapsBackground from "../../assets/webp/maps-background.png";

export const Card = styled(Box)(({ theme }) => ({
  width: "255px",
  padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
  borderRadius: theme.shape.borderRadii.normal,
  backgroundColor: theme.palette.neutral.veryLight,
  boxShadow: theme.shadows[11],
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginTop: theme.spacing(4),
  backgroundImage: `url(${mapsBackground})`,
  backgroundSize: "cover",
  backgroundPosition: "2px 8px",
  backgroundRepeat: "no-repeat",
  position: "relative",
}));

export const Header = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.bold,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.primary.main,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3.5),
}));

export const CardContent = styled(Box)(({ theme }) => ({}));

export const AddressContent = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.neutral.dark,
  lineHeight: "26px",
  marginBottom: theme.spacing(6),
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 3,
  maxWidth: "190px",
}));

export const AddressContactDetails = styled(Box)(({ theme }) => ({
  gap: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
}));

export const InfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.neutral.dark,
  gap: theme.spacing(2),
  "& img": {
    width: 18,
    height: 18,
  },
}));

export const MailText = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.neutral.dark,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "180px",
}));

export const MapLink = styled("a")(({ theme }) => ({
  display: "inline-block",
  textAlign: "center",
  cursor: "pointer",
  position: "absolute",
  right: "7%",
  top: "52px",
}));

export const MapImage = styled("img")(({ theme }) => ({
  maxWidth: "32px",
}));

export const EditIconButton = styled("button")(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(2),
  right: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(1),
  border: "none",
  background: "transparent",
  cursor: "pointer",
  borderRadius: theme.shape.borderRadii.normal,
  "& img": { width: 18, height: 18 },
  "&:hover": { backgroundColor: theme.palette.neutral.light },
}));
