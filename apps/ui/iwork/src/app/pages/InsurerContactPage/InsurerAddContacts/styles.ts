import { Box, styled, Typography } from "@mui/material";

export const StyledCrumbContainer = styled(Box)(({ theme }) => ({
  margin: `${theme.spacing(5)} auto`,
  maxWidth: "1254px",
}));

export const TitleContainer = styled(Typography)(({ theme }) => ({
  maxWidth: "1254px",
  margin: `${theme.spacing(5)} auto`,
}));
