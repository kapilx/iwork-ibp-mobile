import InsuranceBanner from "../../components/WelllnessBenefitSection/WellnessBanner";
import BenefitsAccordion from "../../components/WelllnessBenefitSection/BenefitsAccordion";

import { MyInsuranceContainer } from "./styles";

function MyInsurance() {
  return (
    <MyInsuranceContainer>
      <InsuranceBanner />
      <BenefitsAccordion />
    </MyInsuranceContainer>
  );
}

export default MyInsurance;
