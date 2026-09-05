import { Transitions } from "@mui/material";

export const transitions: Transitions = {
    easing: {
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
    },
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    create: (props = "all", options = {}) => {
      const { duration = 300, easing = "easeInOut", delay = 0 } = options;
      return `${props} ${duration}ms ${easing} ${delay}ms`;
    },
    getAutoHeightDuration: (height) => {
      if (!height) return 0;
      const constant = height / 36;
      return Math.round(constant * 300);
    },
  };
