import React from "react";
import { Checkbox, CheckboxProps } from "@mui/material";
import { styled } from "@mui/material/styles";

import CheckedIcon from "../../assets/svgs/checked-box.svg";
import ErrorCheckedIcon from "../../assets/svgs/error-checkbox.svg";
import UncheckedIcon from "../../assets/svgs/unchecked-box.svg";

export interface CommonCheckboxProps extends CheckboxProps {
  width?: number | string;
  height?: number | string;
  errorState?: boolean; // Optional: to handle error state
}

const StyledCheckbox = styled(Checkbox)<CommonCheckboxProps>(
  ({ width, height }) => ({
    width: width || 20,
    height: height || 20,
  })
);

const CommonCheckbox: React.FC<CommonCheckboxProps> = ({
  width,
  height,
  errorState = false, // Default to false if not provided
  sx,
  ...rest
}) => (
  <StyledCheckbox
    icon={
      !errorState ? (
        <img src={UncheckedIcon} alt="Unchecked" width={width || 16} />
      ) : (
        <img src={ErrorCheckedIcon} alt="ErrorChecked" width={width || 16} />
      )
    }
    checkedIcon={<img src={CheckedIcon} alt="Checked" width={width || 16} />}
    sx={{ ...(sx || {}) }}
    {...rest}
  />
);

export default CommonCheckbox;
