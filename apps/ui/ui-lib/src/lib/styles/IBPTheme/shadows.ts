// shadows.ts

export type MUIShadows = [
  "none",
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
];

const baseShadows = [
  "none",
  "0px 1px 3px rgba(0,0,0,0.1)",
  "0px 2px 4px rgba(0,0,0,0.1)",
  "0px 0px 8px 0px #007DD866",
  "0px 0px 8px 0px #16202E40",
  " -2px 5px 12px 0px #00000057",
  "0px 4px 16px rgba(0, 0, 0, 0.05)",
  "0px 0px 4px 0px #00000033",
  "0px 0px 4px 0px rgba(0, 0, 0, 0.2)",
  "0px 4px 10px rgba(0, 0, 0, 0.1)",
  "0px 2px 8px rgba(0, 0, 0, 0.08)",
  "2px 2px 8px 0px rgba(0, 0, 0, 0.15)",
  "0px 0px 15px 0px #00000026",
  "0px 0px 4px 0px #00000030",
  "2px 10px 10px 0px #FF71040D",
  "0px 0px 14px 0px #00000040",
  "0px 16px 24px 0px rgba(255, 78, 0, 0.1)",
  "0px 16px 24px 0px #FF4E001A",
  "0px -8px 24px 0px #FFE1CE",
] as ["none", ...string[]];

const shadows = [
  ...baseShadows,
  ...Array(25 - baseShadows.length).fill("none"),
] as MUIShadows;

export default shadows;
