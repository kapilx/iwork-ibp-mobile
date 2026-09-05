import { Box, Typography, styled } from "@mui/material";

export const DocumentHolder = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between", // Pushes AccessLink to the bottom
  height: "115px",
  minWidth: "260px", // Minimum width for the card
  width: "100%", // Fits within the grid cell defined in KnowledgeCentral/styles.ts
  padding: theme.spacing(2.25), // Adjusted padding
  border: `1px solid transparent`, // Default transparent border
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxSizing: "border-box",
  transition: "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  position: "relative",
  cursor: "pointer", // Indicates the card is clickable
  "&:hover": {
    borderColor: theme.palette.background.lightBlue, // #f9faff
    boxShadow: theme.shadows[3], // A slightly more pronounced shadow on hover
  },
}));

export const TopSection = styled(Box)(({ theme }) => ({
  height: "50px", // Set fixed height for the top section
  display: "flex",
  alignItems: "center", // Vertically center IconWrapper and ContentWrapper
  gap: theme.spacing(1.5),
  width: "100%",
  overflow: "hidden", // Prevents content from breaking layout
}));

export const DocumentCardIconWrapper = styled(Box)(({ theme }) => ({
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  backgroundColor: theme.palette.common.white,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: theme.shadows[2], // Example: '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)'
  flexShrink: 0, // Prevents the icon wrapper from shrinking
  marginRight: theme.spacing(0.5), // Space between icon and content
}));

export const StyledIcon = styled("img")({
  width: "27px",
  height: "27px",
  objectFit: "contain",
});

export const ContentWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "2px", // Small gap between title and meta info
  justifyContent: "center", // Vertically center title and meta info within their allocated space
  overflow: "hidden", // Handles long titles
  flexGrow: 1,
  minWidth: 0, // Prevents flex item from overflowing if title is too long
});

export const TitleRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between", // Pushes download icon to the right
  width: "100%",
});

export const Title = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: "0.875rem", // 14px
  color: theme.palette.text.primary,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  lineHeight: 1.4,
  flexGrow: 1, // Allow title to take available space
  marginRight: theme.spacing(1), // Space before download icon
}));

export const MetaInfo = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem", // 12px
  color: theme.palette.text.lightGrey, // Lighter color for date and access count
  display: "flex",
  flexWrap: "wrap", // Allow wrapping if space is tight
  gap: theme.spacing(0.5), // Space between date and access count items
}));

export const DownloadIconStyled = styled("img")({
  width: "20px", // Adjusted to 20x20 for better fit with title
  height: "20px",
  objectFit: "contain",
  cursor: "pointer",
  flexShrink: 0,
});

export const SeparatorLine = styled(Box)(({ theme }) => ({
  height: "1px",
  backgroundColor: theme.palette.neutral.tableBorder, // Corresponds to #EAEAEA, close to #E3E3E3
  margin: theme.spacing(2, 0.625), // 8px top/bottom, 5px left/right (0.625 * 8px = 5px)
}));

export const BottomSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5), // Space between summary and access link
  justifyContent: "space-between", // Pushes AccessLink to the bottom of this section
  overflow: "hidden", // Ensure summary ellipsis works
}));

export const SummaryText = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem", // 12px, smaller font for summary
  color: theme.palette.text.primary,
  paddingLeft: theme.spacing(2), // 5px padding to the left
  paddingRight: theme.spacing(2), // 5px padding to the right
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}));

export const TagsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1.75),
  paddingLeft: theme.spacing(2), // 5px padding to the left
  paddingRight: theme.spacing(2), // 5px padding to the right
  marginTop: theme.spacing(0.5), // Small space above the tags
}));

export const MoreTagsLabel = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  color: theme.palette.button.secondary, // Use primary color for visibility
  cursor: "default", // Indicate it's not directly clickable but has a tooltip
  padding: theme.spacing(0.25, 0.75), // Minimal padding
  marginTop: theme.spacing(0.75), // Small space above the label
}));

export const AccessLink = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem", // 12px
  color: theme.palette.primary.main,
  textDecoration: "underline",
  cursor: "pointer",
  alignSelf: "flex-end",
  // marginTop: theme.spacing(1), // AccessLink is now at the end of BottomSection, space managed by BottomSection's justify-content
}));

export const CategoryChipWrapper = styled(Box)(({ theme }) => ({
  // This targets the .MuiChip-root class of the Chip component rendered by ChipRenderer
  "& .MuiChip-root": {
    backgroundColor: theme.palette.neutral.veryLight, // #FFFFFF
    border: `1px solid ${theme.palette.neutral.light}`, // #CCCCCC
    color: theme.palette.text.primary, // Default text color
  },
}));

export const EditIconStyled = styled("img")(({ theme }) => ({
  width: "20px",
  height: "20px",
  position: "absolute",
  right: theme.spacing(2), // 8px from the right
  cursor: "pointer",
}));
