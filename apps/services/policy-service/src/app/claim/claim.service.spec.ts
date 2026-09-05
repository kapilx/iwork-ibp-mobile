import { Test, TestingModule } from "@nestjs/testing";
import * as XLSX from "xlsx";
import { ClaimService } from "./claim.service";
import { ClaimRepository } from "./claim.repository";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { downloadFromS3 } from "../../../../service-lib/src/lib/utils/file-management.utils";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { QueryFailedError } from "typeorm";
import { OWNER_TYPES } from "../../../../../../libs/service-lib/src/lib/constants";

jest.mock("../../../../service-lib/src/lib/utils/file-management.utils");

describe("ClaimService", () => {
  let service: ClaimService;
  const repo = {
    findFileById: jest.fn(),
    findEmployeePolicyMap: jest.fn(),
    findPolicyById: jest.fn(),
    findDependent: jest.fn(),
    findClaim: jest.fn(),
    saveClaim: jest.fn(),
    saveSettlement: jest.fn(),
    findClaimsByEmployeeId: jest.fn(),
    findClaimsByPolicyId: jest.fn(),
    findAllClaims: jest.fn(),
    findPoliciesByCompanyId: jest.fn(),
    findUniquePolicyTypes: jest.fn(),
    findUserDetails: jest.fn(),
    getBusinessOverviewForUsers: jest.fn(),
    getClaimsOverviewForUsers: jest.fn(),
  } as unknown as ClaimRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimService,
        { provide: ClaimRepository, useValue: repo },
        { provide: TraceIdService, useValue: { traceId: "t" } },
        {
          provide: ScopeService,
          useValue: {
            getNewEmployeeHierarchyByUserId: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<ClaimService>(ClaimService);
    jest.clearAllMocks();
  });

  it("should upload claim data and return processed count", async () => {
    (repo.findFileById as any).mockResolvedValue({ fileKey: "k" });
    (repo.findClaim as any).mockResolvedValue(null);
    const row = { PolicyID: 1, EMP_TPAID: "E1" };
    const ws = XLSX.utils.json_to_sheet([row]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    (downloadFromS3 as jest.Mock).mockResolvedValue(
      XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    );
    (repo.findEmployeePolicyMap as any).mockResolvedValue({ employeeId: 2 });
    (repo.saveClaim as any).mockResolvedValue({ id: 5 });

    const res = await service.uploadClaim(1);
    expect(res).toEqual({ fileId: 1, processedCount: 1 });
    expect(repo.saveClaim).toHaveBeenCalledWith(
      expect.objectContaining({ sourceFileUploadId: 1 })
    );
    expect(repo.saveSettlement).toHaveBeenCalledWith(
      expect.objectContaining({ sourceFileUploadId: 1 })
    );
  });

  it("should parse various date formats", async () => {
    (repo.findFileById as any).mockResolvedValue({ fileKey: "k" });
    (repo.findClaim as any).mockResolvedValue(null);
    const row = {
      PolicyID: 1,
      EMP_TPAID: "E1",
      CLM_DOA: "2024-05-01",
      CLM_DOD: "01/06/2024",
      CLAIM_DT: 45123,
    };
    const ws = XLSX.utils.json_to_sheet([row]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    (downloadFromS3 as jest.Mock).mockResolvedValue(
      XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    );
    (repo.findEmployeePolicyMap as any).mockResolvedValue({ employeeId: 2 });
    (repo.saveClaim as any).mockResolvedValue({ id: 5 });

    await service.uploadClaim(1);
    const args = (repo.saveClaim as jest.Mock).mock.calls[0][0];
    expect(args.claimDateOfAdmission?.getUTCFullYear()).toBe(2024);
    expect(args.claimDateOfAdmission?.getUTCMonth()).toBe(4);
    expect(args.claimDateOfAdmission?.getUTCDate()).toBe(1);
    expect(args.claimDateOfDischarge?.getUTCFullYear()).toBe(2024);
    expect(args.claimDateOfDischarge?.getUTCMonth()).toBe(5);
    expect(args.claimDateOfDischarge?.getUTCDate()).toBe(1);
    expect(args.claimDate?.getUTCFullYear()).toBe(2023);
    expect(args.claimDate?.getUTCMonth()).toBe(6);
    expect(args.claimDate?.getUTCDate()).toBe(16);
  });

  it("should throw if file not found", async () => {
    (repo.findFileById as any).mockResolvedValue(null);
    (repo.findClaim as any).mockResolvedValue(null);
    await expect(service.uploadClaim(1)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it("should throw if employee mapping not found", async () => {
    (repo.findFileById as any).mockResolvedValue({ fileKey: "k" });
    (repo.findClaim as any).mockResolvedValue(null);
    const row = { PolicyID: 1, EMP_TPAID: "E1" };
    const ws = XLSX.utils.json_to_sheet([row]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    (downloadFromS3 as jest.Mock).mockResolvedValue(
      XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    );
    (repo.findEmployeePolicyMap as any).mockResolvedValue(null);
    (repo.findPolicyById as any).mockResolvedValue({ id: 1 });

    await expect(service.uploadClaim(1)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it("should throw if policy not found", async () => {
    (repo.findFileById as any).mockResolvedValue({ fileKey: "k" });
    (repo.findClaim as any).mockResolvedValue(null);
    const row = { PolicyID: 1, EMP_TPAID: "E1" };
    const ws = XLSX.utils.json_to_sheet([row]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    (downloadFromS3 as jest.Mock).mockResolvedValue(
      XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    );
    (repo.findEmployeePolicyMap as any).mockResolvedValue(null);
    (repo.findPolicyById as any).mockResolvedValue(null);

    await expect(service.uploadClaim(1)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it("should throw if required headers missing", async () => {
    (repo.findFileById as any).mockResolvedValue({ fileKey: "k" });
    (repo.findClaim as any).mockResolvedValue(null);
    const row = { OTHER: "1" } as any;
    const ws = XLSX.utils.json_to_sheet([row]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    (downloadFromS3 as jest.Mock).mockResolvedValue(
      XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    );

    await expect(service.uploadClaim(1)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it("should throw if policy id value missing", async () => {
    (repo.findFileById as any).mockResolvedValue({ fileKey: "k" });
    const row = { PolicyID: undefined, EMP_TPAID: "E1" };
    const ws = XLSX.utils.json_to_sheet([row]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    (downloadFromS3 as jest.Mock).mockResolvedValue(
      XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    );

    await expect(service.uploadClaim(1)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it("should map policy claims", async () => {
    const claimDate = new Date();
    const settlementDate = new Date(
      claimDate.getTime() + 2 * 24 * 60 * 60 * 1000
    );
    const claim = {
      policy: {
        company: { companyName: "Comp", priority: { lookUpValue: "High" } },
        policyType: { lookUpValue: "Type1" },
        insurerPolicyNumber: "PN-123",
      },
      claimInsuredId: "C1",
      id: 1,
      claimAmount: 100,
      claimStatus: "PENDING",
      claimType: "Cashless",
      employee: { employeeName: "John Doe" },
      claimDate,
      settlements: [{ settlementDate }],
    } as any;
    (repo.findClaimsByPolicyId as any).mockResolvedValue([[claim], 1]);
    const res = await service.getPolicyClaim(1, 1, 10);
    expect(res).toEqual({
      data: [
        {
          companyName: "Comp",
          claimNumber: "C1",
          policyType: "Type1",
          policyNumber: "PN-123",
          employeeName: "John Doe",
          companyPriority: "High",
          claimDate,
          status: "PENDING",
          claimType: "Cashless",
          tatDays: 2,
          claimAmount: 100,
        },
      ],
      count: 1,
    });
  });

  it("should skip processing if existing claim is completed", async () => {
    (repo.findFileById as any).mockResolvedValue({ fileKey: "k" });
    (repo.findClaim as any).mockResolvedValue({
      id: 1,
      claimStatus: "COMPLETED",
    });
    const row = { PolicyID: 1, EMP_TPAID: "E1", CLAIM_INS_ID: "C1" };
    const ws = XLSX.utils.json_to_sheet([row]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    (downloadFromS3 as jest.Mock).mockResolvedValue(
      XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    );
    (repo.findEmployeePolicyMap as any).mockResolvedValue({ employeeId: 2 });

    const res = await service.uploadClaim(1);
    expect(res).toEqual({ fileId: 1, processedCount: 0 });
    expect(repo.saveClaim).not.toHaveBeenCalled();
  });

  it("should return policy types and policies for a company and insurer", async () => {
    (repo.findPoliciesByCompanyId as any).mockResolvedValue([
      {
        policyId: 1,
        policyType: "Type A",
        policyNumber: "P1",
        policyPremium: 100,
        hasCautionDeposit: true,
      },
      {
        policyId: 2,
        policyType: "Type B",
        policyNumber: "P2",
        policyPremium: 200,
        hasCautionDeposit: false,
      },
    ]);

    const result = await service.getPolicyTypes(10, undefined, undefined, 5, 7);

    expect(repo.findPoliciesByCompanyId).toHaveBeenCalledWith(5, 7);
    expect(result).toEqual({
      policyTypes: ["Type A", "Type B"],
      policies: [
        {
          policyId: 1,
          policyType: "Type A",
          policyNumber: "P1",
          policyPremium: 100,
          hasCautionDeposit: true,
        },
        {
          policyId: 2,
          policyType: "Type B",
          policyNumber: "P2",
          policyPremium: 200,
          hasCautionDeposit: false,
        },
      ],
    });
  });

  it("should fetch unique policy types for hierarchy when no company provided", async () => {
    const scopeMock = (service as any).scopeService; // access private for test
    (scopeMock.getNewEmployeeHierarchyByUserId as jest.Mock).mockResolvedValue([
      { userId: 2 },
      { userId: 3 },
    ]);
    (repo.findUniquePolicyTypes as any).mockResolvedValue(["Type X"]);

    const result = await service.getPolicyTypes(1, undefined, "team");

    expect(scopeMock.getNewEmployeeHierarchyByUserId).toHaveBeenCalledWith(1);
    expect(repo.findUniquePolicyTypes).toHaveBeenCalledWith([2, 3]);
    expect(result).toEqual({ policyTypes: ["Type X"], policies: [] });
  });

  it("should compute dashboard overview for manager scope", async () => {
    (repo.findUserDetails as jest.Mock).mockResolvedValue({ userId: 1 });
    (repo.getBusinessOverviewForUsers as jest.Mock).mockResolvedValue({
      totalCompanyCount: 2,
      totalPolicyCount: 5,
      totalCompaniesPremium: 1000,
      totalCompaniesBrokerage: 125,
    });
    (repo.getClaimsOverviewForUsers as jest.Mock).mockResolvedValue({
      totalClaimsCount: 3,
      totalClaimAmount: 300,
      policiesWithClaimsCount: 2,
      companiesWithClaimsCount: 1,
    });

    const result = await service.getDashboardBusinessOverview(
      1,
      "Q1",
      2024,
      OWNER_TYPES.MANAGER,
      5
    );

    expect(repo.findUserDetails).toHaveBeenCalledWith(1, 5, undefined, undefined, undefined, undefined);
    expect(repo.getBusinessOverviewForUsers).toHaveBeenCalledWith([1], expect.any(Object));
    expect(repo.getClaimsOverviewForUsers).toHaveBeenCalledWith([1], expect.any(Object));
    expect(result).toEqual({
      businessOverview: {
        totalCompanyCount: 2,
        totalPolicyCount: 5,
        totalCompaniesPremium: 1000,
        totalCompaniesBrokerage: 125,
      },
      claimsOverview: {
        totalClaimsCount: 3,
        totalClaimAmount: 300,
        policiesWithClaimsCount: 2,
        companiesWithClaimsCount: 1,
      },
    });
  });

  it("should compute dashboard overview for team scope", async () => {
    const scopeMock = (service as any).scopeService;
    (repo.findUserDetails as jest.Mock).mockResolvedValue(null);
    (scopeMock.getNewEmployeeHierarchyByUserId as jest.Mock).mockResolvedValue([
      { userId: 2, organisationId: 5, sbuId: null, verticalId: null, departmentId: null, branchId: null },
      { userId: 3, organisationId: 6, sbuId: null, verticalId: null, departmentId: null, branchId: null },
    ]);
    (repo.getBusinessOverviewForUsers as jest.Mock).mockResolvedValue({
      totalCompanyCount: 1,
      totalPolicyCount: 2,
      totalCompaniesPremium: 500,
      totalCompaniesBrokerage: 75,
    });
    (repo.getClaimsOverviewForUsers as jest.Mock).mockResolvedValue({
      totalClaimsCount: 0,
      totalClaimAmount: 0,
      policiesWithClaimsCount: 0,
      companiesWithClaimsCount: 0,
    });

    const result = await service.getDashboardBusinessOverview(
      1,
      undefined,
      undefined,
      OWNER_TYPES.TEAM,
      5
    );

    expect(scopeMock.getNewEmployeeHierarchyByUserId).toHaveBeenCalledWith(1);
    expect(repo.getBusinessOverviewForUsers).toHaveBeenCalledWith([2, 3], expect.any(Object));
    expect(repo.getClaimsOverviewForUsers).toHaveBeenCalledWith([2, 3], expect.any(Object));
    expect(result).toEqual({
      businessOverview: {
        totalCompanyCount: 1,
        totalPolicyCount: 2,
        totalCompaniesPremium: 500,
        totalCompaniesBrokerage: 75,
      },
      claimsOverview: {
        totalClaimsCount: 0,
        totalClaimAmount: 0,
        policiesWithClaimsCount: 0,
        companiesWithClaimsCount: 0,
      },
    });
  });

  it("should return empty claims overview when repository yields no data", async () => {
    (repo.findUserDetails as jest.Mock).mockResolvedValue({ userId: 1 });
    (repo.getBusinessOverviewForUsers as jest.Mock).mockResolvedValue({
      totalCompanyCount: 0,
      totalPolicyCount: 0,
      totalCompaniesPremium: 0,
      totalCompaniesBrokerage: 0,
    });
    (repo.getClaimsOverviewForUsers as jest.Mock).mockResolvedValue({
      totalClaimsCount: 0,
      totalClaimAmount: 0,
      policiesWithClaimsCount: 0,
      companiesWithClaimsCount: 0,
    });

    const result = await service.getDashboardBusinessOverview(1);

    expect(repo.getClaimsOverviewForUsers).toHaveBeenCalledWith([1], expect.any(Object));
    expect(result).toEqual({
      businessOverview: {
        totalCompanyCount: 0,
        totalPolicyCount: 0,
        totalCompaniesPremium: 0,
        totalCompaniesBrokerage: 0,
      },
      claimsOverview: {
        totalClaimsCount: 0,
        totalClaimAmount: 0,
        policiesWithClaimsCount: 0,
        companiesWithClaimsCount: 0,
      },
    });
  });

});
