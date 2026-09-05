import { useState } from "react";
import { Tooltip } from "@mui/material";
import { ThumbUp, ThumbDown } from "@mui/icons-material";
import { FeedbackContainer, FeedbackButton } from "./styles";

export interface FeedbackComponentProps {
  messageId: string;
  onFeedback?: (messageId: string, feedback: "positive" | "negative") => void;
  initialFeedback?: "positive" | "negative" | null;
}

const FeedbackComponent = ({
  messageId,
  onFeedback,
  initialFeedback = null,
}: FeedbackComponentProps) => {
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(
    initialFeedback
  );

  const handleFeedback = (feedbackType: "positive" | "negative") => {
    const newFeedback = feedback === feedbackType ? null : feedbackType;
    setFeedback(newFeedback);
    if (newFeedback !== null) {
      onFeedback?.(messageId, newFeedback);
    }
  };

  return (
    <FeedbackContainer>
      <Tooltip title="Helpful" arrow>
        <FeedbackButton
          onClick={() => handleFeedback("positive")}
          isActive={feedback === "positive"}
          feedbackType="positive"
          size="small"
        >
          <ThumbUp fontSize="small" />
        </FeedbackButton>
      </Tooltip>
      <Tooltip title="Not helpful" arrow>
        <FeedbackButton
          onClick={() => handleFeedback("negative")}
          isActive={feedback === "negative"}
          feedbackType="negative"
          size="small"
        >
          <ThumbDown fontSize="small" />
        </FeedbackButton>
      </Tooltip>
    </FeedbackContainer>
  );
};

export default FeedbackComponent;
