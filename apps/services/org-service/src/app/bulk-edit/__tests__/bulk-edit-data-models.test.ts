/**
 * Unit tests for bulk edit error codes and field configurations
 */

import {
  BulkEditErrorCode,
  ValidationErrorCode,
  BulkEditErrorMessages,
  ValidationErrorMessages
} from '../enums/bulk-edit-error-codes.enum';

import {
  CompanyBulkEditFields,
  OpportunityBulkEditFields,
  PolicyBulkEditFields,
  ENTITY_BULK_EDITABLE_FIELDS,
  COMPANY_FIELD_CONFIG,
  OPPORTUNITY_FIELD_CONFIG,
  POLICY_FIELD_CONFIG,
  isFieldBulkEditable,
  getFieldConfig
} from '../enums/bulk-edit-fields.enum';

/**
 * Simple test framework for data model validation
 */
class TestRunner {
  private tests: Array<{ name: string; fn: () => void }> = [];
  private results: Array<{ name: string; passed: boolean; error?: string }> = [];

  test(name: string, fn: () => void) {
    this.tests.push({ name, fn });
  }

  run(): { passed: number; failed: number; total: number } {
    console.log('Running Bulk Edit Data Model Tests...\n');

    for (const test of this.tests) {
      try {
        test.fn();
        this.results.push({ name: test.name, passed: true });
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.results.push({ 
          name: test.name, 
          passed: false, 
          error: error instanceof Error ? error.message : String(error)
        });
        console.log(`❌ ${test.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log(`\nTest Results: ${passed} passed, ${failed} failed, ${this.tests.length} total`);
    
    return { passed, failed, total: this.tests.length };
  }
}

// Simple assertion functions
function assertEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, but got ${actual}`);
  }
}

function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Expected condition to be true');
  }
}

function assertFalse(condition: boolean, message?: string) {
  if (condition) {
    throw new Error(message || 'Expected condition to be false');
  }
}

function assertArrayLength(array: any[], expectedLength: number, message?: string) {
  if (!Array.isArray(array) || array.length !== expectedLength) {
    throw new Error(message || `Expected array length ${expectedLength}, but got ${array?.length || 'not an array'}`);
  }
}

function assertContains<T>(array: T[], item: T, message?: string) {
  if (!Array.isArray(array) || !array.includes(item)) {
    throw new Error(message || `Expected array to contain ${item}`);
  }
}

// Create test runner instance
const testRunner = new TestRunner();

// Error Code Tests
testRunner.test('BulkEditErrorCode enum should contain all required error codes', () => {
  assertTrue(Object.values(BulkEditErrorCode).includes(BulkEditErrorCode.PERMISSION_DENIED));
  assertTrue(Object.values(BulkEditErrorCode).includes(BulkEditErrorCode.INVALID_FIELD_VALUE));
  assertTrue(Object.values(BulkEditErrorCode).includes(BulkEditErrorCode.RECORD_NOT_FOUND));
  assertTrue(Object.values(BulkEditErrorCode).includes(BulkEditErrorCode.VALIDATION_FAILED));
  assertTrue(Object.values(BulkEditErrorCode).includes(BulkEditErrorCode.DATABASE_ERROR));
  assertTrue(Object.values(BulkEditErrorCode).includes(BulkEditErrorCode.INVALID_ENTITY_TYPE));
});

testRunner.test('ValidationErrorCode enum should contain validation-specific codes', () => {
  assertTrue(Object.values(ValidationErrorCode).includes(ValidationErrorCode.REQUIRED_FIELD_MISSING));
  assertTrue(Object.values(ValidationErrorCode).includes(ValidationErrorCode.INVALID_FIELD_TYPE));
  assertTrue(Object.values(ValidationErrorCode).includes(ValidationErrorCode.FIELD_TOO_LONG));
  assertTrue(Object.values(ValidationErrorCode).includes(ValidationErrorCode.VALUE_OUT_OF_RANGE));
});

