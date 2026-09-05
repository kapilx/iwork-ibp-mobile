import React from "react";
import Button, { ButtonProps } from "../Button";
import {
  StyledActions,
  StyledContainer,
  StyledContent,
  StyledContentWithOutButton,
} from "./styles";

export interface DialogButtonProps extends ButtonProps {
  onClick: () => void;
  variant?: "primary" | "secondary" | "link" | "icon" | "addButton";
  disabled?: boolean;
}

interface CommonDialogBoxProps {
  text?: string | React.ReactNode; // message content
  buttons: DialogButtonProps[]; // action buttons
}

const CommonDialogBox: React.FC<CommonDialogBoxProps> = ({ text, buttons }) => {
  const hasButtons = (buttons?.length ?? 0) > 0;
  return (
    <StyledContainer data-testid="policy-common-dialog-box">
      {hasButtons ? (
        <>
          <StyledContent>{text}</StyledContent>
          <StyledActions>
            {buttons!.map((btnProps, index) => (
              <Button key={index} {...btnProps} />
            ))}
          </StyledActions>
        </>
      ) : (
        <StyledContentWithOutButton>{text}</StyledContentWithOutButton>
      )}
    </StyledContainer>
  );
};

export default CommonDialogBox;
