import React, { useEffect, useState } from "react";
import Drawer from "../Drawer";
import { TextField, Typography } from "@mui/material";
import ChipRenderer from "../Chip";
import {
  DISCARD,
  FEEDBACK_SUCCESS_MESSAGE,
  MeetingFeedBackForm,
  NEXT,
  SAVE,
} from "../../constants";
import Rating from "../Rating";
import {
  ButtonsContainer,
  FeedbackDrawerStyledButton,
  MeetingStyledTypography,
} from "./styles";
import { theme } from "@ui/ui-lib/styles/Theme"; // Adjust path as needed

import {
  DrawerContainer,
  DrawerContent,
  MeetingsSectionBox,
  ChipsRow,
  CustomRatingWrapper,
} from "./styles";
import { useDispatch } from "react-redux";
import { useApiMutation } from "@ui/ui-lib/hooks/useMutation";
import { setToastMessage } from "@ui/ui-lib/redux/slice";

import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { useApiQuery } from "@ui/ui-lib/hooks/useApiQuery";
import { on } from "events";
import { isCopyPasteAllowedForOrg } from "@ui/ui-lib/environment";
interface Props {
  open: boolean;
  onClose: () => void;
  meeting: Meeting | null;
  onSuccess?: () => void;
}

const MeetingFeedbackDrawer: React.FC<Props> = ({
  open,
  onClose,
  meeting,
  onSuccess,
}) => {
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [outcomes, setOutcomes] = useState<number[]>([]);
  const [challenges, setChallenges] = useState<number[]>([]);
  const [nextSteps, setNextSteps] = useState<number[]>([]);
  const [remarks, setRemarks] = useState<string>("");

  const { data: challengeData } = useApiQuery({
    url: endPoints.lookUpByName("MEETING_CHALLENGE"),
    queryKey: ["MEETING_CHALLENGE"],
  });

  const { data: nextStepOptions } = useApiQuery({
    url: endPoints.lookUpByName("MEETING_NEXT_STEP"),
    queryKey: ["MEETING_NEXT_STEP"],
  });

  const { data: outcomeOptions } = useApiQuery({
    url: endPoints.lookUpByName("MEETING_OUTCOME"),
    queryKey: ["MEETING_OUTCOME"],
  });

  const dispatch = useDispatch();
  const { mutate } = useApiMutation({
    config: {
      onSuccess: () => {
        if (onSuccess) onSuccess();
        dispatch(setToastMessage(FEEDBACK_SUCCESS_MESSAGE));
        onClose();
      },
      onError: (error: unknown) => {
        dispatch(setToastMessage(error.message));
        onClose();
      },
    },
  });

  const toggle = (
    list: number[],
    setList: React.Dispatch<React.SetStateAction<number[]>>,
    val: number
  ) => {
    if (list.includes(val)) setList(list.filter((v) => v !== val));
    else setList([...list, val]);
  };

  const handleSave = () => {
    const payload = {
      meetingRating: rating,
      meetingOutcomes: outcomes,
      meetingChallenges: challenges,
      meetingNextSteps: nextSteps,
      remarks: remarks,
    };
    mutate({
      endpoint: endPoints.updateMeeting(meeting?.id),
      method: "PUT",
      data: payload,
    });
  };

  const styleMap = {
    default: {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.neutral.dark,
    },
    primary: {
      backgroundColor: "#4098FF1A",
      color: theme.palette.neutral.dark,
    },
  };
  // Validation example for required fields (step 0)
  const isStep0Valid = rating !== null && outcomes.length > 0;

  // Handlers
  const handleCancel = () => {
    setStep(0);
    onClose();
  };

  const handleNext = () => {
    if (step === 0) {
      if (!isStep0Valid) {
        // Add your error handling here (toast, message, etc)
        return;
      }
      setStep(1);
    } else {
      // Submit logic for step 1
      // Console log the collected feedback
      handleCancel();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleCancel}
      title={<Typography variant="h1">{MeetingFeedBackForm.TITLE}</Typography>}
    >
      <DrawerContainer>
        <DrawerContent>
          {step === 0 && (
            <>
              <MeetingsSectionBox>
                <MeetingStyledTypography>
                  {MeetingFeedBackForm.HOW_WAS_THE_MEETING}
                </MeetingStyledTypography>
                <CustomRatingWrapper>
                  <Rating
                    value={rating}
                    onChange={(_, v) => setRating(v)}
                    max={5}
                    starSize={32}
                  />
                </CustomRatingWrapper>
              </MeetingsSectionBox>
              <MeetingsSectionBox>
                <MeetingStyledTypography variant="subtitle1">
                  {MeetingFeedBackForm.OUTCOMES}
                </MeetingStyledTypography>
                <ChipsRow>
                  {outcomeOptions?.data?.map((opt) => {
                    const isActive = outcomes.includes(opt.id);
                    return (
                      <ChipRenderer
                        key={opt.id}
                        value={opt.lookUpValue}
                        styleMap={{
                          [opt.lookUpValue.toLowerCase()]: isActive
                            ? styleMap.primary
                            : styleMap.default,
                        }}
                        variant="normal"
                        onClick={() => toggle(outcomes, setOutcomes, opt.id)}
                        isClickable={true}
                        bordercolor={
                          !isActive
                            ? theme.palette.neutral.light
                            : theme.palette.secondary.selected
                        }
                      />
                    );
                  })}
                </ChipsRow>
              </MeetingsSectionBox>
            </>
          )}
          {step === 1 && (
            <>
              <MeetingsSectionBox>
                <MeetingStyledTypography variant="subtitle1">
                  {MeetingFeedBackForm.CHALLENGES_FACED}
                </MeetingStyledTypography>
                <ChipsRow>
                  {challengeData?.data?.map((opt) => {
                    const isActive = challenges.includes(opt.id);
                    return (
                      <ChipRenderer
                        key={opt.id}
                        value={opt.lookUpValue}
                        styleMap={{
                          [opt.lookUpValue.toLowerCase()]: isActive
                            ? styleMap.primary
                            : styleMap.default,
                        }}
                        variant="normal"
                        onClick={() =>
                          toggle(challenges, setChallenges, opt.id)
                        }
                        isClickable={true}
                        bordercolor={
                          !isActive
                            ? theme.palette.neutral.light
                            : theme.palette.secondary.selected
                        }
                      />
                    );
                  })}
                </ChipsRow>
              </MeetingsSectionBox>
              <MeetingsSectionBox>
                <MeetingStyledTypography variant="subtitle1">
                  {MeetingFeedBackForm.NEXT_STEPS}
                </MeetingStyledTypography>
                <ChipsRow>
                  {nextStepOptions?.data?.map((opt) => {
                    const isActive = nextSteps.includes(opt.id);
                    return (
                      <ChipRenderer
                        key={opt.id}
                        value={opt.lookUpValue}
                        styleMap={{
                          [opt.lookUpValue.toLowerCase()]: isActive
                            ? styleMap.primary
                            : styleMap.default,
                        }}
                        variant="normal"
                        onClick={() => toggle(nextSteps, setNextSteps, opt.id)}
                        isClickable={true}
                        bordercolor={
                          !isActive
                            ? theme.palette.neutral.light
                            : theme.palette.secondary.selected
                        }
                      />
                    );
                  })}
                </ChipsRow>
              </MeetingsSectionBox>
              <MeetingsSectionBox>
                <MeetingStyledTypography variant="subtitle1">
                  {MeetingFeedBackForm.REMARKS}
                </MeetingStyledTypography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Enter here..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  onPaste={(e) => {
                    if (!isCopyPasteAllowedForOrg()) {
                      e.preventDefault();
                    }
                  }}
                />
              </MeetingsSectionBox>
            </>
          )}
        </DrawerContent>
        <ButtonsContainer>
          {step === 0 ? (
            <>
              <FeedbackDrawerStyledButton
                variantType="secondary"
                onClick={handleCancel}
                className="button"
                data-testid="cancel-button"
              >
                {DISCARD}
              </FeedbackDrawerStyledButton>
              <FeedbackDrawerStyledButton
                variantType="primary"
                onClick={handleNext}
                className="button"
                disabled={!isStep0Valid}
              >
                {NEXT}
              </FeedbackDrawerStyledButton>
            </>
          ) : (
            <>
              <FeedbackDrawerStyledButton
                variantType="secondary"
                onClick={() => setStep(0)}
                className="button"
              >
                Back
              </FeedbackDrawerStyledButton>
              <FeedbackDrawerStyledButton
                variantType="primary"
                className="button"
                onClick={handleSave}
              >
                {SAVE}
              </FeedbackDrawerStyledButton>
            </>
          )}
        </ButtonsContainer>
      </DrawerContainer>
    </Drawer>
  );
};

export default MeetingFeedbackDrawer;
