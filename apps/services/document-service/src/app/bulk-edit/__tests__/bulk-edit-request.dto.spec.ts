import "reflect-metadata";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { BulkEditRequestDto } from "../dto/bulk-edit-request.dto";
import { EntityType } from "../enums/field-operation.enum";

describe("BulkEditRequestDto", () => {
  const baseValidRequest = {
    entityType: EntityType.COMPANY,
    recordIds: [1, 2, 3],
    fieldUpdates: { status: "active" },
    userId: 123,
  };

  it("passes validation with valid request", async () => {
    const request = plainToClass(BulkEditRequestDto, baseValidRequest);
    const errors = await validate(request);
    expect(errors).toHaveLength(0);
  });

  it("fails validation with invalid entityType", async () => {
    const request = plainToClass(BulkEditRequestDto, {
      ...baseValidRequest,
      entityType: "INVALID" as any,
    });
    const errors = await validate(request);
    expect(errors.some((e) => e.property === "entityType")).toBe(true);
  });

  it("fails validation with non-numeric recordIds", async () => {
    const request = plainToClass(BulkEditRequestDto, {
      ...baseValidRequest,
      recordIds: [1, "bad", 3] as any,
    });
    const errors = await validate(request);
    expect(errors.some((e) => e.property === "recordIds")).toBe(true);
  });

  // Note: current validation treats empty object as present; ensure it passes
  it("treats empty fieldUpdates object as valid (presence only)", async () => {
    const request = plainToClass(BulkEditRequestDto, {
      ...baseValidRequest,
      fieldUpdates: {},
    });
    const errors = await validate(request);
    expect(errors.some((e) => e.property === "fieldUpdates")).toBe(false);
  });

  it("passes validation for POLICY entity type", async () => {
    const request = plainToClass(BulkEditRequestDto, {
      ...baseValidRequest,
      entityType: EntityType.POLICY,
    });
    const errors = await validate(request);
    expect(errors.some((e) => e.property === "entityType")).toBe(false);
  });

  it("passes validation for OPPORTUNITY entity type", async () => {
    const request = plainToClass(BulkEditRequestDto, {
      ...baseValidRequest,
      entityType: EntityType.OPPORTUNITY,
    });
    const errors = await validate(request);
    expect(errors.some((e) => e.property === "entityType")).toBe(false);
  });
});
