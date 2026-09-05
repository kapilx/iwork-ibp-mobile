import { Box, styled, TextField } from "@mui/material";
import Button from "../Button";
import ChipRenderer from "../Chip";
import { theme } from "@ui/ui-lib/styles/Theme";
export const SearchResultsGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(2),
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  padding: theme.spacing(2),
}));

export const SmartSearchContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(1, 2),
}));

export const SMART_SEARCH_CHIP_VALUE_CLASS = "smart-search-chip-value";

// The applied-filter pill. height is the one thing ChipRenderer exposes no prop
// for, and the bold rule targets the labelClass we hand it below.
export const SelectedFilterChip = styled(ChipRenderer)(({ theme }) => ({
  height: "auto",
  // The chip's only direct child span is its label wrapper, which ships with
  // nowrap + ellipsis. Let it wrap so a long value grows the pill downwards.
  "& > span": {
    whiteSpace: "normal",
    overflow: "visible",
    wordBreak: "break-word",
    minWidth: 0,
  },
  [`& .${SMART_SEARCH_CHIP_VALUE_CLASS}`]: {
    fontWeight: theme.typography.fontWeights.bold,
  },
  // Inside that wrapper, the field name is the span without the value class.
  // Keep it on one line and out of the flex shrink so the value wraps under
  // itself rather than snapping "Vertical:" in half.
  [`& > span span:not(.${SMART_SEARCH_CHIP_VALUE_CLASS})`]: {
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
}));

// Everything else goes through ChipRenderer's own props rather than reaching
// into MUI's internal classes. whiteSpace/wordBreak on the label container let
// long multiselect values wrap inside the pill instead of being ellipsed.
export const selectedFilterChipProps = {
  // ChipRenderer resolves its fill from styleMap, keyed by the chip value; the
  // "default" entry is the catch-all every filter value falls through to.
  styleMap: {
    default: {
      backgroundColor: theme.palette.background.tableHeader,
      color: theme.palette.text.primary,
    },
  },
  bordercolor: theme.palette.neutral.tableBorder,
  padding: theme.spacing(0.5, 0),
  maxWidth: "100%",
  ChipLabelContainerStyles: {
    minWidth: 0,
    whiteSpace: "normal" as const,
    wordBreak: "break-word" as const,
    fontSize: theme.typography.fontSizes.sm,
  },
};

export const KeyValueContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  rowGap: theme.spacing(1.5),
  columnGap: theme.spacing(1.5),
  marginTop: theme.spacing(0),
  // No width cap: the parent flex row already bounds this, and the siblings
  // (search field, action buttons) hold their size via flexShrink: 0.
  minWidth: 0,
  flex: 1,
  "@media (max-width: 1199px)": {
    width: "100%",
  },
}));

export const AccordionStyles = {
  accordion: {
    border: "none",
    boxShadow: "none",
  },
  details: {
    padding: theme.spacing(0),
  },
  summary: {
    marginTop: theme.spacing(2.5),
  },
};

export const TextHeaderBlock = styled(Box)(({ theme }) => ({
  display: "flex",
  // baseline, not flex-start: the heading is an h4 with a tall line-height and
  // the applied-filter chips are sm text, so aligning their box tops left the
  // chips' baseline floating above the heading's — they read as two lines when
  // they are meant to read as one. baseline lines the text up regardless of the
  // size difference, and still aligns to the chips' first line when they wrap.
  alignItems: "baseline",
  columnGap: theme.spacing(2),
  // Claim whatever the search field / filter icon leave behind, rather than
  // reserving a fixed slot for a search box that some pages hide entirely.
  flex: 1,
  minWidth: 0,
  "@media (max-width: 1199px)": {
    flexWrap: "wrap",
    rowGap: theme.spacing(4),
    width: "100%",
    flexDirection: "column",
    alignItems: "flex-start",
  },
}));

export const SearchTitleContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  "@media (max-width: 1199px)": {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(2),
  },
}));

export const TextFieldWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  flexShrink: 0,
  "@media (max-width: 1199px)": {
    width: "100%",
    justifyContent: "space-between",
  },
}));

export const SmartSearchFormStyles = {
  padding: theme.spacing(0),
  "& .MuiGrid-root": {
    gap: "12px",
  },
};

export const SmartSearchStyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "hasValue" && prop !== "hasFilters",
})<{
  hasValue?: boolean;
  hasFilters?: boolean;
}>(({ theme, hasValue, hasFilters }) => ({
  "&.search-icon": {
    background: hasValue
      ? theme.palette.primary.main
      : theme.palette.neutral.veryLight,
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadii.medium,
    marginLeft: theme.spacing(1),
    transition: "background 0.3s ease",
    border: hasValue
      ? "none"
      : `${theme.shape.borderSizes.thin} solid ${theme.palette.primary.main}`,
  },
  "&.filter-icon": {
    background: hasFilters
      ? theme.palette.primary.main
      : theme.palette.neutral.veryLight,
    border: `${theme.shape.borderSizes.thin} solid ${
      hasFilters ? "none" : theme.palette.primary.main
    }`,
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadii.medium,
    marginLeft: theme.spacing(3),
    transition: "background 0.3s ease, border 0.3s ease",
  },
}));

export const SmartSearchButtonsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flexShrink: 0,
  "@media (max-width: 1199px)": {
    width: "100%",
    justifyContent: "flex-start",
    flexWrap: "wrap",
  },
}));

export const SelectedValuesContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
  justifyContent: "space-between",
  "@media (max-width: 1199px)": {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(3),
  },
}));

export const SmartSearchStyledTextField = styled(TextField)(({ theme }) => ({
  width: "400px",
  "& .MuiInputBase-input::placeholder": {
    color: theme.palette.text.primary,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.light,
    opacity: 1,
  },
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 2.5),
  },
  "@media (max-width: 1199px)": {
    width: "100%",
    flex: 1,
  },
}));
export const ColorText = styled("span")(({ theme }) => ({
  color: theme.palette.button.secondary,
}));
