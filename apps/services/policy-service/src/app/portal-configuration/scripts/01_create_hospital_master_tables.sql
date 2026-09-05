-- Hospital Master Data Tables Creation Script
-- Version: 1.0
-- Created for: TASK-BE-A001 Hospital Network Implementation
-- Database: PostgreSQL

-- ============================================================================
-- 1. MSTR_HOSPITAL_ADDRESS Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS mstr_hospital_address (
    id SERIAL PRIMARY KEY,
    address_line_1 VARCHAR(200) NOT NULL,
    address_line_2 VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pin_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    landmark VARCHAR(200),
    phone_number VARCHAR(20),
    alternate_phone_number VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER NOT NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by INTEGER
);

-- Indexes for mstr_hospital_address
CREATE INDEX IF NOT EXISTS idx_mstr_hospital_address_city ON mstr_hospital_address(city);
CREATE INDEX IF NOT EXISTS idx_mstr_hospital_address_state ON mstr_hospital_address(state);
CREATE INDEX IF NOT EXISTS idx_mstr_hospital_address_pincode ON mstr_hospital_address(pin_code);

-- Comments for mstr_hospital_address
COMMENT ON TABLE mstr_hospital_address IS 'Master table for hospital address information following existing address table structure';
COMMENT ON COLUMN mstr_hospital_address.id IS 'Unique identifier for hospital address';
COMMENT ON COLUMN mstr_hospital_address.address_line_1 IS 'First line of address';
COMMENT ON COLUMN mstr_hospital_address.address_line_2 IS 'Second line of address (optional)';
COMMENT ON COLUMN mstr_hospital_address.city IS 'City name';
COMMENT ON COLUMN mstr_hospital_address.state IS 'State name';
COMMENT ON COLUMN mstr_hospital_address.pin_code IS 'Postal code';
COMMENT ON COLUMN mstr_hospital_address.country IS 'Country name (default: India)';
COMMENT ON COLUMN mstr_hospital_address.landmark IS 'Landmark near address (optional)';

