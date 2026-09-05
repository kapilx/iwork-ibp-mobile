import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const SectionContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(12),
  // marginTop: theme.spacing(4),
  minWidth: 0,
  width: "100%",
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(3),
    marginTop: theme.spacing(3),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(2.5),
    marginTop: theme.spacing(2),
  },
}));

export const ContactSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  minWidth: 0,
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(2.5),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(2),
  },
}));

export const AddressSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  minWidth: 0,
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(2.5),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(2),
  },
}));
export const AddressSectionContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: theme.spacing(8),
  minWidth: 0,
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(4),
  },
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
    gap: theme.spacing(3),
  },
}));
export const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(8),
  flexWrap: "wrap",
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(2),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1.5),
  },
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.LightDark,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xl,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.lg,
  },
}));

export const SectionAction = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.lightBlue,
  padding: 0,
  minWidth: "auto",
  backgroundColor: "transparent",
  fontSize: theme.typography.fontSizes.md,

  "&:hover": {
    backgroundColor: "transparent",
  },

  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.sm,
    "& .MuiButton-startIcon": {
      marginRight: theme.spacing(1),
      "& svg": {
        fontSize: theme.typography.fontSizes.lg,
      },
      "& img": {
        width: "16px !important",
        height: "16px !important",
      },
    },
  },
}));

export const SubSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  minWidth: 0,
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1.5),
  },
}));

export const SubSectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.LightDark,
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.sm,
  },
}));

export const DividerLine = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "3px",
  backgroundColor: theme.palette.border.pistachio,
}));

export const InfoGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: theme.spacing(3, 4),
  [theme.breakpoints.down("lg")]: {
    gap: theme.spacing(2.5, 3),
  },
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
    gap: theme.spacing(2, 2),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1.5, 1.5),
  },
}));

export const ContactInfoGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: theme.spacing(3),
  minWidth: 0,
  [theme.breakpoints.down("lg")]: {
    gap: theme.spacing(2.5),
  },
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(2),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1.5),
  },
}));

export const AddressGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(3, 4),
  minWidth: 0,
  // [theme.breakpoints.down("lg")]: {
  //   gap: theme.spacing(2.5, 3),
  // },
  // [theme.breakpoints.down("md")]: {
  //   gridTemplateColumns: "repeat(2, 1fr)",
  //   gap: theme.spacing(2, 2),
  // },
  // [theme.breakpoints.down("sm")]: {
  //   gridTemplateColumns: "1fr",
  //   gap: theme.spacing(1.5, 1.5),
  // },
}));

export const InfoItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.8),
  minWidth: 0,
  overflow: "hidden",
}));

export const InfoLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  opacity: 0.6,
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xs,
  },
}));

export const InfoValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.md,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.sm,
  },
}));

export const ContactsWrapper = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: theme.spacing(8),
  minWidth: 0,
  [theme.breakpoints.down("lg")]: {
    gap: theme.spacing(6),
  },
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
    gap: theme.spacing(4),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(3),
  },
}));

export const ContactColumn = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  minWidth: 0,
}));

export const InfoEditableField = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const AlternateInputOuter = styled(Box)(() => ({
  width: "100%",
  maxWidth: "360px",
  marginTop: 5,
}));

export const AlternateInputContainer = styled(Box)(() => ({
  position: "relative",
}));

interface AlternateInputProps {
  hasError?: boolean;
  hasLoader?: boolean;
}

export const AlternateInput = styled("input", {
  shouldForwardProp: (prop) => prop !== "hasError" && prop !== "hasLoader",
})<AlternateInputProps>(({ hasError, hasLoader }) => ({
  width: "100%",
  padding: "10px 12px",
  paddingRight: hasLoader ? "36px" : "12px",
  border: hasError ? "1px solid #ff0000" : "1px solid #D9D9D9",
  borderRadius: "6px",
  fontSize: "16px",
  outline: "none",
  boxShadow: "none",
  appearance: "none",
}));

export const AlternateInputLoader = styled(Box)(() => ({
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  display: "flex",
  alignItems: "center",
}));

export const AlternateInputError = styled(Typography)(() => ({
  color: "#ff0000",
  fontSize: "12px",
  marginTop: "6px",
}));

export const EditableFieldIcon = styled("img")(() => ({
  width: 20,
  height: 20,
  cursor: "pointer",
}));
