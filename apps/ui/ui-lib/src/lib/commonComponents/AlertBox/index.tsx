import React from "react";
import {
  AlertContainer,
  IconWrapper,
  ContentWrapper,
  TitleText,
  MessageText,
} from "./styles";
import AlertIcon from "../../assets/svgs/request-warning-icon.svg";

interface RequestAlertProps {
  message: string;
  title: string;
}

const RequestAlert: React.FC<RequestAlertProps> = ({
  message,
  title = "Request rejected",
}) => {
  return (
    <AlertContainer>
      <IconWrapper>
        <img src={AlertIcon} alt="Alert Icon" />
        <TitleText>{title}</TitleText>
      </IconWrapper>
      <ContentWrapper>
        <MessageText>{message}</MessageText>
      </ContentWrapper>
    </AlertContainer>
  );
};

export default RequestAlert;
