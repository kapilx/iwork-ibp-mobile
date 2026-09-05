import React from 'react';
import { RadioGroup, RadioGroupProps } from '@mui/material';

export interface CommonRadioGroupProps extends RadioGroupProps {
  width?: number | string;
  height?: number | string;
}

const CommonRadioGroup: React.FC<CommonRadioGroupProps> = ({ width, height, sx, ...rest }) => (
  <RadioGroup {...rest} sx={{ width, height, ...(sx || {}) }} />
);

export default CommonRadioGroup;
