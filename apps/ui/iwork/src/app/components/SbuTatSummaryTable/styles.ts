import { Typography, Box, styled } from "@mui/material";

export const SectionHeading = styled(Typography)(({ theme }) => ({
    fontSize: "16px",
    fontWeight: 700,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
    borderBottom: `2px solid ${theme.palette.primary.main}`,
    paddingBottom: theme.spacing(1),
}));

export const TableTitle = styled(Typography)(({ theme }) => ({
    fontSize: "14px",
    fontWeight: 600,
    color: "black",
    marginBottom: theme.spacing(1),
}));

export const TatSectionWrapper = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(3),
}));

export const TableWrapper = styled(Box)(() => ({
    marginBottom: 4,
    "& .right-aligned-clickable-cell": {
        cursor: "pointer",
        color: "#1976d2",
        textDecoration: "underline",
        textAlign: "right",
    },
}));
