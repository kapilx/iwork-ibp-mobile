import { Box, styled } from "@mui/material";

export const StyledSmartActionsBlock = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
}));

export const StyledActionContainer = styled(Box)(
  ({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    justifyContent: "flex-start",
    padding: theme.spacing(2),
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    //   cursor: "pointer",
    },
  })
);

export const StyledActionLabel = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap:theme.spacing(1),
  "> img": {
    width: 16,
    height: 16,
  }
}));

export const StyledActionIcon = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: 700
}));

export const StyledTitle = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: 700,
  color: "#555555",
}));

export const StyledSubTitle = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: "400",
  color: theme.palette.text.lightGrey,
}));
