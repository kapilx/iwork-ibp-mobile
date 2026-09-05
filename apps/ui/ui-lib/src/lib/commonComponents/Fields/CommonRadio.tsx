import React from "react";
import { Radio, RadioProps } from "@mui/material";

export interface CommonRadioProps extends RadioProps {
  width?: number | string;
  height?: number | string;
  activeIcon?: React.ReactNode;   // Pass your active image/icon here
  inactiveIcon?: React.ReactNode; // Pass your inactive image/icon here
}

const CommonRadio: React.FC<CommonRadioProps> = ({
  width,
  height,
  sx,
  activeIcon,
  inactiveIcon,
  ...rest
}) => (
  <Radio
    {...rest}
    icon={inactiveIcon}
    checkedIcon={activeIcon}
    sx={{ width, height, p: 0, ...(sx || {}) }}
  />
);

export default CommonRadio;
