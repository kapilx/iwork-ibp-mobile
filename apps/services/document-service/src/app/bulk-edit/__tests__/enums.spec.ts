import { BulkEditErrorCode } from "../enums/bulk-edit-error-code.enum";
import { EntityType, FieldOperation } from "../enums/field-operation.enum";

describe("BulkEdit Enums", () => {
  describe("BulkEditErrorCode", () => {
    it("contains required error codes", () => {
      const expected = [
        "PERMISSION_DENIED",
        "INVALID_FIELD_VALUE",
        "RECORD_NOT_FOUND",
        "CONCURRENT_MODIFICATION",
        "VALIDATION_FAILED",
        "DATABASE_ERROR",
      ];
      const actual = Object.values(BulkEditErrorCode);
      expected.forEach((code) => expect(actual).toContain(code));
    });
  });

  describe("FieldOperation", () => {
    it("defines SET and CLEAR operations", () => {
      expect(FieldOperation.SET).toBe("set");
      expect(FieldOperation.CLEAR).toBe("clear");
    });
    it("has exactly two operations", () => {
      expect(Object.values(FieldOperation)).toHaveLength(2);
    });
  });

  describe("EntityType", () => {
    it("includes all supported entity types (including sales/renewal opportunity)", () => {
      expect(EntityType.COMPANY).toBe("COMPANY");
      expect(EntityType.OPPORTUNITY).toBe("OPPORTUNITY");
      expect(EntityType.POLICY).toBe("POLICY");
      expect(EntityType.SALES_OPPORTUNITY).toBe("SALES_OPPORTUNITY");
      expect(EntityType.RENEWAL_OPPORTUNITY).toBe("RENEWAL_OPPORTUNITY");
    });
    it("has five values now", () => {
      expect(Object.values(EntityType)).toHaveLength(5);
    });
  });
});
