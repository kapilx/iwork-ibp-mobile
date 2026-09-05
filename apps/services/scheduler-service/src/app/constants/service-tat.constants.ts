export const SERVICE_TAT_CRON_EXPRESSION = "*/2 * * * *"; // Every 5 minutes UTC

export const SERVICE_TAT_LOG_CONTEXT = {
  SCHEDULER: "ServiceTatScheduler",
  AGGREGATION: "ServiceTatAggregationService",
};

export const MS_IN_DAY = 24 * 60 * 60 * 1000;

export const HEALTH_POLICY_TYPE_LOOKUP_VALUES: ReadonlySet<string> = new Set(
  [
    "Group Mediclaim Policy",
    "Group Personal Accident Policy",
    "Group Term Life Insurance (GTL)",
  ].map((value) => value.toLowerCase())
);
