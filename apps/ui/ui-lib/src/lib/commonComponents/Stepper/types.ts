export interface Step {
  id: string | number;
  label: string;
  status: "default" | "active" | "complete" | "incomplete";
  message?: string;
}

export interface ProgressWizardProps {
  steps: Step[];
  activeStep: number;
  completedSteps: number[];
  gradient?: string;
  onStepChange?: (stepIndex: number) => void;
  totalFields: number;
  fieldsFilled: number;
}

export interface MessageBoxProps {
  message: string;
  onClose?: () => void;
}

export interface ProgressCircleProps {
  progress: number;
  size?: number;
}

export interface StepConnectorProps {
  completed: boolean;
  index: number;
}

export interface StepItemProps {
  label: string;
  index: number;
  status: "default" | "active" | "complete" | "incomplete";
  onClick?: () => void;
  validateStep: (stepIndex: number) => boolean;
}

export type StepStatusType = "complete" | "incomplete" | "default" | "active";

export enum StepStatus {
  COMPLETE = "complete",
  INCOMPLETE = "incomplete",
  DEFAULT = "default",
  ACTIVE = "active",
}
