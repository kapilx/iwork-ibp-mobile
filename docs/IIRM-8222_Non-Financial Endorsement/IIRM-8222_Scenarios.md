# Test Scenarios: Non-Financial Employee Update

**Document Version:** 1.0  
**Date:** 21 January 2026  
**Feature:** Non-Financial Employee Data Updates (Name, Gender, DOB)

---

## Story Objective

As a user, I want to update employee Name, gender and DOB for completed inception/endorsement data so that they can simply update these data which will not have any impact to premiums. If there are any impacts then we should reject those records.

---

## Table of Contents

1. [Success Scenarios](#success-scenarios)
2. [Age Restriction Violations](#age-restriction-violations)
3. [Gender Restriction Violations](#gender-restriction-violations)
4. [Validation Errors](#validation-errors)
5. [Not Found Errors](#not-found-errors)
6. [Filtering and Configuration](#filtering-and-configuration)
7. [Batch and Processing](#batch-and-processing)
8. [Edge Cases](#edge-cases)
9. [Test Summary](#test-summary)
10. [Key Business Rules](#key-business-rules)

---

## Success Scenarios

### Scenario 1: Successful Employee Self Update (No Restrictions)

**Given:**
- Policy has NO Age/Gender restrictions configured
- Employee exists in system

**When:**
- User uploads Excel file with UPDATION intake type:
    - Employee ID: EMP001
    - Relation: Self
    - Full Name: "Updated Name"
    - DOB: "1990-05-15"
    - Gender: "Male"

**Then:**
- ✅ System successfully updates employee record
- Record appears in success file
- Database reflects new Name, DOB, and Gender
- No errors generated

---

### Scenario 2: Successful Dependent Update (No Restrictions)

**Given:**
- Policy has NO restrictions configured
- Dependent exists for Employee ID EMP001
- Relation type is valid (Spouse, Son, Daughter, etc.)

**When:**
- User uploads Excel file with UPDATION intake type:
    - Employee ID: EMP001
    - Relation: Spouse
    - Full Name: "Spouse Name"
    - DOB: "1992-08-20"
    - Gender: "Female"

**Then:**
- ✅ System successfully updates dependent record
- Record appears in success file
- Database reflects updated Name, DOB, and Gender
- Dependent identified by Employee ID + Relation combination

---

### Scenario 3: Name-Only Update (With Restrictions Enabled)

**Given:**
- Policy has Age and Gender restrictions enabled
- Age range: 18-60
- Gender updates blocked
- Current employee data: Name="Old Name", DOB="1985-05-05", Gender="Male"

**When:**
- User uploads update with only Name changed:
    - Employee ID: EMP009
    - Full Name: "New Updated Name"
    - DOB: "1985-05-05" (unchanged)
    - Gender: "Male" (unchanged)

**Then:**
- ✅ Update allowed (name change has no premium impact)
- Success record generated
- Database updated with new name only
- DOB and Gender remain unchanged

---

### Scenario 4: Batch Update - Mixed Results

**Given:**
- Upload file contains 1000 records with UPDATION intake type
- Mixed validity:
    - 700 records with valid data within restrictions
    - 200 records with age restriction violations
    - 100 records with missing required fields

**When:**
- User submits file for processing
- System validates each record against policy restrictions

**Then:**
- ✅ 700 records successfully updated (success file)
- ❌ 300 records rejected (error file with remarks)
- Redis batch processing handles 1000-record buckets
- Summary created: Success=700, Error=300, Total=1000
- Performance metrics logged

---

## Age Restriction Violations

### Scenario 5: Age Exceeds Maximum (Employee)

**Given:**
- Policy configuration has Age parameter restriction enabled
- Age range: Min=18, Max=60
- Employee currently 25 years old (DOB: 1999-01-01)

**When:**
- User attempts to update DOB to make age 65:
    - Employee ID: EMP002
    - Relation: Self
    - DOB: "1959-01-01" (65 years old)

**Then:**
- ❌ System rejects the update (premium impact detected)
- Error message: "Updating age is not allowed; Age not within allowed range (18-60)"
- Record appears in error file with rejection reason
- Database remains unchanged
- Original DOB preserved

---

### Scenario 6: Age Exceeds Maximum (Dependent)

**Given:**
- Policy configuration restricts Age for dependents
- Age range for children: Min=1, Max=25
- Dependent currently 5 years old

**When:**
- User attempts to update dependent DOB to make them 30 years old:
    - Employee ID: EMP003
    - Relation: Son
    - DOB: "1994-03-10" (30 years old)

**Then:**
- ❌ System rejects the update
- Error message: "Updating age is not allowed; Age not within allowed range (1-25)"
- Record in error file
- No database changes (premium would be affected by age change)

---

### Scenario 7: Age Below Minimum

**Given:**
- Policy configuration has Age parameter restriction
- Age range: Min=18, Max=60
- Employee currently 25 years old

**When:**
- User attempts to update DOB to make age 16:
    - Employee ID: EMP010
    - DOB: "2008-06-15" (16 years old)

**Then:**
- ❌ System rejects the update
- Error message: "Updating age is not allowed; Age not within allowed range (18-60)"
- Record in error file
- Database unchanged

---

### Scenario 8: Age Boundary - At Minimum (Allowed)

**Given:**
- Policy configuration: Age range Min=18, Max=60
- Employee currently 25 years old

**When:**
- User updates DOB to exactly 18 years old (boundary minimum):
    - DOB calculated to be exactly 18 years from today

**Then:**
- ✅ System allows update (at boundary inclusive)
- Success record generated
- Update processed successfully
- Age validation passes at minimum boundary

---

### Scenario 9: Age Boundary - At Maximum (Allowed)

**Given:**
- Policy configuration: Age range Min=18, Max=60
- Employee currently 55 years old

**When:**
- User updates DOB to exactly 60 years old (boundary maximum):
    - DOB calculated to be exactly 60 years from today

**Then:**
- ✅ System allows update (at boundary inclusive)
- Success record generated
- Update processed successfully
- Age validation passes at maximum boundary

---

### Scenario 10: Age Boundary - Just Outside Maximum

**Given:**
- Policy configuration: Age range Min=18, Max=60

**When:**
- User attempts to update DOB to 60 years + 1 day:
    - DOB makes age 60.002 years (exceeds maximum)

**Then:**
- ❌ System rejects update (exceeds maximum boundary)
- Error message: "Updating age is not allowed; Age not within allowed range (18-60)"
- Record in error file
- Boundary validation enforces strict limits

---

## Gender Restriction Violations

### Scenario 11: Gender Change Not Allowed

**Given:**
- Policy configuration has Gender parameter restriction enabled
- Employee current gender is "Male"
- Gender changes restricted due to premium calculation dependency

**When:**
- User attempts to change gender:
    - Employee ID: EMP004
    - Relation: Self
    - Gender: "Female" (changed from Male)

**Then:**
- ❌ System rejects the update
- Error message: "Updating gender is not allowed"
- Record appears in error file
- Database unchanged (premium calculation depends on gender)

---

### Scenario 12: Both Age AND Gender Violations

**Given:**
- Policy has BOTH Age and Gender parameter restrictions enabled
- Age range: Min=21, Max=60
- Gender updates blocked
- Employee currently: 30 years old, Male

**When:**
- User attempts to update both Age and Gender:
    - Employee ID: EMP005
    - DOB: "1960-01-01" (64 years old - outside range)
    - Gender: "Female" (changed from Male)

**Then:**
- ❌ System rejects the update
- Error message: "Updating age is not allowed; Age not within allowed range (21-60); Updating gender is not allowed"
- Both violations logged in single error message
- Record in error file
- No database changes
- Multiple validation failures reported together

---

## Validation Errors

### Scenario 13: Missing Required Fields (Employee)

**Given:**
- Valid employee ID provided
- Relation: Self
- Policy requires all three fields: Name, DOB, Gender

**When:**
- Upload file missing required fields:
    - Employee ID: EMP006
    - Full Name: (blank/empty)
    - DOB: (blank/empty)
    - Gender: "Male"

**Then:**
- ❌ System rejects record immediately
- Error message: "Full Name is required; DOB is required"
- Record in error file with validation failures
- No update attempt made
- Database unchanged

---

### Scenario 14: Missing Required Fields (Dependent)

**Given:**
- Valid Employee ID exists
- Relation: Daughter
- All three fields required for update

**When:**
- Upload file has partial data:
    - Employee ID: EMP007
    - Relation: Daughter
    - Full Name: "Daughter Name"
    - DOB: (blank/empty)
    - Gender: (blank/empty)

**Then:**
- ❌ System rejects record
- Error message: "DOB is required; Gender is required"
- Record in error file
- No dependent lookup or update attempted

---

### Scenario 15: Invalid Date Format

**Given:**
- Valid employee exists in system
- Policy has age restriction enabled
- DOB field contains invalid date string

**When:**
- User uploads file with invalid DOB format:
    - Employee ID: EMP008
    - DOB: "invalid-date" or "32/13/2020" or "2020-13-45"

**Then:**
- ❌ System detects invalid date during parsing
- Error message includes: "Invalid date of birth format"
- Record in error file
- Update blocked before age validation
- Date parsing exception caught and logged

---

### Scenario 16: Missing Employee ID

**Given:**
- Upload file contains data rows
- Employee ID is primary identifier for all updates

**When:**
- User uploads row with blank Employee ID:
    - Employee ID: (blank/empty)
    - Full Name: "Some Name"
    - DOB: "1990-01-01"
    - Gender: "Male"

**Then:**
- ❌ System rejects immediately (no lookup possible)
- Error message: "Missing Employee ID"
- Record in error file
- No database lookup attempted
- Fails at first validation check

---

## Not Found Errors

### Scenario 17: Employee Not Found

**Given:**
- Employee ID does not exist in company database
- Company ID from policy context
- Relation: Self

**When:**
- User uploads update request:
    - Employee ID: NONEXISTENT123
    - Full Name: "Test Name"
    - DOB: "1985-05-05"
    - Gender: "Male"

**Then:**
- ❌ System cannot find employee record
- Error message: "Employee not found"
- Record in error file
- No update performed
- Database query returns null

---

### Scenario 18: Dependent Not Found

**Given:**
- Valid Employee ID exists in database
- Employee has no dependent matching the specified relation
- Or dependent with that relation doesn't exist

**When:**
- User uploads dependent update:
    - Employee ID: EMP007
    - Relation: Son
    - Full Name: "Son Name"
    - DOB: "2010-05-05"
    - Gender: "Male"

**Then:**
- ❌ System cannot find dependent for Employee ID + Relation combination
- Error message: "Dependent not found"
- Record in error file
- Dependent lookup based on employeeId field returns null

---

## Filtering and Configuration

### Scenario 19: Mock Employee ID Ignored

**Given:**
- Upload contains test/mock employee records
- Mock IDs identified by keywords: "fake", "test", "mock"
- System protects against test data pollution

**When:**
- User uploads file with mock employee:
    - Employee ID: "FAKE001" or "fake_emp" or "test_employee"
    - Full Name: "Test Employee"
    - DOB: "1990-01-01"
    - Gender: "Male"

**Then:**
- ❌ System detects mock ID pattern (case-insensitive)
- Record automatically ignored
- Error message: "Mock employee record ignored"
- Added to error file for tracking
- No processing or lookup attempted
- Prevents test data from affecting production

---

### Scenario 20: Intake Type Filtering

**Given:**
- Upload file contains multiple intake types in same file
- IntakeType column values:
    - 50 rows with IntakeType = "ADDITION"
    - 50 rows with IntakeType = "DELETION"
    - 100 rows with IntakeType = "UPDATION"
- Non-financial updates only process UPDATION type

**When:**
- User submits file for non-financial update processing

**Then:**
- System filters rows by IntakeType = "UPDATION" (case-insensitive)
- Only 100 UPDATION rows processed
- ADDITION and DELETION rows completely ignored
- No error generated for non-UPDATION rows
- Summary reflects only 100 processed records
- Other intake types handled by different workflows

---

### Scenario 21: No Policy Configuration (Unrestricted)

**Given:**
- Policy exists in system
- Policy has NO policy configuration defined
- No Age or Gender parameter restrictions set
- Empty or null configuration object

**When:**
- User uploads updates with any age/gender changes:
    - Employee ID: EMP010
    - DOB: "1950-01-01" (very old age, 76 years)
    - Gender: "Female" (changed from Male)
    - Full Name: "Updated Name"

**Then:**
- ✅ System treats policy as unrestricted
- All updates allowed (no premium impact check performed)
- Success records generated
- Updates processed normally without validation
- No age range or gender restriction checks applied

---

## Batch and Processing

### Scenario 22: Multiple Dependents for Same Employee

**Given:**
- Employee EMP011 exists with 3 enrolled dependents:
    - Spouse (Female, 32 years old)
    - Son (Male, 8 years old)
    - Daughter (Female, 5 years old)
- Upload contains updates for all 3 dependents

**When:**
- User uploads 3 rows with UPDATION intake type:
    - Row 1: Employee ID: EMP011, Relation: Spouse, Name: "Spouse Updated"
    - Row 2: Employee ID: EMP011, Relation: Son, Name: "Son Updated"
    - Row 3: Employee ID: EMP011, Relation: Daughter, Name: "Daughter Updated"

**Then:**
- ✅ System processes each dependent independently
- Dependent identification uses: Employee ID + Relation combination
- All 3 updates successful (if within restrictions)
- Each dependent record updated separately in database
- Summary shows 3 successful dependent updates
- No interference between dependent updates

---

### Scenario 23: Same Employee Multiple Updates

**Given:**
- Upload file contains duplicate employee updates for same Employee ID
- Sequential processing model (row by row)

**When:**
- File has duplicate entries:
    - Row 1: EMP012, Relation: Self, Name: "First Update"
    - Row 50: EMP012, Relation: Self, Name: "Second Update"

**Then:**
- ✅ Both updates processed independently
- Row 1 updates database with "First Update"
- Row 50 overwrites with "Second Update"
- Final database state reflects last update: "Second Update"
- Both rows marked as success in processing
- No duplicate detection or warning issued
- Last write wins strategy

---

### Scenario 24: Large Volume Redis Batch Processing

**Given:**
- Upload file contains 5000 valid records
- All rows have IntakeType = "UPDATION"
- All validation checks passed
- Redis batch processing configured for 1000 records per bucket

**When:**
- System begins batch processing large file

**Then:**
- ✅ Records split into 5 Redis buckets (1000 records each)
- Bucket keys: `policy-non-financial-enrollment:{uploadId}:{timestamp}`
- Each bucket processed sequentially from Redis
- Batch processing pattern:
    - Bucket 1: Records 1-1000
    - Bucket 2: Records 1001-2000
    - Bucket 3: Records 2001-3000
    - Bucket 4: Records 3001-4000
    - Bucket 5: Records 4001-5000
- All 5000 records updated successfully
- Performance metrics logged:
    - enrollmentSubmitStartTime
    - enrollmentSubmitEndTime
    - duration in milliseconds
- Upload status updated to COMPLETED

---

### Scenario 25: Error File Generation

**Given:**
- Upload file contains 100 records
- Processing results:
    - 70 successful updates
    - 30 records with various errors (age violations, missing fields, not found)

**When:**
- File processing completes
- System prepares error reporting

**Then:**
- Error Excel file generated automatically
- Filename format: `policy-{policyId}-nonfinancial-errorfile-{timestamp}.xlsx`
- File uploaded to S3: `uploads/company/{companyType}/errorfiles/`
- Error file structure:
    - All original columns from upload
    - Additional "Remarks" column with specific error messages
    - 30 error rows included
- Error file metadata saved to database
- Error file ID linked in processing summary
- User can download error file for review and correction

---

### Scenario 26: Summary Record Creation

**Given:**
- Upload file completely processed
- All records validated and attempted for update
- Success and error counts tallied

**When:**
- Processing workflow completes (success or partial failure)

**Then:**
- Summary record created in database with:
    - **documentProcessingFileId:** upload.id
    - **policyId:** policy ID from context
    - **sourceFileUploadId:** original uploaded file ID
    - **errorFileUploadId:** error file ID (if errors exist, else null)
    - **successFileUploadId:** success file ID (always null for non-financial)
    - **successCount:** number of successful updates
    - **errorCount:** number of failed records
    - **processCount:** total records processed (successCount + errorCount)
    - **batchId:** upload.id for traceability
    - **endorsementId:** endorsement ID if applicable
- Upload record status updated to: **COMPLETED**
- Processing metrics logged
- Audit trail complete

---

## Edge Cases

### Scenario 27: Whitespace-Only Name

**Given:**
- Upload contains Full Name field with only whitespace characters

**When:**
- User uploads:
    - Full Name: "   " (spaces only) or "\t\t" (tabs)

**Then:**
- ❌ System trims whitespace
- Trimmed value becomes empty string
- Validation fails
- Error message: "Full Name is required"
- Record in error file

---

### Scenario 28: Future Date of Birth

**Given:**
- Upload contains DOB in the future
- Current date: 2026-01-21

**When:**
- User uploads:
    - DOB: "2030-05-15" (4 years in future)

**Then:**
- ❌ Age calculation yields negative age
- System detects invalid age
- Rejected with age range validation error
- Record in error file
- Date logic validation prevents future DOB

---

### Scenario 29: Very Old DOB (1900-01-01)

**Given:**
- Upload contains very old date of birth
- Current date: 2026-01-21
- DOB: 1900-01-01 makes age 126 years

**When:**
- User uploads this DOB

**Then:**
- **If age restriction exists** (e.g., Max=60):
    - ❌ Rejected: "Age not within allowed range"
- **If no restriction**:
    - ✅ Allowed: Update processed
    - Age 126 accepted without validation

---

### Scenario 30: Case-Insensitive Relation Matching

**Given:**
- Upload file contains Relation column with mixed case values
- System needs to identify employee vs dependent records

**When:**
- User uploads various case combinations:
    - "SELF", "Self", "self", "SeLf"
    - "SPOUSE", "Spouse", "spouse"
    - "SON", "Son", "son"
    - "DAUGHTER", "Daughter", "daughter"

**Then:**
- ✅ System normalizes relation to lowercase for comparison
- All variations of "SELF" treated as employee record
- All variations of other relations treated as dependent records
- Case-insensitive matching ensures consistency
- Lookup logic: `relation.toLowerCase() === 'self'`

---

## Test Summary

### Scenario Count by Category

| Category | Scenarios | Result Type |
|----------|-----------|-------------|
| **Success** | 4 | Updates allowed, no premium impact |
| **Age Violations** | 6 | Rejected due to premium impact |
| **Gender Violations** | 2 | Rejected due to premium impact |
| **Validation Errors** | 4 | Data integrity issues |
| **Not Found** | 2 | Entity doesn't exist |
| **Filtering** | 2 | Ignored/filtered records |
| **Batch Processing** | 5 | Large-scale operations |
| **Edge Cases** | 4 | Boundary conditions |
| **Total** | **30** | Comprehensive test coverage |

---

### Test Coverage Matrix

| Test Type | Count | % Coverage |
|-----------|-------|------------|
| Happy Path | 4 | 13.3% |
| Negative Cases | 18 | 60.0% |
| Edge Cases | 4 | 13.3% |
| System/Batch | 4 | 13.3% |

---

### Priority Distribution

| Priority | Scenarios | Description |
|----------|-----------|-------------|
| **P0 - Critical** | 12 | Core functionality, restriction enforcement |
| **P1 - High** | 10 | Validation, error handling |
| **P2 - Medium** | 6 | Batch processing, edge cases |
| **P3 - Low** | 2 | Case sensitivity, boundary tests |

---

## Key Business Rules

### 1. Premium Impact Prevention
- ✅ **Name updates always allowed** - No impact on premium calculation
- ❌ **Age updates blocked if outside policy-defined range** - Direct premium impact
- ❌ **Gender updates blocked if policy restricts** - Premium varies by gender

### 2. Intake Type Filtering
- ✅ Only **UPDATION** intake type processed for non-financial updates
- Other types (ADDITION, DELETION) handled by different workflows
- System filters rows before validation begins

### 3. Entity Identification
- **Employees:** Identified by Employee ID + Relation="Self"
- **Dependents:** Identified by Employee ID + Relation combination (Spouse, Son, Daughter, etc.)
- Case-insensitive relation matching ensures consistency

### 4. Batch Processing Architecture
- Redis-based batch processing for scalability
- **1000 records per bucket** for optimal memory usage
- Sequential bucket processing ensures data consistency
- Batch key format: `policy-non-financial-enrollment:{uploadId}:{timestamp}`

### 5. Data Protection
- ❌ **Mock employee IDs automatically ignored** (FAKE, TEST patterns)
- Prevents test data contamination in production
- Case-insensitive mock ID detection

### 6. Validation Hierarchy
1. **Required fields validation** (Employee ID, Name, DOB, Gender)
2. **Format validation** (Date format, data types)
3. **Entity existence check** (Employee/Dependent lookup)
4. **Business rules validation** (Age range, gender restrictions)
5. **Premium impact assessment** (Final gate before update)

### 7. Error Handling
- Comprehensive error messages with specific failure reasons
- Error file generation for failed records
- All original data preserved in error file + Remarks column
- S3 storage for error files with timestamp-based naming

### 8. Processing Summary
- Every upload generates summary record
- Tracks success/error counts for audit trail
- Links to source file and error file (if applicable)
- Upload status updated to COMPLETED regardless of errors

### 9. Age Boundary Rules
- Age range validation is **inclusive** of min and max values
- Age 18 with range 18-60: ✅ Allowed
- Age 60 with range 18-60: ✅ Allowed
- Age 60.001 with range 18-60: ❌ Rejected

### 10. Update Precedence
- Last update wins for duplicate employee updates
- No duplicate detection or prevention
- Sequential processing model maintains order
- Each update processed independently

---

## Test Execution Guidelines

### Prerequisites
1. ✅ Policy configuration set up with appropriate restrictions
2. ✅ Test employees and dependents enrolled in policy
3. ✅ Redis instance running for batch processing
4. ✅ S3 bucket configured for error file storage
5. ✅ Test data includes valid and invalid scenarios

### Test Data Requirements
- **Employees:** At least 15 test employees with various ages and genders
- **Dependents:** Multiple dependents per employee (Spouse, Children)
- **Age ranges:** Test data covering min, max, within, below, and above boundaries
- **Mock IDs:** Include FAKE/TEST prefixed IDs for filtering tests

### Expected Test Duration
- **Unit Tests:** ~30 minutes (automated)
- **Integration Tests:** ~2 hours (semi-automated)
- **End-to-End Tests:** ~4 hours (manual + automated)
- **Performance Tests:** ~1 hour (5000+ records)

### Success Criteria
- ✅ All 30 scenarios pass with expected outcomes
- ✅ Error messages match specifications
- ✅ Database state reflects expected changes
- ✅ Error files generated correctly with proper remarks
- ✅ Processing summary accurate
- ✅ Performance metrics within acceptable limits (<5 seconds for 1000 records)

---

## Appendix

### A. Excel File Format

**Required Columns:**
- Employee ID (mandatory)
- Relation (mandatory: "Self" or dependent type)
- Full Name / Employee Name (mandatory)
- Date of Birth (mandatory, format: YYYY-MM-DD or DD/MM/YYYY)
- Gender (mandatory: Male/Female)
- Intake Type (mandatory for filtering: UPDATION)

**Optional Columns:**
- Any additional columns preserved in error file

### B. Error Message Catalog

| Error Code | Error Message | Cause |
|------------|---------------|-------|
| ERR-001 | Missing Employee ID | Employee ID field blank |
| ERR-002 | Employee not found | No matching employee in database |
| ERR-003 | Dependent not found | No matching dependent for Employee ID + Relation |
| ERR-004 | Full Name is required | Name field blank or whitespace-only |
| ERR-005 | DOB is required | Date of Birth field blank |
| ERR-006 | Gender is required | Gender field blank |
| ERR-007 | Invalid date of birth format | Date parsing failed |
| ERR-008 | Updating age is not allowed | Age restriction violation |
| ERR-009 | Updating gender is not allowed | Gender restriction in place |
| ERR-010 | Mock employee record ignored | FAKE/TEST ID detected |

### C. Redis Bucket Structure

```json
{
  "bucketId": "policy-non-financial-enrollment:12345:1737446400000",
  "recordCount": 1000,
  "records": [
    {
      "type": "employee",
      "id": 101,
      "data": {
        "name": "Updated Name",
        "dob": "1990-05-15",
        "gender": "Male"
      }
    },
    {
      "type": "dependent",
      "id": 501,
      "data": {
        "name": "Dependent Name",
        "dob": "2010-03-20",
        "gender": "Female"
      }
    }
  ]
}
```

### D. Policy Configuration Example

```json
{
  "parameters": [
    {
      "parameterMasterName": "Age",
      "rangeDetails": [
        {
          "min": 18,
          "max": 60
        }
      ]
    },
    {
      "parameterMasterName": "Gender"
    }
  ]
}
```

---

**Document Owner:** QA Team  
**Last Updated:** 21 January 2026  
**Review Cycle:** Quarterly  
**Related Documents:**
None at this time.