-- ============================================================================
-- 2. MSTR_HOSPITAL Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS mstr_hospital (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address_id INTEGER NOT NULL,
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER NOT NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by INTEGER,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_mstr_hospital_address 
        FOREIGN KEY (address_id) 
        REFERENCES mstr_hospital_address(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Indexes for mstr_hospital
CREATE INDEX IF NOT EXISTS idx_mstr_hospital_code ON mstr_hospital(code);
CREATE INDEX IF NOT EXISTS idx_mstr_hospital_name ON mstr_hospital(name);
CREATE INDEX IF NOT EXISTS idx_mstr_hospital_address_id ON mstr_hospital(address_id);

-- Comments for mstr_hospital
COMMENT ON TABLE mstr_hospital IS 'Master table for hospital information';
COMMENT ON COLUMN mstr_hospital.id IS 'Unique identifier for hospital';
COMMENT ON COLUMN mstr_hospital.name IS 'Hospital name';
COMMENT ON COLUMN mstr_hospital.address_id IS 'Reference to hospital address';
COMMENT ON COLUMN mstr_hospital.code IS 'Unique hospital code for identification';

-- ============================================================================
-- 3. MSTR_POLICY_HOSPITAL_MAP Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS mstr_policy_hospital_map (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER NOT NULL,
    hospital_id INTEGER NOT NULL,
    is_network_hospital BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER NOT NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by INTEGER,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_mstr_policy_hospital_map_policy 
        FOREIGN KEY (policy_id) 
        REFERENCES policy(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_mstr_policy_hospital_map_hospital 
        FOREIGN KEY (hospital_id) 
        REFERENCES mstr_hospital(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Unique Constraint
    CONSTRAINT uk_policy_hospital_map 
        UNIQUE (policy_id, hospital_id)
);

-- Indexes for mstr_policy_hospital_map
CREATE INDEX IF NOT EXISTS idx_mstr_policy_hospital_map_policy ON mstr_policy_hospital_map(policy_id);
CREATE INDEX IF NOT EXISTS idx_mstr_policy_hospital_map_hospital ON mstr_policy_hospital_map(hospital_id);
CREATE INDEX IF NOT EXISTS idx_mstr_policy_hospital_map_network ON mstr_policy_hospital_map(is_network_hospital);

-- Comments for mstr_policy_hospital_map
COMMENT ON TABLE mstr_policy_hospital_map IS 'Mapping table between policies and hospitals with network status';
COMMENT ON COLUMN mstr_policy_hospital_map.id IS 'Unique identifier for policy-hospital mapping';
COMMENT ON COLUMN mstr_policy_hospital_map.policy_id IS 'Reference to policy';
COMMENT ON COLUMN mstr_policy_hospital_map.hospital_id IS 'Reference to hospital';
COMMENT ON COLUMN mstr_policy_hospital_map.is_network_hospital IS 'Whether hospital is in network for this policy';

-- ============================================================================
-- 4. HOSPITAL_FILE_UPLOAD_TRACKING Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS hospital_file_upload_tracking (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER NOT NULL,
    file_id INTEGER NOT NULL,
    file_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    error_count INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    error_file_id INTEGER,
    success_file_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER NOT NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by INTEGER,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_hospital_file_upload_tracking_policy 
        FOREIGN KEY (policy_id) 
        REFERENCES policy(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_hospital_file_upload_tracking_file 
        FOREIGN KEY (file_id) 
        REFERENCES file_upload(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_hospital_file_upload_tracking_error_file 
        FOREIGN KEY (error_file_id) 
        REFERENCES file_upload(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_hospital_file_upload_tracking_success_file 
        FOREIGN KEY (success_file_id) 
        REFERENCES file_upload(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for hospital_file_upload_tracking
CREATE INDEX IF NOT EXISTS idx_hospital_file_upload_tracking_policy ON hospital_file_upload_tracking(policy_id);
CREATE INDEX IF NOT EXISTS idx_hospital_file_upload_tracking_status ON hospital_file_upload_tracking(file_status);
CREATE INDEX IF NOT EXISTS idx_hospital_file_upload_tracking_file ON hospital_file_upload_tracking(file_id);

-- Comments for hospital_file_upload_tracking
COMMENT ON TABLE hospital_file_upload_tracking IS 'Tracking table for hospital file upload status and metrics';
COMMENT ON COLUMN hospital_file_upload_tracking.id IS 'Unique identifier for upload tracking';
COMMENT ON COLUMN hospital_file_upload_tracking.policy_id IS 'Reference to policy';
COMMENT ON COLUMN hospital_file_upload_tracking.file_id IS 'Reference to uploaded file';
COMMENT ON COLUMN hospital_file_upload_tracking.file_status IS 'Processing status (PENDING, PROCESSING, COMPLETED, FAILED)';
COMMENT ON COLUMN hospital_file_upload_tracking.error_count IS 'Number of records with validation errors';
COMMENT ON COLUMN hospital_file_upload_tracking.success_count IS 'Number of successfully processed records';

-- ============================================================================
-- 5. Verification Queries (Optional - for testing)
-- ============================================================================

-- Verify table creation
-- SELECT table_name, table_comment 
-- FROM information_schema.tables 
-- WHERE table_name IN ('mstr_hospital_address', 'mstr_hospital', 'mstr_policy_hospital_map', 'hospital_file_upload_tracking')
--   AND table_schema = 'public';

-- Verify indexes
-- SELECT indexname, tablename, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('mstr_hospital_address', 'mstr_hospital', 'mstr_policy_hospital_map', 'hospital_file_upload_tracking')
--   AND schemaname = 'public'
-- ORDER BY tablename, indexname;

-- ============================================================================
-- End of Script
-- ============================================================================