// Mock BulkEditService early to avoid loading heavy entity dependencies
jest.mock("../services/bulk-edit.service", () => {
  return {
    BulkEditService: class {
      executeBulkEdit = jest.fn();
      findUsersWithSameRole = jest.fn();
      findUsersByRoleName = jest.fn();
    },
  };
});
import { HttpStatus, HttpException } from "@nestjs/common";
import { BulkEditController } from "./bulk-edit.controller";
import {
  successMessage,
  errorMessages,
} from "../../../../../../../libs/service-lib/src/lib/messages";
import { BulkEditService } from "../services/bulk-edit.service";

// Minimal mock TraceIdService
class MockTraceIdService {
  traceId = "test-trace-id";
}

// Helper to create a mock Express-like response object
function createMockRes() {
  const res: any = {};
  res.status = jest.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((payload: any) => payload);
  return res;
}

describe("BulkEditController - executeBulkEdit", () => {
  let controller: BulkEditController;
  let bulkEditService: jest.Mocked<BulkEditService>;
  let traceIdService: MockTraceIdService;

  beforeEach(() => {
    bulkEditService = {
      executeBulkEdit: jest.fn(),
      findUsersWithSameRole: jest.fn(),
      findUsersByRoleName: jest.fn(),
    } as any;
    traceIdService = new MockTraceIdService();
    controller = new BulkEditController(bulkEditService, traceIdService as any);
  });

  const baseRequest = () => ({
    entityType: "COMPANY",
    recordIds: [1, 2, 3],
    fieldUpdates: { leadCrm: 10 },
  });

  it("should return 200 OK with success message when no errors", async () => {
    const mockRes = createMockRes();
    const executionResult = {
      errors: [],
      totalRecords: 3,
      successCount: 3,
      failureCount: 0,
    } as any;
    bulkEditService.executeBulkEdit.mockResolvedValue(executionResult);

    const req: any = { headers: { userid: "42" } };
    await controller.executeBulkEdit(baseRequest(), mockRes, req);

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.OK,
        message: successMessage.bulkEditExecutionSuccess,
        data: executionResult,
      })
    );
    expect(bulkEditService.executeBulkEdit).toHaveBeenCalled();
  });

  it("should return 206 PARTIAL_CONTENT with partial success message when errors present", async () => {
    const mockRes = createMockRes();
    const executionResult = {
      errors: [{ recordId: 2, reason: "Invalid field" }],
      totalRecords: 3,
      successCount: 2,
      failureCount: 1,
    } as any;
    bulkEditService.executeBulkEdit.mockResolvedValue(executionResult);

    const req: any = { headers: { userid: "99" } };
    await controller.executeBulkEdit(baseRequest(), mockRes, req);

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.PARTIAL_CONTENT);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.PARTIAL_CONTENT,
        message: successMessage.bulkEditExecutionPartialSuccess(
          executionResult.failureCount,
          executionResult.totalRecords
        ),
        data: executionResult,
      })
    );
  });

  it("should handle validation failure and return 400", async () => {
    const mockRes = createMockRes();
    const req: any = { headers: { userid: "7" } };
    const validationError = new Error(
      "bulk edit validation failed - validation failed for field"
    );
    bulkEditService.executeBulkEdit.mockRejectedValue(validationError);

    await controller.executeBulkEdit(baseRequest(), mockRes, req);

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: errorMessages.bulkEditValidationRequestFailed,
        error: validationError.message,
      })
    );
  });

  it("should handle generic execution error and return 500", async () => {
    const mockRes = createMockRes();
    const req: any = { headers: { userid: "11" } };
    const genericError = new Error("unexpected downstream error");
    bulkEditService.executeBulkEdit.mockRejectedValue(genericError);

    await controller.executeBulkEdit(baseRequest(), mockRes, req);

    expect(mockRes.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR
    );
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: errorMessages.bulkEditInternalServerError,
        error: genericError.message,
      })
    );
  });
});

