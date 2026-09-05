import { Box, styled } from "@mui/material";
import { Button } from "@ui/ui-lib";

export const StyledPageContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(5),
}));

export const StyledCrumbContainer = styled(Box)(() => ({
    margin: "0 auto",
    maxWidth: "1254px",
}));

export const StyledRewardFormContainer = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(9),
}));

export const StyledActionButton = styled(Button)(({ theme }) => ({
    minWidth: "fit-content",
    paddingLeft: theme.spacing(5),
    paddingRight: theme.spacing(5),
}));
