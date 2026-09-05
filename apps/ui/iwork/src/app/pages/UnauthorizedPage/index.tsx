import {
  UnauthorizedContainer,
  UnauthorizedImage,
  UnauthorizedTitle,
  UnauthorizedText,
} from "./styles";
import { UNAUTHORIZED_PAGE } from "../../constants";
import unauthorizedImage from "../../../app/assets/svgs/workin-progress.svg";

const Unauthorized = () => {
  return (
    <UnauthorizedContainer data-testid="unauthorized-container">
      <UnauthorizedImage
        src={unauthorizedImage}
        alt={UNAUTHORIZED_PAGE.IMAGE_ALT}
        data-testid="unauthorized-image"
      />
      <UnauthorizedTitle variant="h1" data-testid="unauthorized-title">
        {UNAUTHORIZED_PAGE.TITLE}
      </UnauthorizedTitle>
      <UnauthorizedText data-testid="unauthorized-text">{UNAUTHORIZED_PAGE.DESCRIPTION}</UnauthorizedText>
    </UnauthorizedContainer>
  );
};

export default Unauthorized;
