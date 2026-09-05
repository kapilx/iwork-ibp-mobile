-- Sri Lanka (localization_country id 8) bizdone/policyDetails cleanup + India (id 1) parity.
-- Final set = existing Sri Lanka fields (incl. the Lanka-specific premium/brokerage block)
--             - duplicates
--             + the 10 India-only fields.
-- 1. Drops the stale duplicate seed batch left behind by the double insert on 2026-01-07.
-- 2. Drops the duplicate columns inside the surviving batch.
-- 3. Renumbers display_order to follow India's column sequence.
-- 4. Adds the 10 India fields missing from Sri Lanka.
--    totalNetPremium excluded  -- Sri Lanka already has lankaNetPremium.
--    parentCompanyName excluded -- not wanted for Sri Lanka.
-- Result: 71 rows, display_order 1..71 contiguous.

BEGIN;

-- 1. Stale seed batch (the 03:01:12 batch is the corrected one and is kept).
DELETE FROM localization_report_fields_country_map
WHERE country_id = 8
  AND report_section = 'bizdone'
  AND activity_section = 'policyDetails'
  AND created_at = '2026-01-07 03:00:34.957918';

-- 2. Duplicates within the surviving batch. Matched on display_order + field_label
--    rather than id so this is safe to run in any environment.
--    - grossPremium @32: same field_label as @58; getLocalizationFields keys the map by
--      field_label, so @58 (lankaGrossPremium) already overwrites it. Dead row.
--    - status @24: same field_value (policyStatus) as policyStatus @44. India keeps this
--      one inactive; Sri Lanka has both active, so it renders twice.
--    - brokerageAmount @35: policy-report.ts forces any label normalizing to
--      "brokerageamount" onto basicBrokerageAmount, which duplicates @62.
DELETE FROM localization_report_fields_country_map
WHERE country_id = 8
  AND report_section = 'bizdone'
  AND activity_section = 'policyDetails'
  AND (display_order, field_label) IN (
    (32, 'grossPremium'),
    (24, 'status'),
    (35, 'brokerageAmount')
  );

-- 2b. Not a duplicate, but dead: no query in policy-report.ts ever selects a
--     basicPremiumPercentage alias, so this column is always blank.
--     Drop this statement if you would rather add the alias to the query instead.
DELETE FROM localization_report_fields_country_map
WHERE country_id = 8
  AND report_section = 'bizdone'
  AND activity_section = 'policyDetails'
  AND field_value = 'basicPremiumPercentage';

-- 3. Renumber the surviving 61 rows onto India's sequence. field_label is unique
--    within the section once the duplicates above are gone, so it is a safe key.
--    Slots 15,16,19-25,54 are left free for the new rows inserted in step 4.
--    The Lanka-specific premium/brokerage block (55-71) has no India counterpart,
--    so it keeps its existing relative order and trails the common columns.
UPDATE localization_report_fields_country_map AS m
SET display_order = v.ord
FROM (VALUES
  ('serialNumber',                   1),
  ('iirmOrganisation',               2),
  ('companyVertical',                3),
  ('SBU',                            4),
  ('vertical',                       5),
  ('department',                     6),
  ('iirmBranch',                     7),
  ('custId',                         8),
  ('customerName',                   9),
  ('customerCategory',              10),
  ('policyCategory',                11),
  ('policyGroup',                   12),
  ('policyName',                    13),
  ('incomeMonth',                   14),
  ('dateOfIncome',                  17),
  ('empName',                       18),
  ('insPolNo',                      26),
  ('policyFromDate',                27),
  ('policyToDate',                  28),
  ('incomeType',                    29),
  ('insEndNo',                      30),
  ('insurer',                       31),
  ('insBranch',                     32),
  ('sharePercentage',               33),
  ('shareAmount',                   34),
  ('netPremium',                    35),
  ('terrorism',                     36),
  ('other',                         37),
  ('gstPercentage',                 38),
  ('gst',                           39),
  ('serviceTax',                    40),
  ('premiumCollected',              41),
  ('brokeragePercentage',           42),
  ('terrorismCommissionAmount',     43),
  ('terrorismCommissionPercentage', 44),
  ('brokerageCollected',            45),
  ('fees',                          46),
  ('brokerageAmountAsEnteredByIsg', 47),
  ('brokerageAmountAsPerIwork',     48),
  ('dealConfirmed',                 49),
  ('policyStatus',                  50),
  ('entryInIwork',                  51),
  ('iirmPolNo',                     52),
  ('iirmRefNo',                     53),
  -- Lanka-specific block below this line.
  ('basicPremium',                  55),
  ('srccPremiumAmount',             56),
  ('tcPremiumAmount',               57),
  ('netpremium',                    58),
  ('adminCharges',                  59),
  ('stampDuty',                     60),
  ('cessAmount',                    61),
  ('policyFee',                     62),
  ('vatPercentage',                 63),
  ('vatAmount',                     64),
  ('grossPremium',                  65),
  ('srccbrokeragepercentage',       66),
  ('tcbrokerageAmount',             67),
  ('basicBrokerageAmount',          68),
  ('srccBrokerageAmount',           69),
  ('tcBrokerageAmount',             70),
  ('totalBrokerageAmount',          71)
) AS v(label, ord)
WHERE m.country_id = 8
  AND m.report_section = 'bizdone'
  AND m.activity_section = 'policyDetails'
  AND m.field_label = v.label;

