import { Box, styled, Typography, Link } from "@mui/material";

export const ServiceUrlsContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: theme.spacing(7.5, 5),
    gap: theme.spacing(2.5),
}));

export const ServiceUrlsTitle = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(5),
}));

export const SwaggerLink = styled(Link)(({ theme }) => ({
    color: (theme.palette.text.linkBlue),
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "underline",
    "&:hover": {
        color: theme.palette.text.primary,
    },
}));