describe("BulkEditController - findUsersByRole", () => {
  let controller: BulkEditController;
  let bulkEditService: jest.Mocked<BulkEditService>;
  let traceIdService: MockTraceIdService;

  beforeEach(() => {
    bulkEditService = {
      executeBulkEdit: jest.fn(),
      findUsersWithSameRole: jest.fn(),
      findUsersByRoleName: jest.fn(),
    } as any;
    traceIdService = new MockTraceIdService();
    controller = new BulkEditController(bulkEditService, traceIdService as any);
  });

  function createReq(userId: number) {
    return { params: { userId: String(userId) } } as any;
  }

  it("should return peers successfully", async () => {
    const mockRes = createMockRes();
    const peers = [{ id: 1 }, { id: 2 }];
    bulkEditService.findUsersWithSameRole.mockResolvedValue(peers as any);

    await controller.findUsersByRole(mockRes as any, createReq(55));

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatus.OK,
        message: successMessage.bulkAssignmentPeersRetrieved,
        data: peers,
      })
    );
    expect(bulkEditService.findUsersWithSameRole).toHaveBeenCalledWith(55);
  });

  it("should handle HttpException from service", async () => {
    const mockRes = createMockRes();
    const httpError = new HttpException(
      "role fetch failed",
      HttpStatus.BAD_REQUEST
    );
    bulkEditService.findUsersWithSameRole.mockRejectedValue(httpError);

    await controller.findUsersByRole(mockRes as any, createReq(77));

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatus.BAD_REQUEST,
        message: httpError.message,
      })
    );
  });

  it("should handle generic error from service", async () => {
    const mockRes = createMockRes();
    const genericError = new Error("db unavailable");
    bulkEditService.findUsersWithSameRole.mockRejectedValue(genericError);

    await controller.findUsersByRole(mockRes as any, createReq(88));

    expect(mockRes.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR
    );
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: genericError.message,
      })
    );
  });
});

describe("BulkEditController - findUsersByRoleName", () => {
  let controller: BulkEditController;
  let bulkEditService: jest.Mocked<BulkEditService>;
  let traceIdService: MockTraceIdService;

  beforeEach(() => {
    bulkEditService = {
      executeBulkEdit: jest.fn(),
      findUsersWithSameRole: jest.fn(),
      findUsersByRoleName: jest.fn(),
    } as any;
    traceIdService = new MockTraceIdService();
    controller = new BulkEditController(bulkEditService, traceIdService as any);
  });

  function createRes() {
    return createMockRes();
  }

  it("should return users for role name successfully", async () => {
    const mockRes = createRes();
    const users = [{ id: 10 }];
    bulkEditService.findUsersByRoleName.mockResolvedValue(users as any);

    await controller.findUsersByRoleName(
      "ACCOUNT_MANAGER",
      "123",
      mockRes as any
    );

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatus.OK,
        message: successMessage.usersByRoleRetrieved,
        data: users,
      })
    );
    expect(bulkEditService.findUsersByRoleName).toHaveBeenCalledWith(
      "ACCOUNT_MANAGER",
      123
    );
  });

  it("should return 400 for invalid organisation id", async () => {
    const mockRes = createRes();

    await controller.findUsersByRoleName("OWNER", "abc", mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatus.BAD_REQUEST,
        message: "Invalid organisation ID. Must be a valid number.",
      })
    );
    expect(bulkEditService.findUsersByRoleName).not.toHaveBeenCalled();
  });

  it("should handle HttpException for role name", async () => {
    const mockRes = createRes();
    const httpError = new HttpException(
      "role users fetch failed",
      HttpStatus.NOT_FOUND
    );
    bulkEditService.findUsersByRoleName.mockRejectedValue(httpError);

    await controller.findUsersByRoleName("OWNER", "999", mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatus.NOT_FOUND,
        message: httpError.message,
      })
    );
  });

  it("should handle generic error for role name", async () => {
    const mockRes = createRes();
    const genericError = new Error("service timeout");
    bulkEditService.findUsersByRoleName.mockRejectedValue(genericError);

    await controller.findUsersByRoleName("OWNER", "100", mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR
    );
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: genericError.message,
      })
    );
  });
});
