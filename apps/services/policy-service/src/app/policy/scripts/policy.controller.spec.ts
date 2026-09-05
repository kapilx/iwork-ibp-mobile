import { Test, TestingModule } from "@nestjs/testing";
import { PolicyController } from "../policy.controller";
import { PolicyService } from "../policy.service";
interface MockRequest {
  user?: { userDetails?: { userId?: number } };
}

describe("PolicyController", () => {
  let controller: PolicyController;
  const service = {
    createPolicyConfiguration: jest.fn(),
    updatePolicyConfigurationStatus: jest.fn(),
    getDashboardBusinessPerformance: jest.fn(),
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

  it("should call service on policyConfigurationApproval", async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const req: any = { user: { userDetails: { userId: 1 } } };
    await controller.policyConfigurationApproval(
      1,
      { isApproved: true },
      req,
      res
    );
    expect(service.updatePolicyConfigurationStatus).toHaveBeenCalled();
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
});
