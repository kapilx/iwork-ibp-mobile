-- ACTIVITY STATUS LOOKUPS FOR OPPORTUNITY SAVE AND COMPLETE ACTIONS
INSERT INTO
    lookup_data (
        id,
        lookup_key,
        lookup_name,
        value_key,
        value,
        description,
        created_at,
        updated_at,
        created_by,
        updated_by,
        lookup_order,
        status
    )
VALUES
    (
        21811,
        'SAVE_ACTIVITY',
        'ACTIVITY_STATUS',
        'SAVE',
        'SAVE',
        'save activity created',
        NOW(),
        NOW(),
        'SYSTEM',
        'SYSTEM',
        1,
        1
    ),
    (
        21812,
        'COMPLETE_ACTIVITY',
        'ACTIVITY_STATUS',
        'COMPLETE',
        'COMPLETE',
        'complete activity created',
        NOW(),
        NOW(),
        'SYSTEM',
        'SYSTEM',
        2,
        1
    );

-- ADD ACTIVITY STATUS COLUMN TO OPPORTUNITY ACTIVITY MAP
ALTER TABLE
    opportunity_activity_map
ADD
    COLUMN activity_status_key varchar(20);

--- Data Validation Activity Changes
ALTER TABLE
    opportunity_data_validation_document_map
ALTER COLUMN
    task_id DROP NOT NULL;

--- Kdm Meeting Activity Changes
ALTER TABLE
    opportunity_kdm_meeting
ALTER COLUMN
    meeting_id DROP NOT NULL,
ALTER COLUMN
    kdm_meeting_type_lid DROP NOT NULL;

ALTER TABLE
    opportunity_kdm_meeting
ADD
    COLUMN meeting_date DATE,
ADD
    COLUMN start_time TIME WITH TIME ZONE,
ADD
    COLUMN end_time TIME WITH TIME ZONE,
ADD
    COLUMN location_type_lid INTEGER;

CREATE TABLE IF NOT EXISTS public.opportunity_meeting_document_map (
    id SERIAL,
    opportunity_activity_id integer NOT NULL,
    document_id integer NOT NULL,
    document_type_lid integer,
    CONSTRAINT pk_opportunity_meeting_document_map PRIMARY KEY (id),
    CONSTRAINT fk_opportunity_meeting_document_map_document FOREIGN KEY (document_id) REFERENCES public.file_uploads (id),
    CONSTRAINT fk_opportunity_meeting_document_map_activity FOREIGN KEY (opportunity_activity_id) REFERENCES public.opportunity_activity_map (id)
);

