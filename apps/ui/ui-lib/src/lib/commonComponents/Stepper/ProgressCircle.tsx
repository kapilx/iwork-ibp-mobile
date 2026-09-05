import React from "react";
import {
  CircularProgressStyles,
  ProgressTypography,
  ProgressWrapper,
} from "./styles";
import { ProgressCircleProps } from "./types";

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  progress,
  size = 78,
}) => {
  const backgroundColor = [
    "rgba(255, 188, 5, 1)",
    "rgba(255, 172, 5, 1)",
    "rgba(67, 198, 2, 1)",
    "rgba(67, 198, 2, 1)",
    "rgba(67, 198, 2, 1)",
  ];

  // Get appropriate gradient based on progress
  const getBgColorByProgress = (progress: number): string => {
    if (progress < 20) return backgroundColor[0];
    if (progress < 40) return backgroundColor[1];
    if (progress < 60) return backgroundColor[2];
    if (progress < 80) return backgroundColor[3];
    return backgroundColor[4]; // For progress >= 80
  };

  const currentBackgroundColor = getBgColorByProgress(progress);

  return (
    <ProgressWrapper data-testid="progress-wrapper">
      <CircularProgressStyles
        variant="determinate"
        value={progress}
        size={size}
        thickness={2}
        backgroundColor={currentBackgroundColor}
        data-testid="circular-progress"
      />
      <ProgressTypography
        variant="body2"
        variantMapping={{ body2: "div" }}
        data-testid="progress-text"
      >
        {`${Math.round(progress)}%`}
      </ProgressTypography>
    </ProgressWrapper>
  );
};
