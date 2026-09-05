import { styled } from "@mui/material";
import { StyleMapProps } from ".";

export const StyledText = styled("span")<{
  styleMap: StyleMapProps;
}>(({ theme, styleMap }) => ({
  color: styleMap.color || theme.palette.text.primary,
  backgroundColor: styleMap.backgroundColor || "transparent",
  fontWeight: styleMap.fontWeight || "regular",
  borderRadius: styleMap.backgroundColor ? theme.shape.borderRadius : 0,
  fontSize: styleMap.fontSize || theme.typography.fontSizes.sm,
}));
