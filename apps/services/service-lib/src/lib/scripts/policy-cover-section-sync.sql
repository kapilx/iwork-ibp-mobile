-- Policy Cover Section Sync
-- Purpose:
-- 1) Add section_id support to policy_cover_map
-- 2) Backfill section_id for existing policy_cover_map rows
-- 3) Keep section_id auto-populated for new/updated rows

-- =========================================================
-- 1. Schema setup for policy_cover_map.section_id
-- =========================================================

BEGIN;

ALTER TABLE public.policy_cover_map
  ADD COLUMN IF NOT EXISTS section_id INT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_policy_cover_map_section_id'
  ) THEN
    ALTER TABLE public.policy_cover_map
      ADD CONSTRAINT fk_policy_cover_map_section_id
      FOREIGN KEY (section_id) REFERENCES public.mstr_cover_section(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_policy_cover_map_section_id
  ON public.policy_cover_map(section_id);

COMMIT;

-- =========================================================
-- 2. Backfill existing policy_cover_map rows
-- Matching strategy:
--   primary: opportunity_cover_map.id = policy_cover_map.cover_template_id
--            (policy records are commonly seeded from opportunity cover ids)
--   primary: mstr_cover_template.id = policy_cover_map.cover_template_id
--   fallback: mstr_cover_template.ref_cover_id = policy_cover_map.cover_template_id
--   guarded by policy.policy_type_lid = source policy_type_id
-- =========================================================

BEGIN;

WITH resolved AS (
  SELECT
    pcm.id AS pcm_id,
    COALESCE(ocm.section_id, mct_id.section_id, mct_ref.section_id) AS resolved_section_id
  FROM public.policy_cover_map pcm
  JOIN public.policy p
    ON p.id = pcm.policy_id
  LEFT JOIN public.opportunity_cover_map ocm
    ON ocm.id = pcm.cover_template_id
   AND ocm.policy_type_id = p.policy_type_lid
  LEFT JOIN public.mstr_cover_template mct_id
    ON mct_id.id = pcm.cover_template_id
   AND mct_id.policy_type_id = p.policy_type_lid
  LEFT JOIN public.mstr_cover_template mct_ref
    ON mct_ref.ref_cover_id = pcm.cover_template_id
   AND mct_ref.policy_type_id = p.policy_type_lid
)
UPDATE public.policy_cover_map pcm
SET section_id = r.resolved_section_id,
    updated_at = NOW()
FROM resolved r
WHERE pcm.id = r.pcm_id
  AND pcm.section_id IS DISTINCT FROM r.resolved_section_id;

COMMIT;

-- =========================================================
-- 3. Auto-sync section_id for new/updated policy_cover_map rows
-- =========================================================

CREATE OR REPLACE FUNCTION public.fn_policy_cover_map_set_section_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_policy_type_id INT;
  v_section_id INT;
BEGIN
  SELECT p.policy_type_lid
  INTO v_policy_type_id
  FROM public.policy p
  WHERE p.id = NEW.policy_id
  LIMIT 1;

  IF v_policy_type_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Primary match: opportunity cover map id
  SELECT ocm.section_id
  INTO v_section_id
  FROM public.opportunity_cover_map ocm
  WHERE ocm.policy_type_id = v_policy_type_id
    AND ocm.id = NEW.cover_template_id
  LIMIT 1;

  -- Secondary match: template PK
  IF v_section_id IS NULL THEN
  SELECT mct.section_id
  INTO v_section_id
  FROM public.mstr_cover_template mct
  WHERE mct.policy_type_id = v_policy_type_id
    AND mct.id = NEW.cover_template_id
  LIMIT 1;
  END IF;

  -- Fallback match: template ref_cover_id
  IF v_section_id IS NULL THEN
    SELECT mct.section_id
    INTO v_section_id
    FROM public.mstr_cover_template mct
    WHERE mct.policy_type_id = v_policy_type_id
      AND mct.ref_cover_id = NEW.cover_template_id
    ORDER BY CASE WHEN mct.section_id IS NULL THEN 1 ELSE 0 END, mct.id
    LIMIT 1;
  END IF;

  NEW.section_id := v_section_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_policy_cover_map_set_section_id ON public.policy_cover_map;

CREATE TRIGGER trg_policy_cover_map_set_section_id
BEFORE INSERT OR UPDATE OF policy_id, cover_template_id
ON public.policy_cover_map
FOR EACH ROW
EXECUTE FUNCTION public.fn_policy_cover_map_set_section_id();

-- =========================================================
-- 4. Validation queries
-- =========================================================

-- 4.1 Coverage by policy_type
SELECT
  p.policy_type_lid,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE pcm.section_id IS NOT NULL) AS with_section,
  COUNT(*) FILTER (WHERE pcm.section_id IS NULL) AS without_section
FROM public.policy_cover_map pcm
JOIN public.policy p
  ON p.id = pcm.policy_id
GROUP BY p.policy_type_lid
ORDER BY p.policy_type_lid;

-- 4.2 Rows still without section (investigate these policy types/templates)
SELECT
  pcm.policy_id,
  p.policy_type_lid,
  pcm.cover_template_id,
  pcm.cover_name,
  pcm.section_id
FROM public.policy_cover_map pcm
JOIN public.policy p
  ON p.id = pcm.policy_id
WHERE pcm.section_id IS NULL
ORDER BY p.policy_type_lid, pcm.policy_id, pcm.cover_template_id
LIMIT 500;
