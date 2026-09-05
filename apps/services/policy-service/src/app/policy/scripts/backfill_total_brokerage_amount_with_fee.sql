-- =====================================================================
-- BACKFILL: brokerage now includes fee (and terrorism)
--
-- New definition, used everywhere in the app:
--     brokerage = basic + SRCC + terrorism + fee
--
-- Terrorism sits in two columns, so pick ONE, never both:
--     tc_brokerage_amount   -> what the app writes today. Use it when set.
--     commission_terrorism  -> old rows only. Its write path now stores a
--                              PERCENTAGE, so only trust it as an amount when
--                              it differs from terrorism_brokerage_percentage.
--
-- Run the steps in order. Every UPDATE recalculates from scratch, so running
-- this file twice gives the same answer (it never adds fee on top of fee).
-- =====================================================================


-- ---------------------------------------------------------------------
-- STEP 1 - add the column that does not exist yet
-- ---------------------------------------------------------------------
ALTER TABLE public.endorsement
    ADD COLUMN IF NOT EXISTS total_brokerage_amount numeric(19,2) DEFAULT 0;


-- ---------------------------------------------------------------------
-- STEP 2 - take a backup of every value we are about to change
--          (drop these tables once the new numbers are approved)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bkp_policy_total_brokerage AS
SELECT id, total_brokerage_amount FROM public.policy;

CREATE TABLE IF NOT EXISTS public.bkp_endorsement_total_brokerage AS
SELECT id, total_brokerage_amount FROM public.endorsement;

CREATE TABLE IF NOT EXISTS public.bkp_opportunity_estimated_brokerage AS
SELECT opportunity_id, estimated_brokerage FROM public.opportunity;


-- ---------------------------------------------------------------------
-- STEP 3 - POLICY: total_brokerage_amount = basic + SRCC + terrorism + fee
-- ---------------------------------------------------------------------
UPDATE public.policy
SET total_brokerage_amount =
      COALESCE(basic_brokerage_amount, 0)
    + COALESCE(srcc_brokerage_amount, 0)
    + COALESCE(NULLIF(tc_brokerage_amount, 0),
               CASE WHEN commission_terrorism IS DISTINCT FROM terrorism_brokerage_percentage
                    THEN commission_terrorism END, 0)
    + COALESCE(fee_amount, 0);


-- ---------------------------------------------------------------------
-- STEP 4 - ENDORSEMENT: same formula
--          (terrorism column here is commission_terrorism_amount)
-- ---------------------------------------------------------------------
UPDATE public.endorsement
SET total_brokerage_amount =
      COALESCE(basic_brokerage_amount, 0)
    + COALESCE(srcc_brokerage_amount, 0)
    + COALESCE(NULLIF(tc_brokerage_amount, 0),
               CASE WHEN commission_terrorism_amount IS DISTINCT FROM terrorism_brokerage_percentage
                    THEN commission_terrorism_amount END, 0)
    + COALESCE(fee_amount, 0);


-- ---------------------------------------------------------------------
-- STEP 5 - RENEWAL OPPORTUNITIES: estimated_brokerage
--          = its policy's brokerage + that policy's endorsements' brokerage
--
--          Same thing ro-creation.utils.ts now writes for new ROs, so old and
--          new ROs report the same way.
--          Note: policy_asset_endorsement has no SRCC/TC columns.
-- ---------------------------------------------------------------------
WITH endorsement_brokerage AS (
    SELECT policy_id,
           SUM(  COALESCE(basic_brokerage_amount, 0)
               + COALESCE(srcc_brokerage_amount, 0)
               + COALESCE(NULLIF(tc_brokerage_amount, 0),
                          CASE WHEN commission_terrorism_amount IS DISTINCT FROM terrorism_brokerage_percentage
                               THEN commission_terrorism_amount END, 0)
               + COALESCE(fee_amount, 0)) AS total
    FROM public.endorsement
    GROUP BY policy_id

    UNION ALL

    SELECT policy_id,
           SUM(  COALESCE(basic_brokerage_amount, 0)
               + COALESCE(CASE WHEN commission_terrorism_amount IS DISTINCT FROM terrorism_brokerage_percentage
                               THEN commission_terrorism_amount END, 0)
               + COALESCE(fee_amount, 0)) AS total
    FROM public.policy_asset_endorsement
    GROUP BY policy_id
),
endorsement_total AS (
    SELECT policy_id, SUM(total) AS total
    FROM endorsement_brokerage
    GROUP BY policy_id
)
UPDATE public.opportunity o
SET estimated_brokerage = COALESCE(p.total_brokerage_amount, 0) + COALESCE(e.total, 0)
FROM public.policy p
LEFT JOIN endorsement_total e ON e.policy_id = p.id
WHERE o.ref_policy_id = p.id;
-- Uses policy.total_brokerage_amount, which STEP 3 just set. Run STEP 3 first.


-- =====================================================================
-- STEP 6 - CHECKS (read-only, run after the updates)
-- =====================================================================

-- How many policy rows changed, and by how much in total?
-- SELECT COUNT(*) AS rows_changed,
--        ROUND(SUM(p.total_brokerage_amount - b.total_brokerage_amount), 2) AS increase
-- FROM public.policy p
-- JOIN public.bkp_policy_total_brokerage b ON b.id = p.id
-- WHERE p.total_brokerage_amount IS DISTINCT FROM b.total_brokerage_amount;

-- Spot-check 10 policies: do the parts add up to the new total?
-- SELECT id, basic_brokerage_amount, srcc_brokerage_amount,
--        tc_brokerage_amount, commission_terrorism, fee_amount,
--        total_brokerage_amount
-- FROM public.policy
-- WHERE fee_amount > 0
-- LIMIT 10;

-- How many ROs changed?
-- SELECT COUNT(*) FROM public.opportunity o
-- JOIN public.bkp_opportunity_estimated_brokerage b USING (opportunity_id)
-- WHERE o.estimated_brokerage IS DISTINCT FROM b.estimated_brokerage;


-- =====================================================================
-- STEP 7 - UNDO (only if something looks wrong)
-- =====================================================================
-- UPDATE public.policy p SET total_brokerage_amount = b.total_brokerage_amount
-- FROM public.bkp_policy_total_brokerage b WHERE b.id = p.id;
--
-- UPDATE public.endorsement e SET total_brokerage_amount = b.total_brokerage_amount
-- FROM public.bkp_endorsement_total_brokerage b WHERE b.id = e.id;
--
-- UPDATE public.opportunity o SET estimated_brokerage = b.estimated_brokerage
-- FROM public.bkp_opportunity_estimated_brokerage b
-- WHERE b.opportunity_id = o.opportunity_id;
