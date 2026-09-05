import React from "react";
import {
  PolicyContainer,
  PolicyHeaderWrapper,
  PolicyHeading,
  PolicyTextBlock,
  PolicySubtext,
  PolicyList,
  PolicyListItem,
  PolicyImageWrapper,
  LinesImage,
  PolicyImage,
  DogImage,
  DogOverlayImage,
  PolicyMainHeading,
  EnrollSection,
  EndTime,
  Icon,
  EndTimeText,
  DividerLine,
} from "./styles";

import lines from "../../../assets/svgs/lines-image.svg";
import groupFamily from "../../assets/pngs/group-family.png";
import calenderIcon from "../../assets/svgs/calender-icon.svg";

import {
  GROUP,
  MEDICAL_COVER,
  NO_POLICIES_FOUND,
  POLICY_TYPE_MAPPING,
} from "../../constants";
import { useNavigate } from "react-router-dom";
import CommonButton from "../../common/Button";
import { ibpTheme as theme } from "@ui/ui-lib";
import dayjs from "dayjs";
import {
  EnrollmentBottomSection,
  policyKeys,
} from "../WelllnessBenefitSection/constants";
import { useSelector } from "react-redux";
import {
  flattenPoliciesWithStatus,
  getEnrollmentButtonLabel,
  PolicyStatus,
} from "../../utils/flattenPolicies";

interface MedicalCoverProps {
  userName?: string;
  onEnroll?: () => void;
  policiesData: any;
  content?: {
    headerTitle: string;
    headerSubtitle: string;
    headerPrefix: string;
    benefitItems: string[];
    buttonLabel: string;
    buttonEditLabel: string;
    buttonViewLabel: string;
    buttonText: string;
  };
}

const MedicalCover: React.FC<MedicalCoverProps> = ({
  userName = "User",
  onEnroll,
  policiesData,
  content,
}) => {
  const navigate = useNavigate();
  // Sort employeePolicies so that GMC comes first, then GPA, then GTL
  const policyOrder = [policyKeys.GMC, policyKeys.GPA, policyKeys.GTL];
  const hasEmployeePolicies = (policiesData?.employeePolicies?.length ?? 0) > 0;
  const hasEditableEnrolledPolicies = (
    policiesData?.enrolledPolicies ?? []
  ).some((policy: { isEditable?: boolean }) => policy.isEditable);

  const policiesReduxData = useSelector(
    (state: any) => state.policyData.policiesData
  );

  const flattenedPolicies = flattenPoliciesWithStatus(policiesReduxData);

  const isAllPoliciesLocked = flattenedPolicies.every(
    (policy) => policy.status === PolicyStatus.LOCKED
  );

  const handleEnrollClick = () => {
    if (isAllPoliciesLocked) {
      navigate("/unified-summary");
    } else {
      navigate("/unified-enrollment");
    }
  };

  const defaultButtonLabel = isAllPoliciesLocked
    ? MEDICAL_COVER.BUTTON.VIEW_LABEL
    : getEnrollmentButtonLabel(flattenedPolicies);
  const buttonLabel = content?.buttonLabel ?? defaultButtonLabel;

  const modifiedPoliciesData = flattenedPolicies.filter(
    (policy) =>
      policy.status === PolicyStatus.CAN_ENROLL ||
      policy.status === PolicyStatus.EDIT_ENROLL
  );

  const futureDate = dayjs().add(10, "day").format("D MMM YYYY");
  const endTimeText = content?.buttonText
    ? content.buttonText
    : `Closes by ${futureDate}`;

  const handleViewUnifiedSummary = () => {
    navigate("/unified-summary");
  };

  const isEnrolledPolicyAvailable = flattenedPolicies.some(
    (policy) =>
      policy.status === PolicyStatus.LOCKED ||
      policy.status === PolicyStatus.EDIT_ENROLL
  );

  return (
    <>
      <PolicyHeaderWrapper>
        {/* <PolicyMainHeading>
          {MEDICAL_COVER.HEADER.ENROLL_MESSAGE(userName)}
        </PolicyMainHeading> */}
      </PolicyHeaderWrapper>
      <PolicyContainer>
        <PolicyTextBlock data-testid="ibp-medical-cover-card">
          <PolicyHeading>
            {content?.headerPrefix ?? MEDICAL_COVER.HEADER.PREFIX}
            {modifiedPoliciesData?.length > 0
              ? GROUP +
                modifiedPoliciesData?.map(
                  (policy: { policyId: number; policyName: string }) => {
                    return (
                      " " +
                      POLICY_TYPE_MAPPING[
                        policy?.policyName as keyof typeof POLICY_TYPE_MAPPING
                      ]
                    );
                  }
                )
              : NO_POLICIES_FOUND}
          </PolicyHeading>
          <PolicySubtext>
            {content?.headerSubtitle ?? MEDICAL_COVER.HEADER.SUBTITLE}
          </PolicySubtext>
          <LinesImage src={lines} alt="Decorative lines" aria-hidden="true" />

          <PolicyList>
            {(content?.benefitItems?.length
              ? content.benefitItems
              : MEDICAL_COVER.POLICY_BENEFITS.map((benefit) => benefit.text)
            ).map((benefit, index) => (
              <PolicyListItem key={`${benefit}-${index}`}>
                {benefit}
              </PolicyListItem>
            ))}
          </PolicyList>
          <EnrollSection>
            <CommonButton
              label={buttonLabel}
              variant="outlined"
              buttonType="primary"
              bgcolor={theme.palette.text.Deeporange}
              color={theme.palette.background.paper}
              onClick={handleEnrollClick}
            />
            {isEnrolledPolicyAvailable && (
              <CommonButton
                variant="outlined"
                buttonType="primary"
                label={EnrollmentBottomSection.PrimaryButtonText}
                fullWidth={true}
                color={theme.palette.text.Deeporange}
                bgcolor="transparent"
                width={"274px"}
                onClick={handleViewUnifiedSummary}
                border={`1px solid ${theme.palette.text.Deeporange}`}
              />
            )}
            <DividerLine orientation="vertical" flexItem />
            <EndTime>
              <Icon src={calenderIcon} alt="calender icon" />
              <EndTimeText>{endTimeText}</EndTimeText>
            </EndTime>
          </EnrollSection>
          {/* <DogOverlayImage src={dog} alt="Decorative dog" aria-hidden="true" /> */}
        </PolicyTextBlock>

        <PolicyImageWrapper>
          <PolicyImage src={groupFamily} alt="Family illustration" />
        </PolicyImageWrapper>
      </PolicyContainer>
    </>
  );
};

export default MedicalCover;
