-- Dashboard Business & Claims overview verification script
-- Replace the placeholders below before running the script against the production database.
-- :user_ids       -> comma separated list of scoped creator user IDs (e.g., 101,102)
-- :policy_to_from -> optional lower bound for policy.policy_to (DATE, can be NULL)
-- :policy_to_to   -> optional upper bound for policy.policy_to (DATE, can be NULL)

WITH scoped_policies AS (
  SELECT
    p.id AS policy_id,
    p.company_id,
    p.net_premium_amount,
    p.brokerage_amount
  FROM policy p
  WHERE p.created_by IN (:user_ids)
    AND p.policy_to >= CURRENT_DATE
    AND (:policy_to_from IS NULL OR p.policy_to >= :policy_to_from)
    AND (:policy_to_to IS NULL OR p.policy_to <= :policy_to_to)
)
SELECT
  COUNT(DISTINCT company_id) AS total_company_count,
  COUNT(policy_id)          AS total_policy_count,
  COALESCE(SUM(net_premium_amount), 0)   AS total_companies_premium,
  COALESCE(SUM(brokerage_amount), 0)     AS total_companies_brokerage
FROM scoped_policies;

-- Claims overview for the same scoped policy set
SELECT
  COUNT(claim.id)                 AS total_claims_count,
  COALESCE(SUM(claim.claim_amount), 0) AS total_claim_amount,
  COUNT(DISTINCT claim.policy_id) AS policies_with_claims_count,
  COUNT(DISTINCT sp.company_id)   AS companies_with_claims_count
FROM policy_employee_claim claim
INNER JOIN scoped_policies sp ON sp.policy_id = claim.policy_id
WHERE claim.created_by IN (:user_ids);