testRunner.test('Error messages should exist for all error codes', () => {
  for (const errorCode of Object.values(BulkEditErrorCode)) {
    assertTrue(errorCode in BulkEditErrorMessages, `Missing error message for ${errorCode}`);
    assertTrue(BulkEditErrorMessages[errorCode].length > 0, `Empty error message for ${errorCode}`);
  }
});

testRunner.test('Validation error messages should exist for all validation codes', () => {
  for (const errorCode of Object.values(ValidationErrorCode)) {
    assertTrue(errorCode in ValidationErrorMessages, `Missing validation error message for ${errorCode}`);
    assertTrue(ValidationErrorMessages[errorCode].length > 0, `Empty validation error message for ${errorCode}`);
  }
});

// Field Configuration Tests
testRunner.test('Company bulk editable fields should be correctly defined', () => {
  assertContains(Object.values(CompanyBulkEditFields), CompanyBulkEditFields.LEAD_CRM);
  assertContains(Object.values(CompanyBulkEditFields), CompanyBulkEditFields.ACCOUNT_MANAGER);
  assertContains(Object.values(CompanyBulkEditFields), CompanyBulkEditFields.STATUS);
  assertContains(Object.values(CompanyBulkEditFields), CompanyBulkEditFields.PRIORITY);
});

testRunner.test('Opportunity bulk editable fields should be correctly defined', () => {
  assertContains(Object.values(OpportunityBulkEditFields), OpportunityBulkEditFields.BD_OWNER);
  assertContains(Object.values(OpportunityBulkEditFields), OpportunityBulkEditFields.ISG_OWNER);
  assertContains(Object.values(OpportunityBulkEditFields), OpportunityBulkEditFields.STATUS);
  assertContains(Object.values(OpportunityBulkEditFields), OpportunityBulkEditFields.EXPIRY_DATE);
});

testRunner.test('Policy bulk editable fields should be correctly defined', () => {
  assertContains(Object.values(PolicyBulkEditFields), PolicyBulkEditFields.LEAD_CRM);
  assertContains(Object.values(PolicyBulkEditFields), PolicyBulkEditFields.ISG_OWNER);
  assertContains(Object.values(PolicyBulkEditFields), PolicyBulkEditFields.ACCOUNT_MANAGER);
  assertContains(Object.values(PolicyBulkEditFields), PolicyBulkEditFields.STATUS);
});

testRunner.test('Entity bulk editable fields mapping should be correct', () => {
  assertArrayLength(ENTITY_BULK_EDITABLE_FIELDS.company, 4, 'Company should have 4 bulk editable fields');
  assertArrayLength(ENTITY_BULK_EDITABLE_FIELDS.opportunity, 4, 'Opportunity should have 4 bulk editable fields');
  assertArrayLength(ENTITY_BULK_EDITABLE_FIELDS.policy, 4, 'Policy should have 4 bulk editable fields');
});

testRunner.test('isFieldBulkEditable function should work correctly', () => {
  // Test valid fields
  assertTrue(isFieldBulkEditable('company', 'lead_crm'));
  assertTrue(isFieldBulkEditable('opportunity', 'bd_owner'));
  assertTrue(isFieldBulkEditable('policy', 'status'));

  // Test invalid fields
  assertFalse(isFieldBulkEditable('company', 'invalid_field'));
  assertFalse(isFieldBulkEditable('invalid_entity', 'status'));
  assertFalse(isFieldBulkEditable('company', 'bd_owner')); // bd_owner is for opportunity, not company
});

testRunner.test('getFieldConfig function should return correct configurations', () => {
  // Test company field config
  const companyStatusConfig = getFieldConfig('company', 'status');
  assertTrue(companyStatusConfig !== null, 'Company status config should not be null');
  assertEqual(companyStatusConfig?.fieldName, 'status');
  assertEqual(companyStatusConfig?.dataType, 'string');

  // Test opportunity field config
  const opportunityDateConfig = getFieldConfig('opportunity', 'expiry_date');
  assertTrue(opportunityDateConfig !== null, 'Opportunity expiry_date config should not be null');
  assertEqual(opportunityDateConfig?.fieldName, 'expiry_date');
  assertEqual(opportunityDateConfig?.dataType, 'date');

  // Test invalid configs
  const invalidConfig = getFieldConfig('company', 'invalid_field');
  assertEqual(invalidConfig, null, 'Invalid field config should return null');
});

