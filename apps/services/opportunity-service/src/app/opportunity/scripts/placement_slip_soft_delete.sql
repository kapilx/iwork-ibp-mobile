-- Add deleted_at column for soft deletion support
ALTER TABLE public.opportunity_placement_slip_generation
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.opportunity_placement_slip_tpa_map
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.opportunity_placement_slip_insurer_map
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.opportunity_placement_slip_sharing_detail
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.opportunity_placement_slip_cd_detail
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.opportunity_placement_slip_cover_detail
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
