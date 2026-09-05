import {
  Button,
  ChipRenderer,
  colors,
  endPoints,
  HTTP_METHODS,
  setToastMessage,
  useApiMutation,
} from "@ui/ui-lib";
import React, { useEffect } from "react";
import {
  ClaimIdContainer,
  ClaimIdLabel,
  ClaimIdValue,
  ContentContainer,
  FooterContainer,
  HeaderContainer,
  HolderContainer,
  MainContainer,
  RightButtonContainer,
  RightHeaderContainer,
  SubtitleTypography,
  TitleTypography,
} from "./styles";
import { ALERT_MESSAGES } from "../../constants";
import { useDispatch } from "react-redux";

const chipStyleMap = {
  current: {
    backgroundColor: colors.background.lightBlueActive,
    color: colors.text.grey,
  },
  pending: {
    backgroundColor: colors.gradients.orange.end,
    color: colors.gradients.orange.text,
  },
  completed: {
    backgroundColor: colors.gradients.teal.end,
    color: colors.gradients.teal.text,
  },
};

type WrapperButtonProps =
  | (React.ComponentProps<typeof Button> & { shouldHide?: boolean })
  | undefined;

export interface EndorsementProcessWrapperProps {
  title: string;
  stepNumber: number;
  totalSteps: number;
  status: string;
  claimId?: string | number;
  children?: React.ReactNode;
  backButtonProps?: React.ComponentProps<typeof Button>;
  sendButtonProps?: WrapperButtonProps;
  nextButtonProps?: React.ComponentProps<typeof Button>;
  nextButtonLabel?: string;
}

const EndorsementProcessWrapper: React.FC<EndorsementProcessWrapperProps> = ({
  title,
  stepNumber,
  totalSteps,
  status,
  claimId,
  backButtonProps,
  sendButtonProps,
  nextButtonProps,
  nextButtonLabel = "Next",
  children,
}) => {
  return (
    <MainContainer>
      <HeaderContainer>
        <HolderContainer>
          <TitleTypography>{title}</TitleTypography>
          <SubtitleTypography>{`Step ${stepNumber} of ${totalSteps}`}</SubtitleTypography>
        </HolderContainer>
        <RightHeaderContainer>
          {claimId && (
            <ClaimIdContainer>
              <ClaimIdLabel>Claim Id:</ClaimIdLabel>
              <ClaimIdValue>{claimId}</ClaimIdValue>
            </ClaimIdContainer>
          )}
          <ChipRenderer
            value={status}
            styleMap={chipStyleMap}
            size="medium"
            variant="variable"
            padding="0px 5px 0px 0px"
          />
        </RightHeaderContainer>
      </HeaderContainer>
      <ContentContainer>{children}</ContentContainer>
      <FooterContainer>
        <Button
          variantType="secondary"
          sizeType="small"
          label="Previous"
          {...backButtonProps}
        />
        <RightButtonContainer>
          {!sendButtonProps?.shouldHide && (
            <Button
              variantType="primary"
              sizeType="small"
              {...sendButtonProps}
            />
          )}
          <Button
            variantType="primary"
            sizeType="small"
            label={nextButtonLabel}
            {...nextButtonProps}
          />
        </RightButtonContainer>
      </FooterContainer>
    </MainContainer>
  );
};

export default EndorsementProcessWrapper;
