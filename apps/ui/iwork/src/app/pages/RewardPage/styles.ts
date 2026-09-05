import { Box, styled, Typography } from "@mui/material";

export const RewardPageStyledContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(5),
}));

export const TitleContainer = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(5),
}));
