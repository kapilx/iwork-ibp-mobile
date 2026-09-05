import React from "react";
import Button from "../../Button";
import { FieldComponentProps } from "../types";

const ButtonField = ({ field, onActionMap, watch }: FieldComponentProps) => {
  const handleClick = () => {
    if (typeof field.onClick === "function") {
      field.onClick();
    } else if (
      typeof field.onClick === "string" &&
      onActionMap?.[field.onClick]
    ) {
      onActionMap[field.onClick](); // Dynamically resolve the action
    } else {
      console.warn(`No valid onClick handler found for field: ${field.name}`);
    }
  };

  // Get disabled state from componentProps
  const isDisabled = field.componentProps?.disabled ?? field.disabled ?? false;

  // Get loading text from componentProps or use default
  const loadingText =
    (field.componentProps as any)?.loadingText ?? "Processing...";

  // Check if button is in loading state
  const isLoading = (field.componentProps as any)?.isLoading ?? false;

  return (
    <Button
      {...(field.componentProps as Partial<
        React.ComponentProps<typeof Button>
      >)}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {isLoading ? loadingText : field.label}
    </Button>
  );
};

export default ButtonField;
