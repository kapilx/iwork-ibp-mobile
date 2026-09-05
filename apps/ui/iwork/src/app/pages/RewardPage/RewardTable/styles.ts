import { Box, styled } from "@mui/material";

export const RewardTableStyledContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: theme.spacing(4, 0),

    ".clickable-cell": {
        cursor: "pointer",
        fontSize: theme.typography.fontSizes.sm,
        fontWeight: theme.typography.fontWeights.regular,
    },

    // Center the "Actions" column header label.
    ".ag-center-header .ag-header-cell-label": {
        justifyContent: "center",
    },
}));

export const RewardActionsContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(1),
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    cursor: "pointer",
}));
