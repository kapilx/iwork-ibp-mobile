import React from "react";
import {
  ButtonContainer,
  NotFoundContainer,
  NotFoundMainContainer,
  NotFoundText,
} from "./styles";
import { BACK, DASHBOARD, NO_DATA_FOUND } from "../../constants";
import CommonButton from "../Button";
import { useNavigate } from "react-router-dom";
import NotFoundImg from "../../assets/svgs/not-found.svg";

export interface NotFoundProps {
  onBack: () => void;
}

const NotFound: React.FC<NotFoundProps> = ({ onBack }) => {
  const navigate = useNavigate();
  return (
    <NotFoundContainer>
      <NotFoundMainContainer>
        <img src={NotFoundImg} alt="Not Found" />
        <NotFoundText>{NO_DATA_FOUND}</NotFoundText>
      </NotFoundMainContainer>
      <ButtonContainer>
        <CommonButton
          variant="outlined"
          buttonType="primary"
          label={BACK}
          onClick={onBack}
        />
        <CommonButton
          variant="outlined"
          buttonType="primary"
          label={DASHBOARD}
          onClick={() => navigate("/")}
        />
      </ButtonContainer>
    </NotFoundContainer>
  );
};

export default NotFound;
