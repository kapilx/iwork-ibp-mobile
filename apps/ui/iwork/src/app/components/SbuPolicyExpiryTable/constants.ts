export enum PolicyExpiryBucketLabel {
  NEXT_30_DAYS = "30 Days",
  NEXT_60_DAYS = "60 Days",
  NEXT_90_DAYS = "90 Days",
  BEYOND_90_DAYS = "Beyond 90 Days",
}

export const POLICY_EXPIRY_BUCKET_LABELS: PolicyExpiryBucketLabel[] = [
  PolicyExpiryBucketLabel.NEXT_30_DAYS,
  PolicyExpiryBucketLabel.NEXT_60_DAYS,
  PolicyExpiryBucketLabel.NEXT_90_DAYS,
  PolicyExpiryBucketLabel.BEYOND_90_DAYS,
];

export const SBU_TABLE_PAGE_SIZE_OPTIONS = [5, 10, 20];
export const SBU_TABLE_MIN_HEIGHT = 200;
export const SBU_TABLE_ROW_HEIGHT = 42;
export const SBU_TABLE_BASE_HEIGHT = 100;
