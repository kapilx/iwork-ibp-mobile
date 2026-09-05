import { Box, Typography } from "@mui/material";
import { quickActions } from "./quickLinksConfig";
import {
  Wrapper,
  Grid,
  GridItem,
  Number,
  Label,
  TitleRow,
  ContentRow,
} from "./styles";
import quickActionsIcon from "../../../assets/svgs/quick-actions.svg";
import {
  INCEPTION_LABEL,
  INCEPTION_RESTRICTION_MESSAGE_FROM_CLAIM,
  NON_GROUP_INCEPTION_LABEL,
  POLICY_DASHBOARD,
} from "../../../constants";
import { CustomModal } from "@ui/ui-lib";
import { useState } from "react";

interface Props {
  onEmpClick: () => void;
  onEndorsementClick: () => void;
  onCDBalanceClick: () => void;
  isInceptionCompleted: boolean;
  inceptionId: number | null | undefined;
  onClaimClick: () => void;
  isGroupPolicyType: boolean;
}

const QuickActions = ({
  onEmpClick,
  onEndorsementClick,
  onCDBalanceClick,
  isInceptionCompleted,
  inceptionId,
  onClaimClick,
  isGroupPolicyType,
}: Props) => {
  const [modalType, setModalType] = useState<'claim' | null>(null);

  const handleCloseModal = () => {
    setModalType(null);
  };

  const handleClick = (key: string) => {
    if (key === "employee") {
      onEmpClick();
    } else if (key === "endorsement") {
      onEndorsementClick();
    } else if (key === "cd_balance") {
      onCDBalanceClick();
    } else if (key === "claim") {
      if (!isInceptionCompleted) {
        setModalType('claim');
        return;
      }
      onClaimClick();
    }
  };

  function getInceptionLabel(
    inceptionId: number | null | undefined,
    isInceptionCompleted: boolean
  ) {
    if (!inceptionId || inceptionId === undefined) {
      return isGroupPolicyType
        ? INCEPTION_LABEL.INCEPTION_DATA_UPLOAD
        : NON_GROUP_INCEPTION_LABEL.INCEPTION_DATA_UPLOAD;
    }
    if (!isInceptionCompleted) {
      return isGroupPolicyType
        ? INCEPTION_LABEL.COMPLETE_INCEPTION
        : NON_GROUP_INCEPTION_LABEL.COMPLETE_INCEPTION;
    }
    return isGroupPolicyType
      ? INCEPTION_LABEL.VIEW_INCEPTION
      : NON_GROUP_INCEPTION_LABEL.VIEW_INCEPTION;
  }

  const inceptionLabel = getInceptionLabel(inceptionId, isInceptionCompleted);

  return (
    <Wrapper>
      <TitleRow>
        <img src={quickActionsIcon} alt="Attention" />
        <Typography
          variant="subtitle1"
          fontWeight={600}
          data-testid="section-title"
        >
          {POLICY_DASHBOARD.QUICK_ACTIONS}
        </Typography>
      </TitleRow>
      <Grid>
        {quickActions(inceptionLabel, isGroupPolicyType)?.map(
          ({ id, icon, label, actionKey }) => (
            <GridItem
              key={id}
              component="button"
              onClick={() => handleClick(actionKey)}
              // disabled={actionKey === "claim"}
            >
              <Number>{id}</Number>
              <ContentRow>
                <img src={icon} alt={label} />
                <Label>{label}</Label>
              </ContentRow>
            </GridItem>
          )
        )}
      </Grid>
      <CustomModal
        open={modalType !== null}
        handleClose={handleCloseModal}
        heading="Alert"
        buttons={[
          {
            label: "OK",
            onClick: handleCloseModal,
            variant: "primary",
          },
        ]}
      >
        <div>
          {modalType === 'claim' ? INCEPTION_RESTRICTION_MESSAGE_FROM_CLAIM : ''}
        </div>
      </CustomModal>
    </Wrapper>
  );
};

export default QuickActions;
