import React from "react";
import { Box, TextField, TextFieldProps } from "@mui/material";
import { StyledTypography } from "../FormComponent/Fields/styles";
import { FieldsStyledTextField } from "./styles.js";
import { isCopyPasteAllowedForOrg } from "../../environment";
// import { StyledTextField } from "../../pages/PolicyPage/styles";

export interface CommonTextFieldProps extends TextFieldProps {
  width?: number | string;
  height?: number | string;
  fullWidthPx?: number; // Optional: force width in px
  fullHeightPx?: number; // Optional: force height in px
  label?: React.ReactNode;
  maxWidth?: number | string; // Optional: max width
  dataTestId?: string; // Optional: data-testid for testing
}

const CommonTextField: React.FC<CommonTextFieldProps> = ({
  width,
  height,
  fullWidthPx,
  fullHeightPx,
  maxWidth,
  sx,
  label,
  error,
  dataTestId,
  ...rest
}) => {
  const resolvedSx = {
    ...(fullWidthPx && { width: `${fullWidthPx}px` }),
    ...(fullHeightPx && {
      height: `${fullHeightPx}px`,
      "& .MuiInputBase-root": {
        height: `${fullHeightPx}px`,
        boxSizing: "border-box",
      },
    }),
    ...(width && { width }),
    ...(height && { height }),
    ...(maxWidth && { maxWidth }), // Optional: max width
    ...(sx || {}),
  };

  return (
    <Box
      data-testid={`${dataTestId}-container` || "common-text-field-container"}
    >
      {label && (
        <StyledTypography
          variant="body2"
          error={Boolean(error)}
          data-testid={`${dataTestId}-label` || "common-text-field-label"}
        >
          {label}
        </StyledTypography>
      )}
      <FieldsStyledTextField
        {...rest}
        error={error}
        sx={resolvedSx}
        data-testid={dataTestId || "common-text-field"}
        onPaste={(e) => {
          if (!isCopyPasteAllowedForOrg()) {
            e.preventDefault();
          }
        }}
      />
    </Box>
  );
};

export default CommonTextField;
