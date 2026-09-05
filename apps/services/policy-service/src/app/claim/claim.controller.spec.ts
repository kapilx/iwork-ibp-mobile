import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import type { Response } from "express";
import { ClaimController } from "./claim.controller";
import { ClaimService } from "./claim.service";
import { createResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { successMessage } from "../../../../../../libs/service-lib/src/lib/messages";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";

describe("ClaimController", () => {
  let controller: ClaimController;
  const mockClaimService = {
    uploadClaim: jest.fn(),
    getEmployeeClaim: jest.fn(),
    getPolicyClaim: jest.fn(),
    getPolicyTypes: jest.fn(),
  };

  const mockTraceIdService = { traceId: "test-trace" } as TraceIdService;

  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  const reqMock = { headers: { userid: "1" } } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClaimController],
      providers: [
        { provide: ClaimService, useValue: mockClaimService },
        { provide: TraceIdService, useValue: mockTraceIdService },
      ],
    }).compile();

    controller = module.get<ClaimController>(ClaimController);
  });

  it("should upload claim", async () => {
    const res = mockResponse();
    const data = { fileId: 1, processedCount: 1 };
    mockClaimService.uploadClaim.mockResolvedValue(data);

    await controller.uploadClaim({ fileId: 1 }, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      createResponse(201, successMessage.claimUploaded, data)
    );
  });

  it("should handle error in uploadClaim", async () => {
    const res = mockResponse();
    mockClaimService.uploadClaim.mockRejectedValue(new Error("fail"));

    await controller.uploadClaim({ fileId: 1 }, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 404 if uploadClaim throws NotFoundException", async () => {
    const res = mockResponse();
    mockClaimService.uploadClaim.mockRejectedValue(
      new NotFoundException("not found")
    );

    await controller.uploadClaim({ fileId: 1 }, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should get employee claim", async () => {
    const res = mockResponse();
    const data: any[] = [];
    mockClaimService.getEmployeeClaim.mockResolvedValue(data);

    await controller.getEmployeeClaim({ employeeId: 1 }, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      createResponse(200, successMessage.employeeClaimRetrieved, data)
    );
  });

  it("should handle error in getEmployeeClaim", async () => {
    const res = mockResponse();
    mockClaimService.getEmployeeClaim.mockRejectedValue(new Error("err"));

    await controller.getEmployeeClaim({ employeeId: 1 }, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should get policy claim", async () => {
    const res = mockResponse();
    const data = { data: [], count: 0 };
    mockClaimService.getPolicyClaim.mockResolvedValue(data);

    await controller.getPolicyClaim(
      { policyId: 1 },
      { page: 1, limit: 10 } as any,
      res,
      reqMock
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      createResponse(200, successMessage.policyClaimRetrieved, data)
    );
  });

  it("should handle error in getPolicyClaim", async () => {
    const res = mockResponse();
    mockClaimService.getPolicyClaim.mockRejectedValue(new Error("err"));

    await controller.getPolicyClaim(
      { policyId: 1 },
      { page: 1, limit: 10 } as any,
      res,
      reqMock
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should get policy types", async () => {
    const res = mockResponse();
    const data = { policyTypes: ["Type"], policies: [] };
    mockClaimService.getPolicyTypes.mockResolvedValue(data);

    await controller.getPolicyTypes({} as any, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      createResponse(200, successMessage.claimListRetrieved, data)
    );
  });

});
