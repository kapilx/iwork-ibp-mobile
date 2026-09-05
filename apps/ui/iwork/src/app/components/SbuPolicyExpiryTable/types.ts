export interface PolicyExpiryBySbuRow {
  sbuId: number;
  sbuName: string;
  policyExpiryTimeline: { label: string; count: number }[];
}

export type PolicyExpiryTableRow = {
  sbuId: number;
  sbuName: string;
  [bucket: string]: string | number;
};