-- 4. The 10 India-only fields, at their India-equivalent positions.
INSERT INTO localization_report_fields_country_map
  (country_id, regulatory_key_id, report_section, activity_section,
   display_order, field_label, field_alias, field_value, status)
VALUES
  (8, 145, 'bizdone', 'policyDetails', 15, 'businessMonth',      'businessMonth',      'businessMonth',      'active'),
  (8, 146, 'bizdone', 'policyDetails', 16, 'dateOfBusiness',     'dateOfBusiness',     'dateOfBusiness',     'active'),
  (8,  27, 'bizdone', 'policyDetails', 19, 'associateCrm',       'associateCrm',       'associateCrm',       'active'),
  (8, 137, 'bizdone', 'policyDetails', 20, 'leadCrm',            'leadCrm',            'leadCrm',            'active'),
  (8, 141, 'bizdone', 'policyDetails', 21, 'crmTeamLead',        'crmTeamLead',        'crmTeamLead',        'active'),
  (8, 143, 'bizdone', 'policyDetails', 22, 'crmManager',         'crmManager',         'crmManager',         'active'),
  (8, 134, 'bizdone', 'policyDetails', 23, 'accountManager',     'accountManager',     'accountManager',     'active'),
  (8, 144, 'bizdone', 'policyDetails', 24, 'centralOpsTeamLead', 'centralOpsTeamLead', 'centralOpsTeamLead', 'active'),
  (8, 140, 'bizdone', 'policyDetails', 25, 'centralOpsLead',     'centralOpsLead',     'centralOpsLead',     'active'),
  (8, 135, 'bizdone', 'policyDetails', 54, 'iworkUniqueId',      'iworkUniqueId',      'iworkUniqueId',      'active');

COMMIT;

-- Verify: expect 71 / 71 / 71 / 71 (no duplicate label, value or order) and max = 71.
-- SELECT count(*), count(DISTINCT field_label), count(DISTINCT field_value),
--        count(DISTINCT display_order), max(display_order)
-- FROM localization_report_fields_country_map
-- WHERE country_id = 8 AND report_section = 'bizdone' AND activity_section = 'policyDetails';

-- ---------------------------------------------------------------------------
-- Broker Agent column (policy.broker_id -> broker.display_name), added for all
-- countries. The policyDetails query already selects the brokerName alias;
-- these rows make it a real localization-config column, appended last in each
-- country's sequence. Guarded, so re-running is a no-op.
-- ---------------------------------------------------------------------------

BEGIN;

-- 1. Master field key.
INSERT INTO localization_report_fields
  (field_key, data_type, required, active, entity_type, description)
SELECT 'brokerName', 'string', false, true, 'policyDetails', 'Broker Agent'
WHERE NOT EXISTS (
  SELECT 1 FROM localization_report_fields WHERE field_key = 'brokerName'
);

INSERT INTO localization_report_fields_country_map
  (country_id, regulatory_key_id, report_section, activity_section,
   display_order, field_label, field_alias, field_value, status)
SELECT m.country_id,
       (SELECT MIN(id) FROM localization_report_fields WHERE field_key = 'brokerName'),
       'bizdone', 'policyDetails', MAX(m.display_order) + 1,
       'brokerName', 'brokerName', 'brokerName', 'active'
FROM localization_report_fields_country_map m
WHERE m.report_section = 'bizdone'
  AND m.activity_section = 'policyDetails'
GROUP BY m.country_id
HAVING NOT EXISTS (
  SELECT 1
  FROM localization_report_fields_country_map x
  WHERE x.country_id = m.country_id
    AND x.report_section = 'bizdone'
    AND x.activity_section = 'policyDetails'
    AND x.field_label = 'brokerName'
);

COMMIT;