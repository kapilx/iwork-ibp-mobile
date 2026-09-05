import { Box } from "@mui/material";
import styled from "styled-components";
import Bottomfooter from "../../common/BottomFooter";

export const StyledEnrollContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    width: "100%",
    maxWidth: "1480px",
    margin: "0 auto",
    alignItems:"flex-start",
    justifyContent:"space-between",
    gap: theme.spacing(4),
    padding: theme.spacing(0, 4, 10),
    boxSizing: "border-box",
    [theme.breakpoints.down("lg")]: {
        flexDirection: "column",
        gap: theme.spacing(3),
        padding: theme.spacing(0, 2, 6),
    },
}));

