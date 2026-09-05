import React from 'react';
import { Switch, SwitchProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface CommonSwitchProps extends SwitchProps {
  width?: number | string;
  height?: number | string;
}

const StyledSwitch = styled(Switch)<CommonSwitchProps>(({ theme, width, height }) => ({
  width: width || 25,
  height: height || 13,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 1,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(12px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        background: theme.palette.background.SwitchTrack,
        border: '0.5px solid theme.palette.background.SwitchTrack,',
        opacity: 1,
      },
    },
    '&.Mui-unchecked': {
      opacity: 1,
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.grey[100],
    },
  },
  '& .MuiSwitch-thumb': {
    width: 11,
    height: 11,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.SwitchThumb,
  },
  '& .MuiSwitch-track': {
    borderRadius: theme.spacing(22),
    background: theme.palette.background.SwitchTrack,
    border: '0.5px solid theme.palette.background.SwitchTrack',
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

const CommonSwitch: React.FC<CommonSwitchProps> = ({ width, height, sx, ...rest }) => (
  <StyledSwitch width={width} height={height} sx={sx} {...rest} />
);

export default CommonSwitch;
