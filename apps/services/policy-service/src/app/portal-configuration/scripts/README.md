# Hospital Network Database Scripts

This directory contains SQL scripts for setting up the hospital network master data tables.

## Overview

These scripts create the database schema for the Hospital Network feature Phase 1 implementation. The scripts are designed to be idempotent and can be run multiple times safely.

## Files

### 01_create_hospital_master_tables.sql

Creates the core master data tables for the hospital network feature:

1. **mstr_hospital_address** - Hospital address information
2. **mstr_hospital** - Core hospital information
3. **mstr_policy_hospital_map** - Policy-to-hospital mapping with network status
4. **hospital_file_upload_tracking** - File upload tracking and metrics

## Table Structure

### mstr_hospital_address
- Stores hospital address information following existing address table patterns
- Includes city, state, pin code indexing for search optimization
- Contains audit fields (created_at, created_by, updated_at, updated_by, deleted_at, deleted_by)

### mstr_hospital
- Stores core hospital information (name, code)
- References mstr_hospital_address via foreign key
- Includes indexes on code and name for search performance

### mstr_policy_hospital_map
- Maps hospitals to policies with network status (network/excluded)
- Unique constraint prevents duplicate policy-hospital mappings
- Indexes on policy_id, hospital_id, and is_network_hospital for query optimization

### hospital_file_upload_tracking
- Tracks file upload status and processing metrics
- References policy and file_upload tables
- Stores success/error counts and references to result files

## Usage

### Prerequisites

1. Ensure PostgreSQL database is set up and accessible
2. Verify that referenced tables exist:
   - `policy` (existing table)
   - `file_upload` (existing table)

### Running the Scripts

```sql
-- Connect to your database and run:
\i 01_create_hospital_master_tables.sql
```

### Verification

After running the scripts, verify the tables were created successfully:

```sql
-- Check tables
SELECT table_name, table_comment 
FROM information_schema.tables 
WHERE table_name IN ('mstr_hospital_address', 'mstr_hospital', 'mstr_policy_hospital_map', 'hospital_file_upload_tracking')
  AND table_schema = 'public';

-- Check indexes
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename IN ('mstr_hospital_address', 'mstr_hospital', 'mstr_policy_hospital_map', 'hospital_file_upload_tracking')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Check constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('mstr_hospital_address', 'mstr_hospital', 'mstr_policy_hospital_map', 'hospital_file_upload_tracking');
```

## Schema Design Notes

### Constraints and Indexes

1. **Unique Constraints**:
   - `mstr_policy_hospital_map.uk_policy_hospital_map`: Prevents duplicate policy-hospital mappings

2. **Foreign Keys**:
   - All tables reference appropriate parent tables with CASCADE updates and RESTRICT deletes
   - Error and success file references allow NULL on delete

3. **Indexes**:
   - Search-optimized indexes on frequently queried columns
   - City, state, pin code indexes for location-based searches
   - Policy and hospital ID indexes for join optimization

### Audit Trail

All tables include standard audit fields:
- `created_at`, `created_by` - Creation tracking
- `updated_at`, `updated_by` - Modification tracking  
- `deleted_at`, `deleted_by` - Soft deletion support

## Integration Notes

These tables integrate with existing audit logging functionality through:
- Common audit field patterns
- References to existing `policy` and `file_upload` tables
- Support for existing TraceIdService logging patterns

## Migration Strategy

Currently, these scripts are standalone table creation scripts. Future migration management will be handled through:
1. TypeORM migration system (planned for later phase)
2. Version-controlled schema changes
3. Environment-specific deployment scripts

## Related Files

- Entity definitions: `apps/services/service-lib/src/lib/entities/mstr-*.entity.ts`
- Module setup: `apps/services/ibp-service/src/app/hospital-network/`
- Technical specification: `docs/implementation/HOSPITAL-NETWORK/phase-1-technical-spec.md`