import React from 'react';
import { Switch, styled } from '@mui/material';

interface ToggleProps {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    onChange?: (checked: boolean) => void;
}

const StyledSwitch = styled(Switch)(({ theme }) => ({
  width: 25,
  height:  13,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 1,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(12px)',
      color: theme.palette.background.paper,
      '& + .MuiSwitch-track': {
        background: theme.palette.background.ToggleTrack,
        border: `0.5px solid ${theme.palette.background.ToggleTrack}`,
        opacity: 1,
      },
    },
'&:not(.Mui-checked)': {
  '& .MuiSwitch-thumb': {
    filter: 'grayscale(1)',
    backgroundColor: theme.palette.background.GrayThumb, 
  },
  '& + .MuiSwitch-track': {
    filter: 'grayscale(1)',
    backgroundColor: theme.palette.background.GrayTrack, 
  },
},

    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.grey[100],
    },
  },
  '& .MuiSwitch-thumb': {
    width: 11,
    height: 11,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.ToggleThumb,
  },
  '& .MuiSwitch-track': {
    borderRadius: theme.spacing(22),
    background: theme.palette.background.ToggleTrack,
    border: `0.5px solid ${theme.palette.background.ToggleTrack}`,
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
  // Override opacity for disabled+unchecked state
  '& .Mui-disabled + .MuiSwitch-track': {
    opacity: 1, // Force opacity to 1 even when disabled
  },
}));

export const Toggle: React.FC<ToggleProps> = ({ checked, defaultChecked, disabled, onChange }) => {
    return (
        <StyledSwitch
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.checked)}
        />
    );
};
