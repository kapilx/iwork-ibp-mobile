import React from "react";
import messageBg from "../../assets/svgs/message-bg.svg";
import MessageBoxImg from "../../assets/svgs/message-box-img.svg";
import CrossIcon from "../../assets/svgs/cross-icon.svg";
import {
  StepperCloseButton,
  IconContainer,
  MessageBoxContainer,
  MessageBoxText,
  StyledImgBg,
} from "./styles";
import { MessageBoxProps } from "./types";
export const MessageBox: React.FC<MessageBoxProps> = ({ message, onClose }) => {
  return (
    <MessageBoxContainer data-testid="message-box-container">
      <StyledImgBg src={messageBg} alt="Mail" />
      <IconContainer>
        <img src={MessageBoxImg} alt="Info" />
      </IconContainer>
      <MessageBoxText variant="body2" data-testid="message-text">
        {message}
      </MessageBoxText>
      {onClose && (
        <StepperCloseButton onClick={onClose} aria-label="Close message">
          <img
            src={CrossIcon}
            alt="cross"
            style={{ backgroundColor: "transparent" }}
          />
        </StepperCloseButton>
      )}
    </MessageBoxContainer>
  );
};
