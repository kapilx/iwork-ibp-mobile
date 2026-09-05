/**
 * Custom Button component with configurable `variantType`, `sizeType`, and `label`.
 * Props:
 * - `variantType`: Button style ("primary", "secondary", "link", "icon").
 * - `sizeType`: Button size ("large", "small").
 * - `label`: Button text (defaults to "Submit").
 * Example usage:
 * <Button label="Submit Form" variantType="secondary" sizeType="small" />
 */
import {
  Button as MUIButton,
  ButtonProps as MUIButtonProps,
  styled,
} from "@mui/material";
import { getButtonStyles } from "./styles";
import { SUBMIT } from "../../constants";

export interface ButtonProps extends Omit<MUIButtonProps, "variant"> {
  variantType?:
    | "primary"
    | "secondary"
    | "link"
    | "icon"
    | "addButton"
    | "gradient";
  sizeType?: "large" | "small";
  label?: string | React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const CustomButton = styled(MUIButton)<ButtonProps>(
  ({ variantType, sizeType }) => getButtonStyles({ variantType, sizeType }),
);

const Button = ({
  label,
  variantType,
  sizeType,
  className,
  children,
  ...muiProps
}: ButtonProps) => {
  return (
    <CustomButton
      variantType={variantType}
      sizeType={sizeType}
      className={className}
      {...muiProps}
    >
      {children ?? label ?? SUBMIT} {/* Default text is "Submit" */}
    </CustomButton>
  );
};

export default Button;
