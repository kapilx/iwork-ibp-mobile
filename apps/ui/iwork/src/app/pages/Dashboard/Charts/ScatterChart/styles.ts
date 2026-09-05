import { styled } from "@mui/material";

export const StyledbottomLine = styled('div')(({ theme }) => ({
    position: 'absolute',
    bottom: '18%',
    left: 0,
    right: 0,
    height: '1px',
    backgroundColor: theme.palette.divider
}));

