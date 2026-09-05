-- Schema and seed data for Service TAT scoring
-- Creates master tables, summary table, and sample configuration rows

CREATE TABLE IF NOT EXISTS mstr_service (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(150) NOT NULL UNIQUE,
    service_display_name VARCHAR(150) NOT NULL,
    service_display_order INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS mstr_org_service_weightage (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL,
    service_id INT NOT NULL REFERENCES mstr_service(id) ON DELETE CASCADE,
    weightage_score NUMERIC(10,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_mstr_org_service_weightage_org_service UNIQUE (org_id, service_id)
);

CREATE TABLE IF NOT EXISTS mstr_tat_bucket (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL,
    tat_label VARCHAR(50) NOT NULL,
    start_day INT NOT NULL,
    end_day INT NOT NULL,
    tat_display_order INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    tat_weight NUMERIC(10,4) NOT NULL DEFAULT 0,
    is_compliant BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_mstr_tat_bucket_day_range CHECK (start_day <= end_day),
    CONSTRAINT uq_mstr_tat_bucket_org_label UNIQUE (org_id, tat_label)
);

CREATE INDEX IF NOT EXISTS idx_mstr_tat_bucket_org_display_order
    ON mstr_tat_bucket (org_id, tat_display_order);

CREATE TABLE IF NOT EXISTS service_tat_score_map (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL REFERENCES mstr_service(id) ON DELETE CASCADE,
    tat_bucket_id INT NOT NULL REFERENCES mstr_tat_bucket(id) ON DELETE CASCADE,
    start_day INT NULL,
    end_day INT NULL,
    tat_weight NUMERIC(10,4) NULL,
    is_compliant BOOLEAN NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_service_tat_score_map_day_range CHECK (
        start_day IS NULL
        OR end_day IS NULL
        OR start_day <= end_day
    ),
    CONSTRAINT uq_service_tat_score_map_service_bucket UNIQUE (service_id, tat_bucket_id)
);

ALTER TABLE service_tat_score_map
    ADD COLUMN IF NOT EXISTS start_day INT,
    ADD COLUMN IF NOT EXISTS end_day INT,
    ADD COLUMN IF NOT EXISTS tat_weight NUMERIC(10,4),
    ADD COLUMN IF NOT EXISTS is_compliant BOOLEAN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'service_tat_score_map'
          AND constraint_name = 'chk_service_tat_score_map_day_range'
    ) THEN
        ALTER TABLE service_tat_score_map
            ADD CONSTRAINT chk_service_tat_score_map_day_range CHECK (
                start_day IS NULL
                OR end_day IS NULL
                OR start_day <= end_day
            );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS org_service_tat_summary (
    id BIGSERIAL PRIMARY KEY,
    org_id INT NOT NULL,
    company_id INT NOT NULL,
    policy_id INT NOT NULL,
    service_id INT NOT NULL REFERENCES mstr_service(id) ON DELETE CASCADE,
    tat_bucket_id INT NOT NULL REFERENCES mstr_tat_bucket(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    event_count INT NOT NULL DEFAULT 0,
    bucket_score NUMERIC(14,4) NOT NULL DEFAULT 0,
    average_tat_days NUMERIC(10,2) NULL,
    tat_weight NUMERIC(10,4) NOT NULL DEFAULT 0,
    is_compliant BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_org_service_tat_summary_unique_snapshot
        UNIQUE (org_id, company_id, policy_id, service_id, tat_bucket_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_org_service_tat_summary_lookup
    ON org_service_tat_summary (org_id, service_id, snapshot_date);

-- Seed data for the master service list
INSERT INTO mstr_service (service_name, service_display_name, service_display_order, status)
VALUES
    ('Endorsement', 'Endorsement', 1, 'ACTIVE'),
    ('Health Claims', 'Health Claims', 2, 'ACTIVE'),
    ('Non Health Claims', 'Non Health Claims', 3, 'ACTIVE'),
    ('MIR', 'MIR', 4, 'ACTIVE'),
    ('Quarterly Meeting', 'Quarterly Meeting', 5, 'ACTIVE'),
    ('Monthly Meeting', 'Monthly Meeting', 6, 'ACTIVE'),
    ('Multilateral Meetings', 'Multilateral Meetings', 7, 'ACTIVE'),
    ('Renewal Notice', 'Renewal Notice', 8, 'ACTIVE'),
    ('Renewal Strategy Report', 'Renewal Strategy Report', 9, 'ACTIVE'),
    ('QCR Submission', 'QCR Submission', 10, 'ACTIVE'),
    ('Value Added Service', 'Value Added Service', 11, 'ACTIVE')
ON CONFLICT (service_name) DO UPDATE
SET service_display_name = EXCLUDED.service_display_name,
    service_display_order = EXCLUDED.service_display_order,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- Seed the default TAT buckets for organisation 1
INSERT INTO mstr_tat_bucket (
    org_id,
    tat_label,
    start_day,
    end_day,
    tat_display_order,
    status,
    tat_weight,
    is_compliant
)
VALUES
    (1, 'TAT1', 0, 7, 1, 'ACTIVE', 1.00, TRUE),
    (1, 'TAT2', 8, 10, 2, 'ACTIVE', 0.85, TRUE),
    (1, 'TAT3', 11, 21, 3, 'ACTIVE', 0.65, TRUE),
    (1, 'TAT4', 22, 30, 4, 'ACTIVE', 0.40, FALSE),
    (1, 'TAT5', 31, 45, 5, 'ACTIVE', 0.20, FALSE),
    (1, 'TAT6', 46, 1000, 6, 'ACTIVE', 0.05, FALSE)
ON CONFLICT (org_id, tat_label) DO UPDATE
SET start_day = EXCLUDED.start_day,
    end_day = EXCLUDED.end_day,
    tat_display_order = EXCLUDED.tat_display_order,
    status = EXCLUDED.status,
    tat_weight = EXCLUDED.tat_weight,
    is_compliant = EXCLUDED.is_compliant,
    updated_at = CURRENT_TIMESTAMP;

-- Map every service to every configured TAT bucket
INSERT INTO service_tat_score_map (service_id, tat_bucket_id)
SELECT s.id, b.id
FROM mstr_service s
JOIN mstr_tat_bucket b ON b.org_id = 1
ON CONFLICT (service_id, tat_bucket_id) DO NOTHING;

-- Example service-level override extending Health Claims TAT1 window
UPDATE service_tat_score_map map
SET start_day = 0,
    end_day = 30
FROM mstr_service s
JOIN mstr_tat_bucket b ON b.org_id = 1 AND b.tat_label = 'TAT1'
WHERE map.service_id = s.id
  AND map.tat_bucket_id = b.id
  AND s.service_name = 'Health Claims';


-- Organisation level weightages for each service (org_id = 1)
INSERT INTO mstr_org_service_weightage (org_id, service_id, weightage_score)
SELECT 1 AS org_id, s.id, weightages.weightage_score
FROM mstr_service s
JOIN (
    VALUES
        ('Endorsement', 0.10),
        ('Health Claims', 0.12),
        ('Non Health Claims', 0.12),
        ('MIR', 0.08),
        ('Quarterly Meeting', 0.07),
        ('Monthly Meeting', 0.07),
        ('Multilateral Meetings', 0.07),
        ('Renewal Notice', 0.10),
        ('Renewal Strategy Report', 0.10),
        ('QCR Submission', 0.10),
        ('Value Added Service', 0.07)
) AS weightages(service_name, weightage_score)
    ON weightages.service_name = s.service_name
ON CONFLICT (org_id, service_id) DO UPDATE
SET weightage_score = EXCLUDED.weightage_score,
    updated_at = CURRENT_TIMESTAMP;

-- Sample summary data showing one compliant and one breach entry
INSERT INTO org_service_tat_summary (
    org_id,
    company_id,
    policy_id,
    service_id,
    tat_bucket_id,
    snapshot_date,
    event_count,
    bucket_score,
    average_tat_days,
    tat_weight,
    is_compliant
)
SELECT
    1,
    1001,
    5001,
    s.id,
    b.id,
    DATE '2024-05-31',
    25,
    25 * b.tat_weight,
    4.2,
    b.tat_weight,
    b.is_compliant
FROM mstr_service s
JOIN mstr_tat_bucket b ON b.org_id = 1 AND b.tat_label = 'TAT1'
WHERE s.service_name = 'Endorsement'
ON CONFLICT (org_id, company_id, policy_id, service_id, tat_bucket_id, snapshot_date) DO UPDATE
SET event_count = EXCLUDED.event_count,
    bucket_score = EXCLUDED.bucket_score,
    average_tat_days = EXCLUDED.average_tat_days,
    tat_weight = EXCLUDED.tat_weight,
    is_compliant = EXCLUDED.is_compliant,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO org_service_tat_summary (
    org_id,
    company_id,
    policy_id,
    service_id,
    tat_bucket_id,
    snapshot_date,
    event_count,
    bucket_score,
    average_tat_days,
    tat_weight,
    is_compliant
)
SELECT
    1,
    1001,
    5001,
    s.id,
    b.id,
    DATE '2024-05-31',
    5,
    5 * b.tat_weight,
    28.5,
    b.tat_weight,
    b.is_compliant
FROM mstr_service s
JOIN mstr_tat_bucket b ON b.org_id = 1 AND b.tat_label = 'TAT5'
WHERE s.service_name = 'Endorsement'
ON CONFLICT (org_id, company_id, policy_id, service_id, tat_bucket_id, snapshot_date) DO UPDATE
SET event_count = EXCLUDED.event_count,
    bucket_score = EXCLUDED.bucket_score,
    average_tat_days = EXCLUDED.average_tat_days,
    tat_weight = EXCLUDED.tat_weight,
    is_compliant = EXCLUDED.is_compliant,
    updated_at = CURRENT_TIMESTAMP;
