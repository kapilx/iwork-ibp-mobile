import React from "react";
// import leadCrmImage from "../../../app/assets/svgs/workin-progress.svg";
import leadCrmImage from "../../assets/svgs/workin-progress.svg";
import { WORK_IN_PROGRESS } from "../../constants";
import {
  WorkInProgressContainer,
  WorkInProgressImage,
  WorkInProgressText,
  WorkInProgressTitle,
} from "./styles";

interface WorkInProgressProps {
  customStyles?: React.CSSProperties;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

const WorkInProgress: React.FC<WorkInProgressProps> = ({
  customStyles,
  title = WORK_IN_PROGRESS.TITLE,
  description = WORK_IN_PROGRESS.DESCRIPTION,
}) => {
  const hasTitle = title !== undefined && title !== null;
  const hasDescription = description !== undefined && description !== null;

  return (
    <WorkInProgressContainer customStyles={customStyles}>
      <WorkInProgressImage
        src={leadCrmImage}
        alt={WORK_IN_PROGRESS.IMAGE_ALT}
      />
      {hasTitle && (
        <WorkInProgressTitle variant="h1">{title}</WorkInProgressTitle>
      )}
      {hasDescription && <WorkInProgressText>{description}</WorkInProgressText>}
    </WorkInProgressContainer>
  );
};

export default WorkInProgress;