testRunner.test('Field configurations should have required properties', () => {
  // Test company field configs
  for (const [fieldName, config] of Object.entries(COMPANY_FIELD_CONFIG)) {
    assertTrue(config.fieldName === fieldName, `Field name mismatch for ${fieldName}`);
    assertTrue(['string', 'number', 'boolean', 'date'].includes(config.dataType), `Invalid data type for ${fieldName}`);
    assertTrue(typeof config.required === 'boolean', `Required property should be boolean for ${fieldName}`);
    assertTrue(typeof config.canClear === 'boolean', `CanClear property should be boolean for ${fieldName}`);
  }

  // Test opportunity field configs
  for (const [fieldName, config] of Object.entries(OPPORTUNITY_FIELD_CONFIG)) {
    assertTrue(config.fieldName === fieldName, `Field name mismatch for ${fieldName}`);
    assertTrue(['string', 'number', 'boolean', 'date'].includes(config.dataType), `Invalid data type for ${fieldName}`);
    assertTrue(typeof config.required === 'boolean', `Required property should be boolean for ${fieldName}`);
    assertTrue(typeof config.canClear === 'boolean', `CanClear property should be boolean for ${fieldName}`);
  }

  // Test policy field configs
  for (const [fieldName, config] of Object.entries(POLICY_FIELD_CONFIG)) {
    assertTrue(config.fieldName === fieldName, `Field name mismatch for ${fieldName}`);
    assertTrue(['string', 'number', 'boolean', 'date'].includes(config.dataType), `Invalid data type for ${fieldName}`);
    assertTrue(typeof config.required === 'boolean', `Required property should be boolean for ${fieldName}`);
    assertTrue(typeof config.canClear === 'boolean', `CanClear property should be boolean for ${fieldName}`);
  }
});

testRunner.test('Status fields should be required and non-clearable', () => {
  const companyStatus = COMPANY_FIELD_CONFIG[CompanyBulkEditFields.STATUS];
  assertTrue(companyStatus.required, 'Company status should be required');
  assertFalse(companyStatus.canClear, 'Company status should not be clearable');

  const opportunityStatus = OPPORTUNITY_FIELD_CONFIG[OpportunityBulkEditFields.STATUS];
  assertTrue(opportunityStatus.required, 'Opportunity status should be required');
  assertFalse(opportunityStatus.canClear, 'Opportunity status should not be clearable');

  const policyStatus = POLICY_FIELD_CONFIG[PolicyBulkEditFields.STATUS];
  assertTrue(policyStatus.required, 'Policy status should be required');
  assertFalse(policyStatus.canClear, 'Policy status should not be clearable');
});

testRunner.test('Owner/manager fields should be optional and clearable', () => {
  const companyLeadCrm = COMPANY_FIELD_CONFIG[CompanyBulkEditFields.LEAD_CRM];
  assertFalse(companyLeadCrm.required, 'Company lead_crm should be optional');
  assertTrue(companyLeadCrm.canClear, 'Company lead_crm should be clearable');

  const opportunityBdOwner = OPPORTUNITY_FIELD_CONFIG[OpportunityBulkEditFields.BD_OWNER];
  assertFalse(opportunityBdOwner.required, 'Opportunity bd_owner should be optional');
  assertTrue(opportunityBdOwner.canClear, 'Opportunity bd_owner should be clearable');
});

// Run all tests
export function runBulkEditDataModelTests() {
  return testRunner.run();
}

// Auto-run tests if this file is executed directly
if (require.main === module) {
  runBulkEditDataModelTests();
}