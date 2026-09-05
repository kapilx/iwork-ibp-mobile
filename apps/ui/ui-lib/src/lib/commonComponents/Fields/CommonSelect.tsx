import React from "react";
import { Box, Select, SelectProps } from "@mui/material";
import {
  DynamicFormSelectStyles,
  StyledTypography,
} from "../FormComponent/Fields/styles";

export interface CommonSelectProps extends SelectProps {
  width?: number | string;
  height?: number | string;
  label?: React.ReactNode;
}

const CommonSelect: React.FC<CommonSelectProps> = ({
  width,
  height,
  sx,
  label,
  error,
  ...rest
}) => (
  <Box>
    {label && (
      <StyledTypography variant="body2" error={Boolean(error)}>
        {label}
      </StyledTypography>
    )}
    <DynamicFormSelectStyles
      {...rest}
      error={error}
      sx={{ width, height, ...(sx || {}) }}
    />
  </Box>
);

export default CommonSelect;
