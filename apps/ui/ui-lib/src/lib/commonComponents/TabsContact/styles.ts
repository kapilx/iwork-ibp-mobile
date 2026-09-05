import { styled } from "@mui/material";
import { Box } from "@mui/material";

export const ParaContainer = styled("div")(
  ({ theme }) => `
    align-items: center;
    justify-content: center;
    display: flex;
    margin-top: ${theme.spacing(4)};
    `
);

export const TabsContactGridContainer = styled(Box)(
  ({ theme }) => `
    margin-top: ${theme.spacing(5)};
    display: flex;
    flex-direction: column;
    align-items: end;
    gap: 20px;
  `
);
