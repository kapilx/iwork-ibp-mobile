import { Test, TestingModule } from "@nestjs/testing";
import { PolicyController } from "./policy.controller";
import { PolicyService } from "./policy.service";
interface MockRequest {
  user?: { userDetails?: { userId?: number } };
}

describe("PolicyController", () => {
  let controller: PolicyController;
  const service = {
    createPolicyConfiguration: jest.fn(),
    updatePolicyConfigurationStatus: jest.fn(),
    getDashboardBusinessPerformance: jest.fn(),
    createEnrollmentUpload: jest.fn(),
    listEnrollmentUploadSummary: jest.fn(),
    generateEnrollmentTemplate: jest.fn(),
    uploadEndorsementTemplate: jest.fn(),
    createEndorsementFieldMapping: jest.fn(),
    generateEndorsementExcel: jest.fn(),
    listEndorsementBatches: jest.fn(),
    listEndorsementBatchesTracker: jest.fn(),
    getCompanyCautionDeposits: jest.fn(),
    getTatSummary: jest.fn(),
    generateExcelFromJson: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PolicyController],
      providers: [{ provide: PolicyService, useValue: service }],
    }).compile();

    controller = module.get<PolicyController>(PolicyController);
  });

  it("should call service on createConfiguration", async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.createConfiguration({} as any, res);
    expect(service.createPolicyConfiguration).toHaveBeenCalled();
  });

  it("should call service on generateExcelFromJson", async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const req: any = { headers: { userid: "1" } };
    await controller.generateExcelFromJson(
      { fileName: "test", data: { a: "b" } } as any,
      req,
      res
    );
    expect(service.generateExcelFromJson).toHaveBeenCalledWith("test", {
      a: "b",
    });
  });

  it("should call service on policyConfigurationApproval", async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.policyConfigurationApproval(1, { isApproved: true }, res);
    expect(service.updatePolicyConfigurationStatus).toHaveBeenCalled();
  });

  it("should call service on queueEnrollmentUpload", async () => {
    const req: any = { headers: { userid: "2" } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.queueEnrollmentUpload(req, 1, 2, "DOC", res);
    expect(service.createEnrollmentUpload).toHaveBeenCalledWith(
      1,
      2,
      2,
      "DOC",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
  });

  it("should call service on getEnrollmentTemplate", async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.getEnrollmentTemplate(1, res);
    expect(service.generateEnrollmentTemplate).toHaveBeenCalledWith(1);
  });

  it("should call service on listEnrollmentUploadSummary", async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.listEnrollmentUploadSummary(1, 1, 10, undefined, res);
    expect(service.listEnrollmentUploadSummary).toHaveBeenCalledWith(
      1,
      1,
      10,
      undefined,
      undefined,
      undefined
    );
  });

  it("should call service on listEndorsementBatches", async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.listEndorsementBatches(1, 1, 10, res);
    expect(service.listEndorsementBatches).toHaveBeenCalledWith(1, 1, 10);
  });

  it("should call service on uploadEndorsementTemplate", async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.uploadEndorsementTemplate(1, 2, 3, res);
    expect(service.uploadEndorsementTemplate).toHaveBeenCalledWith(1, 2, 3);
  });

  it("should call service on createEndorsementFieldMapping", async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.createEndorsementFieldMapping(
      { insurerId: 1, fieldMap: { a: "b" } } as any,
      res
    );
    expect(service.createEndorsementFieldMapping).toHaveBeenCalledWith(1, {
      a: "b",
    });
  });

  it("should call service on downloadExcel", async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.downloadExcel(1, 2, res);
    expect(service.generateEndorsementExcel).toHaveBeenCalledWith(1, 2);
  });

  it("should call service on listEndorsementBatchesTracker", async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.listEndorsementBatchesTracker(1, 1, 10, res);
    expect(service.listEndorsementBatchesTracker).toHaveBeenCalledWith(
      1,
      1,
      10
    );
  });

  it("should call service on getTatSummary", async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    service.getTatSummary = jest.fn().mockResolvedValue({});
    const req: any = { headers: { userid: "5" } };
    const query: any = { ownerId: 7, viewBy: "team" };
    await controller.getTatSummary(query, req, res);
    expect(service.getTatSummary).toHaveBeenCalledWith(5, query);
  });

  it("should call service on getDashboardBusinessPerformance", async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const createMockReq = (userId = 1): MockRequest => ({
      user: { userDetails: { userId } },
    });
    const req: any = createMockReq(10);
    await controller.getDashboardBusinessPerformance(
      { userId: 1, financialYear: 2024 } as any,
      req,
      res
    );
    expect(service.getDashboardBusinessPerformance).toHaveBeenCalled();
  });

  it("should call service on getCompanyCautionDeposits", async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const req: any = { headers: { userid: "1" } };
    service.getCompanyCautionDeposits = jest.fn().mockResolvedValue({});
    await controller.getCompanyCautionDeposits(
      { search: "", page: 1, limit: 10 } as any,
      res,
      req
    );
    expect(service.getCompanyCautionDeposits).toHaveBeenCalledWith(
      "",
      1,
      10,
      1,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
  });
});
