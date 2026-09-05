import React from "react";
import {
  CheckBoxStyledContainer,
  StyledLabel,
  HiddenCheckbox,
  StyledCheckbox,
} from "./styles";
import { CheckboxProps as MuiCheckboxProps } from "@mui/material/Checkbox";

interface CustomCheckboxProps extends Partial<MuiCheckboxProps> {
  label?: React.ReactNode;
  isChecked: boolean;
  variant?: "default" | "documentType";
  isIndeterminate?: boolean; // for "Selected" state
  onChange?: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => void;
  isIcon?: boolean;
  onClick?: (event: React.MouseEvent) => void; // Add onClick support
  disabled?: boolean; // Add disabled support
}

const Checkbox: React.FC<CustomCheckboxProps> = ({
  label,
  isChecked = false,
  variant = "default",
  isIndeterminate = false,
  onChange,
  isIcon: _isIcon,
  onClick,
  disabled = false, // Default to false
}) => {
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = event.target.checked;
    if (onChange) onChange(event, newChecked);
  };

  return (
    <CheckBoxStyledContainer data-testid="common-checkbox-container">
      <StyledLabel data-testid="common-checkbox-label" onClick={onClick}>
        <HiddenCheckbox
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
          data-testid="common-checkbox-input"
          disabled={disabled}
        />
        <StyledCheckbox
          isChecked={isChecked}
          variant={variant}
          isIndeterminate={isIndeterminate}
          className={isChecked === true ? "checked" : "unchecked"}
          isDisabled={disabled}
        />
        {label && label}
      </StyledLabel>
      {/* {isIcon && (
        <CheckBoxImageContainer>
          <img src={navigationIcon} alt="link" />
        </CheckBoxImageContainer>
      )} */}
    </CheckBoxStyledContainer>
  );
};

export default Checkbox;
