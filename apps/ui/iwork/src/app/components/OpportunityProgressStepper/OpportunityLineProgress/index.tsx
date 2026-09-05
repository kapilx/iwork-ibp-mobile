import { DATE_FORMATS, formatDate } from "@ui/ui-lib";
import { COMPLETED } from "../../../constants/index.js";
import {
  ProgressBarContainer,
  DateField,
  Progress,
  ProgressCompleted,
  ProgressPercentage,
} from "./styles.js";

interface ProgressBarProps {
  startDate: string;
  endDate: string;
  progress: number;
}

const ProgressBar = (props: ProgressBarProps) => {
  return (
    <ProgressBarContainer data-testid="progress-bar">
      <DateField>
        {formatDate(props.startDate, DATE_FORMATS.DATE_MONTH_YEAR)}
      </DateField>
      <Progress>
        <ProgressCompleted progress={props.progress} completed={true} />
        <ProgressPercentage>
          {props.progress}% {COMPLETED}
        </ProgressPercentage>
        <ProgressCompleted progress={props.progress} completed={false} />
      </Progress>

      <DateField>
        {formatDate(props.endDate, DATE_FORMATS.DATE_MONTH_YEAR)}
      </DateField>
    </ProgressBarContainer>
  );
};

export default ProgressBar;
