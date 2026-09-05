import {
  EnrollmentUploadScheduler,
  filterRowsByValuesIgnoreCase,
} from "./enrollment-upload.scheduler";
import {
  findRelationIndex,
  isWithin24Hours,
} from "../../../../service-lib/src/lib/utils/company-employee-upload.util";

describe('findRelationIndex', () => {
  it('should detect the relationship column', () => {
    const headers = ['EmployeeId', 'Relationship', 'Name'];
    expect(findRelationIndex(headers)).toBe(1);
  });

  it('should detect the relation column', () => {
    const headers = ['EmployeeId', 'Relation', 'Name'];
    expect(findRelationIndex(headers)).toBe(1);
  });

  it('should return -1 when not found', () => {
    const headers = ['EmployeeId', 'Name'];
    expect(findRelationIndex(headers)).toBe(-1);
  });
});

describe("isWithin24Hours", () => {
  it("should return true for a date within the past 24 hours", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    expect(isWithin24Hours(past, now)).toBe(true);
  });

  it("should return true for a date within the next 24 hours", () => {
    const now = new Date();
    const future = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    expect(isWithin24Hours(future, now)).toBe(true);
  });

  it("should return false when outside the 24 hour window", () => {
    const now = new Date();
    const far = new Date(now.getTime() + 30 * 60 * 60 * 1000); // 30 hours later
    expect(isWithin24Hours(far, now)).toBe(false);
  });
});

describe("filterRowsByValuesIgnoreCase", () => {
  it("should map matching rows to objects using headers", () => {
    const rows = [
      ["ID", "Name"],
      ["1", "John"],
      ["2", "Jane"],
    ];
    const result = filterRowsByValuesIgnoreCase(rows, ["1"], ["ID", "Name"]);
    expect(result).toEqual([{ ID: "1", Name: "John" }]);

  });
});

describe("getEmployeeRelationTypes", () => {
  it("should map dependent relations to relation types", () => {
    const relationships: any = {
      enabledPolicyRelations: [
        { type: "Self", configuredOptions: [{ name: "Self" }] },
        {
          type: "Spouse/Partner",
          configuredOptions: [{ name: "Husband" }, { name: "Wife" }],
        },
      ],
    };

    const dependents = [{ relation: "Husband" , name : "test"}];

    const context = { logger: { error: jest.fn() }, traceIdService: { traceId: "1" } } as any;

    const result = EnrollmentUploadScheduler.prototype.getEmployeeRelationTypes.call(
      context,
      dependents,
      relationships,
    );

    expect(result).toEqual(["Self", "Spouse/Partner"]);
  });
});

