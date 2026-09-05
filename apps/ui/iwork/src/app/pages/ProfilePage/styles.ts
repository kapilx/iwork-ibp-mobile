import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { colors } from "@ui/ui-lib";

export const ProfileContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
  padding: theme.spacing(5),
}));

export const Card = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(5),
}));

export const HeroCard = styled(Card)(({ theme }) => ({
  background: "linear-gradient(180deg, #F8F5FF 50%, #FFFFFF 60%)",
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  alignItems: "start",
  gap: theme.spacing(5),
  borderTop: `4px solid ${theme.palette.secondary.main}`,
}));

export const Initials = styled(Box)(({ theme }) => ({
  width: 72,
  height: 72,
  flexShrink: 0,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.secondary.main,
}));

export const Name = styled("h2")(({ theme }) => ({
  margin: 0,
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.text.primary,
}));

export const Row = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(4),
  flexWrap: "wrap",
  marginTop: theme.spacing(3),
}));

export const ContactLink = styled("a")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1),
  fontSize: theme.typography.fontSizes.lg,
  color: theme.palette.primary.main,
  textDecoration: "none",
  "&:hover": { textDecoration: "underline" },
}));

export const SectionTitle = styled("h3")(({ theme }) => ({
  margin: `0 0 ${theme.spacing(4)} 0`,
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.primary.main,
}));

export const FieldGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(4),
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" },
}));

export const FieldLabel = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: '#747474',
  fontWeight: theme.typography.fontWeights.semiBold,
  marginBottom: theme.spacing(1),
}));

export const FieldValue = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
  wordBreak: "break-word",
}));

// The hero name row and the manager row sit flush against the block above
// them, so they drop Row's default top margin.
export const FlushRow = styled(Row)({ marginTop: 0 });

// Grid/flex child that is allowed to shrink, so long values wrap instead of
// overflowing. Used for the hero details column and for every labelled cell.
export const Column = styled("div")({ minWidth: 0 });

export const ManagerInitials = styled(Initials)(({ theme }) => ({
  width: 56,
  height: 56,
  fontSize: theme.typography.fontSizes.lg,
}));

// The manager block is avatar + name + contacts, so the avatar aligns with the
// name rather than floating against the middle of the block.
export const ManagerRow = styled(FlushRow)({ alignItems: "flex-start" });

export const ManagerFieldGrid = styled(FieldGrid)(({ theme }) => ({
  marginTop: theme.spacing(5),
  paddingTop: theme.spacing(5),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

// Labelled key/value pairs shown inline under the name (designation, employee
// id, ...) — same label/value treatment as the cards below, just laid out in a
// row so the hero stays compact.
export const MetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  columnGap: theme.spacing(6),
  rowGap: theme.spacing(3),
  marginTop: theme.spacing(3),
}));

export const RolesLabel = styled(FieldLabel)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

export const ChipRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));


export const STATUS_CHIP_BORDER_COLOR = colors.text.success;

export const STATUS_CHIP_STYLE_MAP = {
  active: {
    backgroundColor: "transparent",
    color: colors.text.success,
  },
  default: {
    backgroundColor: colors.background.lightGrey,
    color: colors.text.grey,
  },
};

export const ROLE_CHIP_STYLE_MAP = {
  default: {
    backgroundColor: colors.background.lightGrey,
    color: colors.text.grey,
  },
};