CREATE TABLE IF NOT EXISTS public.opportunity_meeting_participant_map (
    id SERIAL,
    opportunity_activity_id INTEGER NOT NULL,
    participant_id INTEGER NOT NULL,
    participant_company_id INTEGER NOT NULL,
    participant_record_type VARCHAR(25) CHECK (
        participant_record_type IN (
            'TPA_CONTACT',
            'INSURER_CONTACT',
            'BROKER_CONTACT',
            'COMPANY_CONTACT',
            'EMPLOYEE'
        )
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT opportunity_meeting_participant_map_pkey PRIMARY KEY (id),
    CONSTRAINT fk_opportunity_meeting_participant_map_activity FOREIGN KEY (opportunity_activity_id) REFERENCES public.opportunity_activity_map (id)
);

-- Mandate Details Activity Changes
ALTER TABLE
    opportunity_mandate_details_entry
ALTER COLUMN
    company_id DROP NOT NULL,
ALTER COLUMN
    activity_date DROP NOT NULL,
ALTER COLUMN
    plan_date DROP NOT NULL,
ALTER COLUMN
    mandate_type_lid DROP NOT NULL,
ALTER COLUMN
    valid_from DROP NOT NULL,
ALTER COLUMN
    valid_to DROP NOT NULL,
ALTER COLUMN
    compensation_payable DROP NOT NULL,
ALTER COLUMN
    compensation_type_lid DROP NOT NULL,
ALTER COLUMN
    issued_on DROP NOT NULL,
ALTER COLUMN
    created_by DROP NOT NULL,
ALTER COLUMN
    updated_by DROP NOT NULL;

ALTER TABLE
    public.opportunity_mandate_details_entry DROP CONSTRAINT chk_valid_dates,
    DROP CONSTRAINT mandate_details_entry_compensation_payable_check,
    DROP CONSTRAINT mandate_details_entry_remarks_check;

-- RFP Details Entry Activity Changes
ALTER TABLE
    IF EXISTS public.opportunity_rfp_details_entry_document_map
ALTER COLUMN
    document_type_lid DROP NOT NULL;

ALTER TABLE
    IF EXISTS public.opportunity_rfp_client_contact_detail
ALTER COLUMN
    contact_id DROP NOT NULL,
ALTER COLUMN
    expected_premium TYPE numeric(19, 2);

ALTER TABLE
    IF EXISTS public.opportunity_rfp_credit_sharing
ALTER COLUMN
    credit_sharing_percentage DROP NOT NULL,
ALTER COLUMN
    credit_sharing_percentage TYPE numeric(5, 2);

ALTER TABLE
    IF EXISTS public.opportunity_rfp_details_entry_document_map
ALTER COLUMN
    document_type_lid DROP NOT NULL;

ALTER TABLE
    IF EXISTS public.opportunity_rfp_client_contact_detail
ALTER COLUMN
    contact_id DROP NOT NULL;

ALTER TABLE
    public.opportunity_rfp_client_contact_detail
ALTER COLUMN
    expected_premium TYPE numeric(19, 2);

ALTER TABLE
    public.opportunity_rfp_credit_sharing
ALTER COLUMN
    credit_sharing_percentage TYPE numeric(5, 2);

ALTER TABLE
    IF EXISTS public.opportunity_rfp_credit_sharing
ALTER COLUMN
    credit_sharing_percentage DROP NOT NULL;

-- Placement Slip Activity Changes
ALTER TABLE
    opportunity_placement_slip_generation
ALTER COLUMN
    policy_from_date DROP NOT NULL,
ALTER COLUMN
    policy_to_date DROP NOT NULL,
ALTER COLUMN
    sum_insured DROP NOT NULL,
ALTER COLUMN
    basic_premium DROP NOT NULL,
ALTER COLUMN
    is_premium_installment_based DROP NOT NULL,
ALTER COLUMN
    fee DROP NOT NULL,
ALTER COLUMN
    is_fee_in_installment DROP NOT NULL,
ALTER COLUMN
    service_tax_percentage DROP NOT NULL,
ALTER COLUMN
    service_tax_amount DROP NOT NULL,
ALTER COLUMN
    total_premium DROP NOT NULL,
ALTER COLUMN
    placement_slip_date DROP NOT NULL,
ALTER COLUMN
    brokerage_percentage DROP NOT NULL,
ALTER COLUMN
    brokerage_amount DROP NOT NULL;

ALTER TABLE
    opportunity_placement_slip_cover_detail
ALTER COLUMN
    cover_response DROP NOT NULL;

ALTER TABLE
    opportunity_placement_slip_cd_detail
ALTER COLUMN
    cheque_amount DROP NOT NULL,
ALTER COLUMN
    cheque_number DROP NOT NULL,
ALTER COLUMN
    bank_name DROP NOT NULL;

ALTER TABLE
    opportunity_placement_slip_installement_detail
ALTER COLUMN
    first_installment_date DROP NOT NULL;

ALTER TABLE
    opportunity_placement_slip_tpa_map
ALTER COLUMN
    tpa_id DROP NOT NULL,
ALTER COLUMN
    tpa_location_id DROP NOT NULL,
ALTER COLUMN
    tpa_branch_id DROP NOT NULL;

-- Hand Over Meeting Activity Changes
ALTER TABLE
    opportunity_hand_over_meet
ADD
    COLUMN meeting_date DATE,
ADD
    COLUMN start_time TIME WITH TIME ZONE,
ADD
    COLUMN end_time TIME WITH TIME ZONE,
ADD
    COLUMN location_type_lid INTEGER;

-- Final Negotiation Activity Changes/
ALTER TABLE
    opportunity_final_negotiation
ADD
    COLUMN meeting_date DATE,
ADD
    COLUMN start_time TIME WITH TIME ZONE,
ADD
    COLUMN end_time TIME WITH TIME ZONE,
ADD
    COLUMN location_type_lid INTEGER;

ALTER TABLE
    IF EXISTS opportunity_final_negotiation_quote_cover_detail
ALTER COLUMN
    quote_id DROP NOT NULL;

--- broking Slip Activity
ALTER TABLE
    opportunity_broking_slip_version_details
ALTER COLUMN
    risk_mitigation_features DROP NOT NULL,
ALTER COLUMN
    clauses DROP NOT NULL,
ALTER COLUMN
    insurer_remarks DROP NOT NULL;

ALTER TABLE
    brokingslip_version_preferred_tpa_detail
ALTER COLUMN
    tpa_id DROP NOT NULL,
ALTER COLUMN
    location_id DROP NOT NULL,
ALTER COLUMN
    branch_id DROP NOT NULL;

ALTER TABLE
    brokingslip_version_preferred_insurer_detail
ALTER COLUMN
    insurer_id DROP NOT NULL,
ALTER COLUMN
    location_id DROP NOT NULL,
ALTER COLUMN
    branch_id DROP NOT NULL;

--- Broking Slip Activity Changes
ALTER TABLE
    opportunity_broking_slip_version_cover_map_details DROP CONSTRAINT fk_opty_broking_slip_version_id;

-- Policy Creation
ALTER TABLE
    policy_tpa_map
ALTER COLUMN
    tpa_id DROP NOT NULL,
ALTER COLUMN
    tpa_branch_id DROP NOT NULL;

ALTER TABLE
    IF EXISTS brokingslip_version_preferred_insurer_detail
ALTER COLUMN
    location_id DROP NOT NULL,
ALTER COLUMN
    branch_id DROP NOT NULL;

---16/12/2025 key and db changes
ALTER TABLE
    opportunity_quote_entry RENAME COLUMN terrorism_cover TO terrorism;

ALTER TABLE
    opportunity_quote_entry RENAME COLUMN terrorism_cover_percentage TO terrorism_brokerage_percentage;

ALTER TABLE
    opportunity_quote_entry RENAME COLUMN brokerage_percent TO basic_brokerage_percentage;

ALTER TABLE
    opportunity_quote_entry RENAME COLUMN service_tax_percentage TO gst_percentage;

ALTER TABLE
    opportunity_quote_entry RENAME COLUMN service_tax_amount TO gst_amount;

ALTER TABLE
    opportunity_quote_entry RENAME COLUMN total_gross_premium_inc_tax_charges TO gross_premium;

ALTER TABLE
    opportunity_quote_entry
ADD
    COLUMN IF NOT EXISTS total_brokerage_amount NUMERIC(19, 2);

-- Final negotiation
ALTER TABLE
    opportunity_final_negotiation RENAME COLUMN terrorism_commission_percentage TO terrorism_brokerage_percentage;

ALTER TABLE
    opportunity_final_negotiation RENAME COLUMN service_tax_percentage TO gst_percentage;

ALTER TABLE
    opportunity_final_negotiation RENAME COLUMN service_tax_amount TO gst_amount;

ALTER TABLE
    opportunity_final_negotiation RENAME COLUMN brokerage_percentage TO basic_brokerage_percentage;

ALTER TABLE
    opportunity_final_negotiation RENAME COLUMN total_gross_premium_inc_tax_charges TO gross_premium;

ALTER TABLE
    opportunity_final_negotiation
ADD
    COLUMN IF NOT EXISTS total_brokerage_amount NUMERIC(19, 2);

ALTER TABLE
    opportunity_final_negotiation_sharing_detail
ADD
    COLUMN IF NOT EXISTS terrorism_brokerage_percentage NUMERIC(5, 2),
ADD
    COLUMN IF NOT EXISTS terrorism_brokerage_amount NUMERIC(19, 2),
ADD
    COLUMN IF NOT EXISTS total_brokerage_amount NUMERIC(19, 2);

-- 17/12/2025 placement slip db related changes
ALTER TABLE
    opportunity_placement_slip_generation RENAME COLUMN terrorism_commission_percentage TO terrorism_brokerage_percentage;

ALTER TABLE
    opportunity_placement_slip_generation RENAME COLUMN terrorism_commission TO terrorism;

ALTER TABLE
    opportunity_placement_slip_generation RENAME COLUMN service_tax_percentage TO gst_percentage;

ALTER TABLE
    opportunity_placement_slip_generation RENAME COLUMN service_tax_amount TO gst_amount;

ALTER TABLE
    opportunity_placement_slip_generation RENAME COLUMN brokerage_percentage TO basic_brokerage_percentage;

ALTER TABLE
    opportunity_placement_slip_generation RENAME COLUMN total_gross_premium_inc_tax_charges TO gross_premium;

ALTER TABLE
    opportunity_placement_slip_generation
ADD
    COLUMN IF NOT EXISTS net_premium NUMERIC(19, 2),
ADD
    COLUMN IF NOT EXISTS total_brokerage_amount NUMERIC(19, 2);

--- placement sharing detail
ALTER TABLE
    opportunity_placement_slip_sharing_detail
ADD
    COLUMN IF NOT EXISTS terrorism_brokerage_percentage NUMERIC(5, 2),
ADD
    COLUMN IF NOT EXISTS terrorism_brokerage_amount NUMERIC(19, 2),
ADD
    COLUMN IF NOT EXISTS total_brokerage_amount NUMERIC(19, 2);

-- held cover note scripts
ALTER TABLE
    opportunity_held_cover_note RENAME COLUMN terrorism_commission_percentage TO terrorism_brokerage_percentage;

ALTER TABLE
    opportunity_held_cover_note RENAME COLUMN terrorism_commission TO terrorism;

ALTER TABLE
    opportunity_held_cover_note RENAME COLUMN total_gross_premium_inc_tax_charges TO gross_premium;

ALTER TABLE
    opportunity_held_cover_note RENAME COLUMN service_tax_amount TO gst_amount;

ALTER TABLE
    opportunity_held_cover_note RENAME COLUMN service_tax_percentage TO gst_percentage;

ALTER TABLE
    opportunity_held_cover_note RENAME COLUMN total_net_premium TO net_premium;

ALTER TABLE
    opportunity_held_cover_note RENAME COLUMN brokerage_percentage TO basic_brokerage_percentage;

ALTER TABLE
    opportunity_held_cover_note
ADD
    COLUMN total_brokerage_amount NUMERIC(19, 2);

ALTER TABLE
    opportunity_held_cover_note_insurer_map
ADD
    COLUMN IF NOT EXISTS terrorism_brokerage_percentage NUMERIC(5, 2),
ADD
    COLUMN IF NOT EXISTS terrorism_brokerage_amount NUMERIC(19, 2),
ADD
    COLUMN IF NOT EXISTS total_brokerage_amount NUMERIC(19, 2);

--- policy hard copy
ALTER TABLE
    opportunity_policy_hard_copy RENAME COLUMN terrorism_commission_percentage TO terrorism_brokerage_percentage;

ALTER TABLE
    opportunity_policy_hard_copy RENAME COLUMN premium TO basic_premium;

ALTER TABLE
    opportunity_policy_hard_copy RENAME COLUMN terrorism_commission TO terrorism;

ALTER TABLE
    opportunity_policy_hard_copy RENAME COLUMN total_gross_premium_inc_tax_charges TO gross_premium;

ALTER TABLE
    opportunity_policy_hard_copy RENAME COLUMN service_tax_amount TO gst_amount;

ALTER TABLE
    opportunity_policy_hard_copy RENAME COLUMN service_tax_percentage TO gst_percentage;

ALTER TABLE
    opportunity_policy_hard_copy RENAME COLUMN total_net_premium TO net_premium;

ALTER TABLE
    opportunity_policy_hard_copy RENAME COLUMN brokerage_percentage TO basic_brokerage_percentage;

ALTER TABLE
    opportunity_policy_hard_copy
ADD
    COLUMN total_brokerage_amount NUMERIC(19, 2);

--- policy hard copy insurers
ALTER TABLE
    opportunity_policy_hard_copy_insurer_map
ADD
    COLUMN IF NOT EXISTS terrorism_brokerage_percentage NUMERIC(5, 2),
ADD
    COLUMN IF NOT EXISTS terrorism_brokerage_amount NUMERIC(19, 2),
ADD
    COLUMN IF NOT EXISTS total_brokerage_amount NUMERIC(19, 2);

--- policy confirmation
ALTER TABLE
    opportunity_policy_confirmation RENAME COLUMN terrorism_commission_percentage TO terrorism_brokerage_percentage;

ALTER TABLE
    opportunity_policy_confirmation RENAME COLUMN terrorism_commission TO terrorism;

ALTER TABLE
    opportunity_policy_confirmation RENAME COLUMN total_gross_premium_inc_tax_charges TO gross_premium;

ALTER TABLE
    opportunity_policy_confirmation RENAME COLUMN service_tax_amount TO gst_amount;

ALTER TABLE
    opportunity_policy_confirmation RENAME COLUMN service_tax_percentage TO gst_percentage;

ALTER TABLE
    opportunity_policy_confirmation RENAME COLUMN total_net_premium TO net_premium;

ALTER TABLE
    opportunity_policy_confirmation RENAME COLUMN brokerage_percentage TO basic_brokerage_percentage;

ALTER TABLE
    opportunity_policy_confirmation
ADD
    COLUMN total_brokerage_amount NUMERIC(19, 2);

--- policy confirmation insurers
ALTER TABLE
    opportunity_policy_confirmation_insurer_map
ADD
    COLUMN IF NOT EXISTS terrorism_brokerage_percentage NUMERIC(5, 2),
ADD
    COLUMN IF NOT EXISTS terrorism_brokerage_amount NUMERIC(19, 2),
ADD
    COLUMN IF NOT EXISTS total_brokerage_amount NUMERIC(19, 2);

--- placement slip cd detail ones
ALTER TABLE
    opportunity_placement_slip_cd_detail
ALTER COLUMN
    cheque_amount TYPE NUMERIC(19, 2);

ALTER TABLE
    opportunity_placement_slip_cd_detail
ALTER COLUMN
    open_balance TYPE NUMERIC(19, 2);

----decimals in amount fields
ALTER TABLE public.opportunity_broking_slip_version_details
ALTER COLUMN sum_insured TYPE numeric(19,2)
USING sum_insured::numeric(19,2);

ALTER TABLE public.opportunity_broking_slip_version_details
ALTER COLUMN brokerage_percentage TYPE numeric(5,2)
USING brokerage_percentage::numeric(5,2);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN basic_premium TYPE numeric(19,2)
USING basic_premium::numeric(19,2);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN terrorism TYPE numeric(19,2)
USING terrorism::numeric(19,2);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN net_premium TYPE numeric(19,2)
USING net_premium::numeric(19,2);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN basic_brokerage_percentage TYPE numeric(5,2)
USING basic_brokerage_percentage::numeric(5,2);

ALTER TABLE public.opportunity_final_negotiation_tax_map
ALTER COLUMN tax_value TYPE numeric(19, 2)
USING tax_value::numeric;

ALTER TABLE public.policy
ALTER COLUMN sum_insured TYPE numeric(19, 2)
USING sum_insured::numeric;

ALTER TABLE public.policy
ALTER COLUMN premium_at_inception TYPE numeric(19, 2)
USING premium_at_inception::numeric;

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN basic_premium TYPE numeric(19, 2)
USING basic_premium::numeric;

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN sum_insured TYPE numeric(19,2)
USING sum_insured::numeric(19,2);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN basic_premium TYPE numeric(19,2)
USING basic_premium::numeric(19,2);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN fee TYPE numeric(19,2)
USING fee::numeric(19,2);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN gst_amount TYPE numeric(19,2)
USING gst_amount::numeric(19,2);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN total_premium TYPE numeric(19,2)
USING total_premium::numeric(19,2);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN brokerage_amount TYPE numeric(19,2)
USING brokerage_amount::numeric(19,2);

-- Date: 13 Jul 2026

--Enter Quote
ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN basic_premium TYPE numeric(21,4)
USING basic_premium::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN terrorism TYPE numeric(21,4)
USING terrorism::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN net_premium TYPE numeric(21,4)
USING net_premium::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN srcc_amount TYPE numeric(21,4)
USING srcc_amount::numeric(21,4);


ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN gst_amount TYPE numeric(21,4)
USING gst_amount::numeric(21,4);


ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN total_gross_premium_inc_tax TYPE numeric(21,4)
USING total_gross_premium_inc_tax::numeric(21,4);


ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN fee TYPE numeric(21,4)
USING fee::numeric(21,4);


ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN admin_charges TYPE numeric(21,4)
USING admin_charges::numeric(21,4);


ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN gross_premium TYPE numeric(21,4)
USING gross_premium::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN tc_brokerage_amount TYPE numeric(21,4)
USING tc_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN basic_brokerage_amount TYPE numeric(21,4)
USING basic_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN srcc_brokerage_amount TYPE numeric(21,4)
USING srcc_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN brokerage_amount TYPE numeric(21,4)
USING brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN total_brokerage_amount TYPE numeric(21,4)
USING total_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN basic_brokerage_percentage TYPE numeric(7,4)
USING basic_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN basic_premium_percentage TYPE numeric(7,4)
USING basic_premium_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN srcc_percentage TYPE numeric(7,4)
USING srcc_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN fee_percentage TYPE numeric(7,4)
USING fee_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN cess_percentage TYPE numeric(7,4)
USING cess_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN terrorism_brokerage_percentage TYPE numeric(7,4)
USING terrorism_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN gst_percentage TYPE numeric(7,4)
USING gst_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN other_percentage TYPE numeric(7,4)
USING other_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN admin_charges_percentage TYPE numeric(7,4)
USING admin_charges_percentage::numeric(7,4);

-- Date: 13 Feb 2026
-- Opportunity activity precision updates (amounts: 21,4; percentages: 7,4)
ALTER TABLE public.opportunity_broking_slip_version_details
ALTER COLUMN basic_premium TYPE numeric(21,4)
USING basic_premium::numeric(21,4);

ALTER TABLE public.opportunity_broking_slip_version_details
ALTER COLUMN brokerage_amount TYPE numeric(21,4)
USING brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_broking_slip_version_details
ALTER COLUMN sum_insured TYPE numeric(21,4)
USING sum_insured::numeric(21,4);

ALTER TABLE public.opportunity_broking_slip_version_details
ALTER COLUMN brokerage_percentage TYPE numeric(7,4)
USING brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN basic_brokerage_percentage TYPE numeric(7,4)
USING basic_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN basic_premium TYPE numeric(21,4)
USING basic_premium::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN terrorism TYPE numeric(21,4)
USING terrorism::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN net_premium TYPE numeric(21,4)
USING net_premium::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN srcc_percentage TYPE numeric(7,4)
USING srcc_percentage::numeric(7,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN srcc_amount TYPE numeric(21,4)
USING srcc_amount::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN srcc_brokerage_amount TYPE numeric(21,4)
USING srcc_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN terrorism_brokerage_percentage TYPE numeric(7,4)
USING terrorism_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN gst_percentage TYPE numeric(7,4)
USING gst_percentage::numeric(7,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN gst_amount TYPE numeric(21,4)
USING gst_amount::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN fee_percentage TYPE numeric(7,4)
USING fee_percentage::numeric(7,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN fee TYPE numeric(21,4)
USING fee::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN other_percentage TYPE numeric(7,4)
USING other_percentage::numeric(7,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN other TYPE numeric(21,4)
USING other::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN admin_charges_percentage TYPE numeric(7,4)
USING admin_charges_percentage::numeric(7,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN admin_charges TYPE numeric(21,4)
USING admin_charges::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN cess_percentage TYPE numeric(7,4)
USING cess_percentage::numeric(7,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN cess_amount TYPE numeric(21,4)
USING cess_amount::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN gross_premium TYPE numeric(21,4)
USING gross_premium::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN tc_brokerage_amount TYPE numeric(21,4)
USING tc_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN basic_brokerage_amount TYPE numeric(21,4)
USING basic_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation
ALTER COLUMN total_brokerage_amount TYPE numeric(21,4)
USING total_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN basic_premium TYPE numeric(21,4)
USING basic_premium::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN basic_brokerage_percentage TYPE numeric(7,4)
USING basic_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN srcc_percentage TYPE numeric(7,4)
USING srcc_percentage::numeric(7,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN srcc_amount TYPE numeric(21,4)
USING srcc_amount::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN srcc_brokerage_amount TYPE numeric(21,4)
USING srcc_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN terrorism_brokerage_percentage TYPE numeric(7,4)
USING terrorism_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN terrorism TYPE numeric(21,4)
USING terrorism::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN gst_percentage TYPE numeric(7,4)
USING gst_percentage::numeric(7,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN gst_amount TYPE numeric(21,4)
USING gst_amount::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN net_premium TYPE numeric(21,4)
USING net_premium::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN fee_percentage TYPE numeric(7,4)
USING fee_percentage::numeric(7,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN fee TYPE numeric(21,4)
USING fee::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN other_percentage TYPE numeric(7,4)
USING other_percentage::numeric(7,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN other TYPE numeric(21,4)
USING other::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN admin_charges_percentage TYPE numeric(7,4)
USING admin_charges_percentage::numeric(7,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN admin_charges TYPE numeric(21,4)
USING admin_charges::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN cess_percentage TYPE numeric(7,4)
USING cess_percentage::numeric(7,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN cess_amount TYPE numeric(21,4)
USING cess_amount::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN gross_premium TYPE numeric(21,4)
USING gross_premium::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN tc_brokerage_amount TYPE numeric(21,4)
USING tc_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN basic_brokerage_amount TYPE numeric(21,4)
USING basic_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN sum_insured TYPE numeric(21,4)
USING sum_insured::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note
ALTER COLUMN total_brokerage_amount TYPE numeric(21,4)
USING total_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note_insurer_map
ALTER COLUMN share_percentage TYPE numeric(7,4)
USING share_percentage::numeric(7,4);

ALTER TABLE public.opportunity_held_cover_note_insurer_map
ALTER COLUMN share_amount TYPE numeric(21,4)
USING share_amount::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note_insurer_map
ALTER COLUMN brokerage_percentage TYPE numeric(7,4)
USING brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_held_cover_note_insurer_map
ALTER COLUMN brokerage_amount TYPE numeric(21,4)
USING brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note_insurer_map
ALTER COLUMN terrorism_brokerage_percentage TYPE numeric(7,4)
USING terrorism_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_held_cover_note_insurer_map
ALTER COLUMN terrorism_brokerage_amount TYPE numeric(21,4)
USING terrorism_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_held_cover_note_insurer_map
ALTER COLUMN total_brokerage_amount TYPE numeric(21,4)
USING total_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN srcc_percentage TYPE numeric(7,4)
USING srcc_percentage::numeric(7,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN srcc_amount TYPE numeric(21,4)
USING srcc_amount::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN srcc_brokerage_amount TYPE numeric(21,4)
USING srcc_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN sum_insured TYPE numeric(21,4)
USING sum_insured::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN basic_premium TYPE numeric(21,4)
USING basic_premium::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN net_premium TYPE numeric(21,4)
USING net_premium::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN terrorism TYPE numeric(21,4)
USING terrorism::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN fee_percentage TYPE numeric(7,4)
USING fee_percentage::numeric(7,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN fee TYPE numeric(21,4)
USING fee::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN other_percentage TYPE numeric(7,4)
USING other_percentage::numeric(7,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN admin_charges_percentage TYPE numeric(7,4)
USING admin_charges_percentage::numeric(7,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN admin_charges TYPE numeric(21,4)
USING admin_charges::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN cess_percentage TYPE numeric(7,4)
USING cess_percentage::numeric(7,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN cess_amount TYPE numeric(21,4)
USING cess_amount::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN gross_premium TYPE numeric(21,4)
USING gross_premium::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN tc_brokerage_amount TYPE numeric(21,4)
USING tc_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN basic_brokerage_amount TYPE numeric(21,4)
USING basic_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN total_brokerage_amount TYPE numeric(21,4)
USING total_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN terrorism_brokerage_percentage TYPE numeric(7,4)
USING terrorism_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN gst_percentage TYPE numeric(7,4)
USING gst_percentage::numeric(7,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN gst_amount TYPE numeric(21,4)
USING gst_amount::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN other TYPE numeric(21,4)
USING other::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN total_premium TYPE numeric(21,4)
USING total_premium::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_generation
ALTER COLUMN basic_brokerage_percentage TYPE numeric(7,4)
USING basic_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN basic_premium TYPE numeric(21,4)
USING basic_premium::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN basic_brokerage_percentage TYPE numeric(7,4)
USING basic_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN srcc_percentage TYPE numeric(7,4)
USING srcc_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN srcc_amount TYPE numeric(21,4)
USING srcc_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN srcc_brokerage_amount TYPE numeric(21,4)
USING srcc_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN terrorism_brokerage_percentage TYPE numeric(7,4)
USING terrorism_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN terrorism TYPE numeric(21,4)
USING terrorism::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN gst_percentage TYPE numeric(7,4)
USING gst_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN gst_amount TYPE numeric(21,4)
USING gst_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN net_premium TYPE numeric(21,4)
USING net_premium::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN fee_percentage TYPE numeric(7,4)
USING fee_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN fee TYPE numeric(21,4)
USING fee::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN other_percentage TYPE numeric(7,4)
USING other_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN other TYPE numeric(21,4)
USING other::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN admin_charges_percentage TYPE numeric(7,4)
USING admin_charges_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN admin_charges TYPE numeric(21,4)
USING admin_charges::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN cess_percentage TYPE numeric(7,4)
USING cess_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN cess_amount TYPE numeric(21,4)
USING cess_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN gross_premium TYPE numeric(21,4)
USING gross_premium::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN tc_brokerage_amount TYPE numeric(21,4)
USING tc_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN basic_brokerage_amount TYPE numeric(21,4)
USING basic_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation
ALTER COLUMN sum_insured TYPE numeric(21,4)
USING sum_insured::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation_insurer_map
ALTER COLUMN share_percentage TYPE numeric(7,4)
USING share_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_confirmation_insurer_map
ALTER COLUMN share_amount TYPE numeric(21,4)
USING share_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation_insurer_map
ALTER COLUMN brokerage_percentage TYPE numeric(7,4)
USING brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_confirmation_insurer_map
ALTER COLUMN brokerage_amount TYPE numeric(21,4)
USING brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation_insurer_map
ALTER COLUMN terrorism_brokerage_percentage TYPE numeric(7,4)
USING terrorism_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_confirmation_insurer_map
ALTER COLUMN terrorism_brokerage_amount TYPE numeric(21,4)
USING terrorism_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_confirmation_insurer_map
ALTER COLUMN total_brokerage_amount TYPE numeric(21,4)
USING total_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN basic_brokerage_percentage TYPE numeric(7,4)
USING basic_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN srcc_percentage TYPE numeric(7,4)
USING srcc_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN srcc_amount TYPE numeric(21,4)
USING srcc_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN srcc_brokerage_amount TYPE numeric(21,4)
USING srcc_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN terrorism_brokerage_percentage TYPE numeric(7,4)
USING terrorism_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN terrorism TYPE numeric(21,4)
USING terrorism::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN gst_percentage TYPE numeric(7,4)
USING gst_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN gst_amount TYPE numeric(21,4)
USING gst_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN net_premium TYPE numeric(21,4)
USING net_premium::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN total_brokerage_amount TYPE numeric(21,4)
USING total_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN fee_percentage TYPE numeric(7,4)
USING fee_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN fee TYPE numeric(21,4)
USING fee::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN other_percentage TYPE numeric(7,4)
USING other_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN other TYPE numeric(21,4)
USING other::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN admin_charges_percentage TYPE numeric(7,4)
USING admin_charges_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN admin_charges TYPE numeric(21,4)
USING admin_charges::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN cess_percentage TYPE numeric(7,4)
USING cess_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN cess_amount TYPE numeric(21,4)
USING cess_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN gross_premium TYPE numeric(21,4)
USING gross_premium::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN tc_brokerage_amount TYPE numeric(21,4)
USING tc_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN basic_brokerage_amount TYPE numeric(21,4)
USING basic_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN sum_insured TYPE numeric(21,4)
USING sum_insured::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy_insurer_map
ALTER COLUMN share_percentage TYPE numeric(7,4)
USING share_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_hard_copy_insurer_map
ALTER COLUMN share_amount TYPE numeric(21,4)
USING share_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy_insurer_map
ALTER COLUMN brokerage_percentage TYPE numeric(7,4)
USING brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_hard_copy_insurer_map
ALTER COLUMN brokerage_amount TYPE numeric(21,4)
USING brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy_insurer_map
ALTER COLUMN terrorism_brokerage_percentage TYPE numeric(7,4)
USING terrorism_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_hard_copy_insurer_map
ALTER COLUMN terrorism_brokerage_amount TYPE numeric(21,4)
USING terrorism_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy_insurer_map
ALTER COLUMN total_brokerage_amount TYPE numeric(21,4)
USING total_brokerage_amount::numeric(21,4);


ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN basic_premium TYPE numeric(21,4)
USING basic_premium::numeric(21,4);


ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN brokerage_amount TYPE numeric(21,4)
USING brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN basic_premium_percentage TYPE numeric(7,4)
USING basic_premium_percentage::numeric(7,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN total_premium TYPE numeric(21,4)
USING total_premium::numeric(21,4);

ALTER TABLE public.opportunity_policy_hard_copy
ALTER COLUMN total_gross_premium_inc_tax TYPE numeric(21,4)
USING total_gross_premium_inc_tax::numeric(21,4);

-- Date: 13 Feb 2026
-- Policy precision updates (amounts: 21,4; percentages: 7,4)
ALTER TABLE public.policy
ALTER COLUMN sum_insured TYPE numeric(21,4)
USING sum_insured::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN premium_at_inception TYPE numeric(21,4)
USING premium_at_inception::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN gst_percentage TYPE numeric(21,4)
USING gst_percentage::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN gst TYPE numeric(7,4)
USING gst::numeric(7,4);

ALTER TABLE public.policy
ALTER COLUMN brokerage_collected TYPE numeric(21,4)
USING brokerage_collected::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN basic_brokerage_percentage TYPE numeric(7,4)
USING basic_brokerage_percentage::numeric(7,4);

ALTER TABLE public.policy
ALTER COLUMN commission_terrorism TYPE numeric(7,4)
USING commission_terrorism::numeric(7,4);

ALTER TABLE public.policy
ALTER COLUMN gst_amount TYPE numeric(21,4)
USING gst_amount::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN net_premium TYPE numeric(21,4)
USING net_premium::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN terrorism_amount TYPE numeric(21,4)
USING terrorism_amount::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN other_amount TYPE numeric(21,4)
USING other_amount::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN gross_premium TYPE numeric(21,4)
USING gross_premium::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN brokerage_amount_asper_iwork TYPE numeric(21,4)
USING brokerage_amount_asper_iwork::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN brokerage_amount_asper_isg TYPE numeric(21,4)
USING brokerage_amount_asper_isg::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN fee_amount TYPE numeric(21,4)
USING fee_amount::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN od_percentage TYPE numeric(7,4)
USING od_percentage::numeric(7,4);

ALTER TABLE public.policy
ALTER COLUMN tp_percentage TYPE numeric(7,4)
USING tp_percentage::numeric(7,4);

ALTER TABLE public.policy
ALTER COLUMN net_percentage TYPE numeric(7,4)
USING net_percentage::numeric(7,4);

ALTER TABLE public.policy
ALTER COLUMN share_percentage TYPE numeric(7,4)
USING share_percentage::numeric(7,4);

ALTER TABLE public.policy
ALTER COLUMN terrorism_brokerage_percentage TYPE numeric(7,4)
USING terrorism_brokerage_percentage::numeric(7,4);

ALTER TABLE public.policy
ALTER COLUMN fee_percentage TYPE numeric(7,4)
USING fee_percentage::numeric(7,4);

ALTER TABLE public.policy
ALTER COLUMN other_percentage TYPE numeric(7,4)
USING other_percentage::numeric(7,4);

ALTER TABLE public.policy
ALTER COLUMN srcc_percentage TYPE numeric(7,4)
USING srcc_percentage::numeric(7,4);

ALTER TABLE public.policy
ALTER COLUMN srcc_amount TYPE numeric(21,4)
USING srcc_amount::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN srcc_brokerage_amount TYPE numeric(21,4)
USING srcc_brokerage_amount::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN admin_charges_percentage TYPE numeric(7,4)
USING admin_charges_percentage::numeric(7,4);

ALTER TABLE public.policy
ALTER COLUMN admin_charges TYPE numeric(21,4)
USING admin_charges::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN cess_percentage TYPE numeric(7,4)
USING cess_percentage::numeric(7,4);

ALTER TABLE public.policy
ALTER COLUMN cess_amount TYPE numeric(21,4)
USING cess_amount::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN basic_premium TYPE numeric(21,4)
USING basic_premium::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN tc_brokerage_amount TYPE numeric(21,4)
USING tc_brokerage_amount::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN basic_brokerage_amount TYPE numeric(21,4)
USING basic_brokerage_amount::numeric(21,4);

ALTER TABLE public.policy
ALTER COLUMN total_brokerage_amount TYPE numeric(21,4)
USING total_brokerage_amount::numeric(21,4);

-- Date: 13 Feb 2026
-- Policy insurer map precision updates (amounts: 21,4; percentages: 7,4)
ALTER TABLE public.policy_insurer_map
ALTER COLUMN share_percentage TYPE numeric(7,4)
USING share_percentage::numeric(7,4);

ALTER TABLE public.policy_insurer_map
ALTER COLUMN share_amount TYPE numeric(21,4)
USING share_amount::numeric(21,4);

ALTER TABLE public.policy_insurer_map
ALTER COLUMN brokerage_percentage TYPE numeric(7,4)
USING brokerage_percentage::numeric(7,4);

ALTER TABLE public.policy_insurer_map
ALTER COLUMN brokerage_amount TYPE numeric(21,4)
USING brokerage_amount::numeric(21,4);

ALTER TABLE public.policy_insurer_map
ALTER COLUMN terrorism_brokerage_percentage TYPE numeric(7,4)
USING terrorism_brokerage_percentage::numeric(7,4);

ALTER TABLE public.policy_insurer_map
ALTER COLUMN terrorism_brokerage_amount TYPE numeric(21,4)
USING terrorism_brokerage_amount::numeric(21,4);

ALTER TABLE public.policy_insurer_map
ALTER COLUMN total_brokerage_amount TYPE numeric(21,4)
USING total_brokerage_amount::numeric(21,4);

-- Date: 13 Feb 2026
-- Final negotiation sharing detail precision updates (amounts: 21,4; percentages: 7,4)
ALTER TABLE public.opportunity_final_negotiation_sharing_detail
ALTER COLUMN share_percentage TYPE numeric(7,4)
USING share_percentage::numeric(7,4);

ALTER TABLE public.opportunity_final_negotiation_sharing_detail
ALTER COLUMN share_amount TYPE numeric(21,4)
USING share_amount::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation_sharing_detail
ALTER COLUMN brokerage_percentage TYPE numeric(7,4)
USING brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_final_negotiation_sharing_detail
ALTER COLUMN brokerage_amount TYPE numeric(21,4)
USING brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation_sharing_detail
ALTER COLUMN terrorism_brokerage_percentage TYPE numeric(7,4)
USING terrorism_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_final_negotiation_sharing_detail
ALTER COLUMN terrorism_brokerage_amount TYPE numeric(21,4)
USING terrorism_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_final_negotiation_sharing_detail
ALTER COLUMN total_brokerage_amount TYPE numeric(21,4)
USING total_brokerage_amount::numeric(21,4);

-- Date: 13 Feb 2026
-- Placement slip sharing detail precision updates (amounts: 21,4; percentages: 7,4)
ALTER TABLE public.opportunity_placement_slip_sharing_detail
ALTER COLUMN share_percentage TYPE numeric(7,4)
USING share_percentage::numeric(7,4);

ALTER TABLE public.opportunity_placement_slip_sharing_detail
ALTER COLUMN share_amount TYPE numeric(21,4)
USING share_amount::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_sharing_detail
ALTER COLUMN brokerage_percentage TYPE numeric(7,4)
USING brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_placement_slip_sharing_detail
ALTER COLUMN brokerage_amount TYPE numeric(21,4)
USING brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_sharing_detail
ALTER COLUMN terrorism_brokerage_percentage TYPE numeric(7,4)
USING terrorism_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_placement_slip_sharing_detail
ALTER COLUMN terrorism_brokerage_amount TYPE numeric(21,4)
USING terrorism_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_placement_slip_sharing_detail
ALTER COLUMN total_brokerage_amount TYPE numeric(21,4)
USING total_brokerage_amount::numeric(21,4);

--Enter Quote--

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN basic_premium TYPE numeric(21,4)
USING basic_premium::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN terrorism TYPE numeric(21,4)
USING terrorism::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN net_premium TYPE numeric(21,4)
USING net_premium::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN srcc_amount TYPE numeric(21,4)
USING srcc_amount::numeric(21,4);


ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN gst_amount TYPE numeric(21,4)
USING gst_amount::numeric(21,4);


ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN total_gross_premium_inc_tax TYPE numeric(21,4)
USING total_gross_premium_inc_tax::numeric(21,4);


ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN fee TYPE numeric(21,4)
USING fee::numeric(21,4);


ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN admin_charges TYPE numeric(21,4)
USING admin_charges::numeric(21,4);


ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN gross_premium TYPE numeric(21,4)
USING gross_premium::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN tc_brokerage_amount TYPE numeric(21,4)
USING tc_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN basic_brokerage_amount TYPE numeric(21,4)
USING basic_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN srcc_brokerage_amount TYPE numeric(21,4)
USING srcc_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN brokerage_amount TYPE numeric(21,4)
USING brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN total_brokerage_amount TYPE numeric(21,4)
USING total_brokerage_amount::numeric(21,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN basic_brokerage_percentage TYPE numeric(7,4)
USING basic_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN basic_premium_percentage TYPE numeric(7,4)
USING basic_premium_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN srcc_percentage TYPE numeric(7,4)
USING srcc_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN fee_percentage TYPE numeric(7,4)
USING fee_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN cess_percentage TYPE numeric(7,4)
USING cess_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN terrorism_brokerage_percentage TYPE numeric(7,4)
USING terrorism_brokerage_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN gst_percentage TYPE numeric(7,4)
USING gst_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN other_percentage TYPE numeric(7,4)
USING other_percentage::numeric(7,4);

ALTER TABLE public.opportunity_quote_entry
ALTER COLUMN admin_charges_percentage TYPE numeric(7,4)
USING admin_charges_percentage::numeric(7,4);

-- Date: 27 May 2026
-- Track who submitted an activity for approval
ALTER TABLE public.opportunity_activity_map
ADD COLUMN IF NOT EXISTS submitted_by INTEGER NULL;

ALTER TABLE public.opportunity_activity_map
ADD CONSTRAINT fk_oam_submitted_by
  FOREIGN KEY (submitted_by)
  REFERENCES public.users (id)
  ON DELETE SET NULL;
