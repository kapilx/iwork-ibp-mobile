import EnrollmentIcon from "../../../assets/svgs/enrollment-nav-icon.svg";
import { useNavigate } from "react-router-dom";
import CommonButton from "../../../common/Button";
import { ENROLLMENT_CONFIRMATION } from "../../../constants";
import {
  Container,
  Icon,
  Title,
  TitleWrapper,
} from "./styles";

const ConfirmationPage = () => {
  const navigate = useNavigate();
  return (
    <Container data-testid="confirmation-page-container">
      <TitleWrapper>
        <Icon>
          <img src={EnrollmentIcon} alt="enrollment icon" />
        </Icon>
        <Title>{ENROLLMENT_CONFIRMATION.TITLE}</Title>
      </TitleWrapper>
      {/* <FeaturesTitle>{ENROLLMENT_CONFIRMATION.FEATURES_TITLE}</FeaturesTitle>
      <FeaturesGrid>
        {ENROLLMENT_CONFIRMATION.FEATURES.map((feature) => (
          <FeatureCard
            key={feature.id}
            data-testid={`feature-card-${feature.id}`}
          >
            <Description>{feature.title}</Description>
          </FeatureCard>
        ))}
      </FeaturesGrid> */}
      <CommonButton
        label={ENROLLMENT_CONFIRMATION.BUTTON}
        variant="outlined"
        buttonType="primary"
        width="160px"
        bgcolor="transparent"
        onClick={() => navigate("/dashboard")}
      />
    </Container>
  );
};

export default ConfirmationPage;
