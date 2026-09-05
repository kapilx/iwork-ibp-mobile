import { StateEnum } from "./RenderComponent";

export type StepItem = {
  key: string;
  label: string;
  componentKey?: "checkbox" | "text" | "dot" | "primary";
  color?: string;
  config?: any;
  stepState: StateEnum;
};

export type Step = {
  key: string;
  title: string;
  componentKey?: string;
  config?: any;
  items?: StepItem[];
  stepState?: StateEnum;
};
