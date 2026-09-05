export enum TatSectionKey {
  ENDORSEMENTS = "endorsements",
  CLAIMS = "claims",
}

export interface TatSbuRow {
  sbuId: number;
  sbuName: string;
  sourceSbuIds?: number[];
  totalCount: number;
  buckets: number[];
}

export interface TatSbuSection {
  bucketLabels: string[];
  rows: TatSbuRow[];
}

export interface TatSummaryBySbuData {
  endorsements: TatSbuSection;
  claims: TatSbuSection;
}

export type SbuTableRow = {
  sbuId: number;
  sbuName: string;
  total: number;
  [bucket: string]: string | number;
};
