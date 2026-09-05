import { Test, TestingModule } from "@nestjs/testing";
import * as XLSX from "xlsx";
import { PolicyService } from "./policy.service";
import { PolicyRepository } from "./policy.repository";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import {
  EMPLOYEE_ENDORSEMENT_READY,
  POLICY_AUDIT_ACTION_CAUTION_DEPOSIT_ACCOUNT_NUMBER_UPDATED,
  POLICY_AUDIT_ENTITY_CAUTION_DEPOSIT,
  POLICY_SECTION_APPROVAL_DECISION_STATUS,
  POLICY_SECTION_APPROVAL_SECTIONS,
  POLICY_SECTION_APPROVAL_STATUS_VALUE,
  ACL_ACTIONS,
  ACL_CATEGORY,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";

describe("PolicyService", () => {
  let service: PolicyService;
  let scopeServiceMock: { getNewEmployeeHierarchyByUserId: jest.Mock };
  const repo = {
    createPolicyConfiguration: jest.fn(),
    updatePolicyConfiguration: jest.fn(),
    updatePolicyConfigurationStatus: jest.fn(),
    createEnrollmentUpload: jest.fn(),
    listEnrollmentUploadSummary: jest.fn(),
    getLivePolicyConfiguration: jest.fn(),
    findTemplateDocMap: jest.fn(),
    findEnrollmentTemplateDocMap: jest.fn(),
    getFileUploadById: jest.fn(),
    getFileUploadByKey: jest.fn(),
    createFileUploadRecord: jest.fn(),
    createTemplateDocMap: jest.fn(),
    createEnrollmentTemplateDocMap: jest.fn(),
    getPolicyKpiData: jest.fn(),
    saveEndorsementFieldMapping: jest.fn(),
    createEndorsementTemplateDocMap: jest.fn(),
    findEndorsementTemplateDocMap: jest.fn(),
    findAnyEndorsementTemplateDocMap: jest.fn(),
    getEndorsementFieldMapping: jest.fn(),
    listEndorsementReadyEnrollments: jest.fn(),
    updateEmployeeEnrollmentStatus: jest.fn(),
    listEndorsementBatches: jest.fn(),
    getPolicyConstraintsByPolicyId: jest.fn(),
    fetchPolicyById: jest.fn(),
    getEffectiveDateOfEmployee: jest.fn(),
    getPlacementSlipDetailsByPolicyId: jest.fn(),
    getCautionDepositsByPolicy: jest.fn(),
    createEndorsement: jest.fn(),
    getDebitTransactionLookupDetails: jest.fn(),
    getCreditTransactionLookupDetails: jest.fn(),
    getDebitTransactionReferenceDetails: jest.fn(),
    updateCautionDepositBalance: jest.fn(),
    updatePolicyEmployeeEndorsements: jest.fn(),
    listEndorsementBatchesTracker: jest.fn(),
    getTatSummarySnapshot: jest.fn(),
    getCompanyCautionDeposits: jest.fn(),
    updatePolicyCover: jest.fn(),
    updateCautionDepositAccountNumber: jest.fn(),
    createPolicyAuditLogEntry: jest.fn(),
    findOnePolicy: jest.fn(),
    updatePolicySectionStatus: jest.fn(),
    getParentUserWithPrivilege: jest.fn(),
    createPolicySectionApprovalTask: jest.fn(),
    completePolicySectionApprovalTask: jest.fn(),
    getPolicySectionStatuses: jest.fn(),
  };

  let moduleRef: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-05-20T00:00:00.000Z"));
    moduleRef = await Test.createTestingModule({
      providers: [
        PolicyService,
        { provide: PolicyRepository, useValue: repo },
        {
          provide: ScopeService,
          useValue: {
            getNewEmployeeHierarchyByUserId: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(PolicyService);
    scopeServiceMock = moduleRef.get(ScopeService) as any;
    repo.getTatSummarySnapshot.mockReset();
    repo.getTatSummarySnapshot.mockResolvedValue({
      endorsements: [],
      claims: [],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should upload generated excel to S3 with template sheets", async () => {
    const fmUtils = require("../../../../service-lib/src/lib/utils/file-management.utils");
    const uploadSpy = jest
      .spyOn(fmUtils, "uploadToS3")
      .mockResolvedValue("https://example.com/file.xlsx");

    const url = await service.generateExcelFromJson("summary", {
      intakeType: "Renewal",
      coverCode: "COV-100",
      riskLocationType: "Warehouse",
      riskLocationDetail: "Primary site",
      category: "Property",
      coverageType: "Primary",
      quantity: 5,
      uom: "sq.ft",
      rate: 1.5,
      sumInsured: 100000,
      premium: 1500,
      isMainAsset: "Yes",
      subLimitAmount: "25000",
      subLimitDescription: "Water damage",
      subLimitType: "Standard",
      effectiveDate: "2025-01-01",
    });

    expect(uploadSpy).toHaveBeenCalled();
    const [, key, mime] = uploadSpy.mock.calls[0];
    expect(key).toContain("uploads/policy/generated/");
    expect(mime).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(url).toBe("https://example.com/file.xlsx");
    const [buffer] = uploadSpy.mock.calls[0];
    const workbook = XLSX.read(buffer, { type: "buffer" });
    expect(workbook.SheetNames).toEqual(
      expect.arrayContaining(["Asset-Template", "Template Helper"])
    );

    const headers = [
      "Intake Type",
      "Cover code",
      "Risk Location Type",
      "Risk Location Detail",
      "Category",
      "Coverage Type",
      "Quantity",
      "UOM",
      "Rate",
      "Sum Insured",
      "Premium",
      "Is Main Asset",
      "Sub limit Amount",
      "Sub Limit Description",
      "Sub Limit Type",
      "Effective Date",
    ];

    const assetTemplateData = XLSX.utils.sheet_to_json<string[]>(
      workbook.Sheets["Asset-Template"],
      {
        header: 1,
        defval: "",
      }
    );

    expect(assetTemplateData[0]).toEqual(headers);
    const assetTemplateRow = assetTemplateData[1];
    if (!assetTemplateRow) {
      throw new Error("Asset template data row was not generated");
    }
    expect(assetTemplateRow[0]).toBe("Renewal");
    expect(assetTemplateRow[1]).toBe("COV-100");
    expect(assetTemplateRow[2]).toBe("Warehouse");
    expect(assetTemplateRow[3]).toBe("Primary site");
    expect(assetTemplateRow[9]).toBe("100000");
    expect(assetTemplateRow[15]).toBe("2025-01-01");

    const helperTemplateData = XLSX.utils.sheet_to_json<string[]>(
      workbook.Sheets["Template Helper"],
      {
        header: 1,
        defval: "",
      }
    );

    expect(helperTemplateData[0]).toEqual(headers);
    const helperRow = helperTemplateData[1];
    if (!helperRow) {
      throw new Error("Template helper data row was not generated");
    }

    expect(helperRow).toEqual([
      "Inception",
      "FIRE-BLD200",
      "Office - New-4",
      "Sub branch",
      "Property",
      "Primary",
      "1",
      "sq.ft",
      "0.5",
      "500",
      "50000",
      "Yes",
      "",
      "",
      "",
      "2025-09-23",
    ]);

  });

  it("should throw error for empty data", async () => {
    await expect(service.generateExcelFromJson("test", {})).rejects.toThrow(
      "Data must contain at least one key-value pair"
    );
  });

  it("should call repo on createPolicyConfiguration", async () => {
    await service.createPolicyConfiguration({} as any);
    expect(repo.createPolicyConfiguration).toHaveBeenCalled();
  });

  it("should call repo on updatePolicyConfiguration", async () => {
    const dto = {} as any;
    await service.updatePolicyConfiguration(5, dto, 42);
    expect(repo.updatePolicyConfiguration).toHaveBeenCalledWith(5, dto, 42);
  });

  it("should call repo on updatePolicyConfigurationStatus", async () => {
    await service.updatePolicyConfigurationStatus(1, true, 99, "ok");
    expect(repo.updatePolicyConfigurationStatus).toHaveBeenCalledWith(
      1,
      true,
      99,
      "ok"
    );
  });

  it("should throw error when configuration not live", async () => {
    repo.getLivePolicyConfiguration = jest.fn().mockResolvedValue(null);
    await expect(service.generateTemplate(1)).rejects.toThrow(
      "Configuration is not live"
    );
  });

  it("should call repo on listEndorsementBatchesTracker", async () => {
    await service.listEndorsementBatchesTracker(1, 1, 10);
    expect(repo.listEndorsementBatchesTracker).toHaveBeenCalledWith(1, 1, 10);
  });

  it("should return grouped TAT summary for endorsements and claims", async () => {
    const summary = await service.getTatSummary(1, {} as any);

    expect(repo.getTatSummarySnapshot).toHaveBeenCalledWith([1], {
      restrictToCreators: false,
      isLeadership: false,
    });
    expect(summary.endorsements).toEqual(
      expect.objectContaining({
        title: "endorsements",
        totalCount: 3,
      })
    );
    expect(summary.endorsements.buckets).toEqual([
      expect.objectContaining({
        label: "Open > 10 days",
        count: 1,
        range: { from: 11, to: null },
      }),
      expect.objectContaining({
        label: "Open < 10 days",
        count: 1,
        range: { from: 0, to: 10 },
      }),
      expect.objectContaining({
        label: "Closed < 10 days",
        count: 1,
        range: { from: 0, to: 10 },
      }),
    ]);
    summary.endorsements.buckets.forEach((bucket) => {
      expect(bucket).not.toHaveProperty("items");
    });

    expect(summary.claims).toEqual(
      expect.objectContaining({
        title: "claims",
        totalCount: 5,
      })
    );
    expect(summary.claims.buckets).toEqual([
      expect.objectContaining({
        label: "Open > 15 days",
        count: 1,
        range: { from: 16, to: null },
      }),
      expect.objectContaining({
        label: "Open < 15 days",
        count: 1,
        range: { from: 0, to: 15 },
      }),
      expect.objectContaining({
        label: "Closed < 15 days",
        count: 1,
        range: { from: 0, to: 15 },
      }),
      expect.objectContaining({
        label: "Closed in 15 to 30 days",
        count: 1,
        range: { from: 16, to: 30 },
      }),
      expect.objectContaining({
        label: "Closed > 30 days",
        count: 1,
        range: { from: 31, to: null },
      }),
    ]);
    summary.claims.buckets.forEach((bucket) => {
      expect(bucket).not.toHaveProperty("items");
    });
  });

  it("should compute TAT summary from repository snapshot", async () => {
    repo.getTatSummarySnapshot.mockResolvedValue({
      endorsements: [
        {
          id: 501,
          policyId: 1001,
          insurerEndorsementNumber: "END-501",
          insurerAcknowledgementNumber: null,
          endorsementEntryDate: new Date("2024-05-01T00:00:00.000Z"),
          insurerEndorsementDate: null,
          endorsementStatus: "ENDORSEMENT_CREATED",
        },
        {
          id: 502,
          policyId: 1002,
          insurerEndorsementNumber: null,
          insurerAcknowledgementNumber: "ACK-502",
          endorsementEntryDate: new Date("2024-05-15T00:00:00.000Z"),
          insurerEndorsementDate: null,
          endorsementStatus: "ENDORSEMENT_SENT_TO_INSURER",
        },
        {
          id: 503,
          policyId: 1003,
          insurerEndorsementNumber: "END-503",
          insurerAcknowledgementNumber: "ACK-503",
          endorsementEntryDate: new Date("2024-05-05T00:00:00.000Z"),
          insurerEndorsementDate: new Date("2024-05-12T00:00:00.000Z"),
          endorsementStatus: "TPA_ID_UPLOADED",
        },
      ],
      claims: [
        {
          id: 701,
          policyId: 2001,
          claimInsuredId: "CLM-A",
          claimPreAuthId: null,
          claimStatus: "PENDING",
          claimDate: new Date("2024-04-01T00:00:00.000Z"),
          createdAt: new Date("2024-04-01T00:00:00.000Z"),
          settlementDate: null,
        },
        {
          id: 702,
          policyId: 2002,
          claimInsuredId: null,
          claimPreAuthId: "CLM-B",
          claimStatus: "IN_PROGRESS",
          claimDate: new Date("2024-05-10T00:00:00.000Z"),
          createdAt: new Date("2024-05-10T00:00:00.000Z"),
          settlementDate: null,
        },
        {
          id: 703,
          policyId: 2003,
          claimInsuredId: "CLM-C",
          claimPreAuthId: null,
          claimStatus: "APPROVED",
          claimDate: new Date("2024-05-12T00:00:00.000Z"),
          createdAt: new Date("2024-05-02T00:00:00.000Z"),
          settlementDate: new Date("2024-05-12T00:00:00.000Z"),
        },
        {
          id: 704,
          policyId: 2004,
          claimInsuredId: null,
          claimPreAuthId: "CLM-D",
          claimStatus: "SETTLED",
          claimDate: new Date("2024-05-10T00:00:00.000Z"),
          createdAt: new Date("2024-04-15T00:00:00.000Z"),
          settlementDate: new Date("2024-05-10T00:00:00.000Z"),
        },
        {
          id: 705,
          policyId: 2005,
          claimInsuredId: "CLM-E",
          claimPreAuthId: null,
          claimStatus: "SETTLED",
          claimDate: new Date("2024-04-20T00:00:00.000Z"),
          createdAt: new Date("2024-03-01T00:00:00.000Z"),
          settlementDate: new Date("2024-04-20T00:00:00.000Z"),
        },
      ],
    });

    const summary = await service.getTatSummary(1, {} as any);

    expect(repo.getTatSummarySnapshot).toHaveBeenCalledWith([1], {
      restrictToCreators: false,
      isLeadership: false,
    });
    expect(summary.endorsements.totalCount).toBe(3);
    expect(summary.endorsements.title).toBe("endorsements");
    expect(summary.endorsements.buckets[0].count).toBe(1);
    expect(summary.endorsements.buckets[1].count).toBe(1);
    expect(summary.endorsements.buckets[2].count).toBe(1);
    expect(summary.endorsements.buckets[0]).not.toHaveProperty("items");

    expect(summary.claims.totalCount).toBe(5);
    expect(summary.claims.title).toBe("claims");
    expect(summary.claims.buckets[0].count).toBe(1);
    expect(summary.claims.buckets[1].count).toBe(1);
    expect(summary.claims.buckets[2].count).toBe(1);
    expect(summary.claims.buckets[3].count).toBe(1);
    expect(summary.claims.buckets[4].count).toBe(1);
    expect(summary.claims.buckets[0]).not.toHaveProperty("items");
  });

  it("should calculate TAT using calendar days only", async () => {
    repo.getTatSummarySnapshot.mockResolvedValue({
      endorsements: [
        {
          id: 801,
          policyId: 3001,
          insurerEndorsementNumber: "END-801",
          insurerAcknowledgementNumber: null,
          endorsementEntryDate: new Date("2024-04-01T18:30:00.000Z"),
          insurerEndorsementDate: new Date("2024-04-01T23:30:00.000Z"),
          endorsementStatus: "ENDORSEMENT_CREATED",
        },
      ],
      claims: [
        {
          id: 901,
          policyId: 4001,
          claimInsuredId: "CLM-901",
          claimPreAuthId: null,
          claimStatus: "SUBMITTED",
          claimDate: new Date("2024-04-10T05:00:00.000Z"),
          createdAt: new Date("2024-04-10T05:00:00.000Z"),
          settlementDate: new Date("2024-04-11T04:00:00.000Z"),
        },
      ],
    });

    const summary = await service.getTatSummary(1, {} as any);

    expect(summary.endorsements.totalCount).toBe(1);
    expect(summary.endorsements.buckets[2].count).toBe(1);
    expect(summary.endorsements.buckets[0].count).toBe(0);
    expect(summary.endorsements.buckets[1].count).toBe(0);
    expect(summary.claims.totalCount).toBe(1);
    expect(summary.claims.buckets[2].count).toBe(1);
    expect(summary.claims.buckets[0].count).toBe(0);
    expect(summary.claims.buckets[1].count).toBe(0);
  });

  it("should expand scope when viewBy is team", async () => {
    scopeServiceMock.getNewEmployeeHierarchyByUserId.mockResolvedValue([
      { userId: 1 },
      { userId: 2 },
    ]);

    await service.getTatSummary(1, { viewBy: "team" } as any);

    expect(
      scopeServiceMock.getNewEmployeeHierarchyByUserId
    ).toHaveBeenCalledWith(1);
    expect(repo.getTatSummarySnapshot).toHaveBeenCalledWith([1, 2], {
      restrictToCreators: true,
      isLeadership: false,
    });
  });

  it("should ignore owner scope when leadership user", async () => {
    await service.getTatSummary(1, { viewBy: "team" } as any, true);

    expect(
      scopeServiceMock.getNewEmployeeHierarchyByUserId
    ).not.toHaveBeenCalled();
    expect(repo.getTatSummarySnapshot).toHaveBeenCalledWith(undefined, {
      restrictToCreators: false,
      isLeadership: true,
    });
  });

  it("should return existing template info", async () => {
    repo.getLivePolicyConfiguration = jest
      .fn()
      .mockResolvedValue({ policyConfiguration: {} });
    repo.findTemplateDocMap = jest.fn().mockResolvedValue({ documentId: 5 });
    repo.getFileUploadById = jest
      .fn()
      .mockResolvedValue({ fileKey: "uploads/test.xlsx" });
    const result = await service.generateTemplate(2);
    expect(result).toEqual({ documentId: 5, fileName: "test.xlsx" });
  });

  it("should call repo on getCompanyCautionDeposits", async () => {
    repo.getCompanyCautionDeposits = jest.fn().mockResolvedValue({});
    await service.getCompanyCautionDeposits("", 1, 10, 1);
    expect(repo.getCompanyCautionDeposits).toHaveBeenCalledWith(
      "",
      1,
      10,
      [1],
      []
    );
  });

  it("should generate enrollment template", async () => {
    repo.getLivePolicyConfiguration = jest
      .fn()
      .mockResolvedValue({ policyConfiguration: { components: [] } });
    repo.findEnrollmentTemplateDocMap = jest.fn().mockResolvedValue(null);
    repo.getFileUploadByKey = jest.fn().mockResolvedValue(null);
    repo.createFileUploadRecord = jest.fn().mockResolvedValue({
      id: 10,
      fileKey: "uploads/policy-1-ENROLLMENT_TEMPLATE.xlsx",
    });
    repo.createEnrollmentTemplateDocMap = jest.fn();
    const result = await service.generateEnrollmentTemplate(1);
    expect(result.documentId).toBe(10);
  });

  it("should populate relation column with enabled relation options", async () => {
    const capturedSheets: any[][][] = [];
    const originalAoa = XLSX.utils.aoa_to_sheet;
    const aoaSpy = jest
      .spyOn(XLSX.utils, "aoa_to_sheet")
      .mockImplementation((rows: any[][]) => {
        capturedSheets.push(rows);
        return originalAoa(rows);
      });

    repo.getLivePolicyConfiguration = jest.fn().mockResolvedValue({
      policyConfiguration: {
        components: [],
        parameters: [
          {
            id: 99,
            type: "relation",
            relationGroupDetails: [
              {
                id: 77,
                familyMaxCount: "3",
                selectedRelations: [
                  { name: "Self", selected: true, maxCount: "1" },
                  { name: "Parents", selected: true, maxCount: "2" },
                ],
              },
            ],
          },
        ],
        policyOptions: [
          {
            optionMeta: [
              { parameterId: 99, parameterOptionId: 77 },
            ],
          },
        ],
        relationships: {
          enabledPolicyRelations: [
            {
              type: "Parents",
              enabled: true,
              configuredOptions: [
                { name: "Mother-in-law", enabled: true },
                { name: "Father-in-law", enabled: false },
              ],
            },
          ],
        },
      },
    });
    repo.findEnrollmentTemplateDocMap = jest.fn().mockResolvedValue(null);
    repo.getFileUploadByKey = jest.fn().mockResolvedValue(null);
    repo.createFileUploadRecord = jest.fn().mockResolvedValue({
      id: 123,
      fileKey:
        "uploads/company/policy/templates/policy-1-ENROLLMENT_TEMPLATE.xlsx",
    });
    repo.createEnrollmentTemplateDocMap = jest.fn();

    try {
      await service.generateEnrollmentTemplate(1);
      const mainSheet = capturedSheets[0];
      expect(mainSheet).toBeDefined();
      const headers = mainSheet[0] as string[];
      const relationIndex = headers.indexOf("Relation");
      expect(relationIndex).toBeGreaterThan(-1);
      const relationValues = mainSheet
        .slice(1)
        .map((row) => row[relationIndex]);
      expect(relationValues).toContain("Mother-in-law");
      expect(relationValues).not.toContain("Father-in-law");
    } finally {
      aoaSpy.mockRestore();
    }
  });

  it("should return existing enrollment template info", async () => {
    repo.getLivePolicyConfiguration = jest
      .fn()
      .mockResolvedValue({ policyConfiguration: {} });
    const claimStatusSpy = jest
      .spyOn<any, any>(service as any, "enrollmentTemplateHasClaimStatus")
      .mockResolvedValue(true);
    repo.findEnrollmentTemplateDocMap = jest
      .fn()
      .mockResolvedValue({ documentId: 11 });
    repo.getFileUploadById = jest.fn().mockResolvedValue({
      fileKey: "uploads/policy-1-ENROLLMENT_TEMPLATE.xlsx",
    });
    try {
      const result = await service.generateEnrollmentTemplate(1);
      expect(result).toEqual({
        documentId: 11,
        fileName: "policy-1-ENROLLMENT_TEMPLATE.xlsx",
      });
    } finally {
      claimStatusSpy.mockRestore();
    }
  });

  it("should regenerate enrollment template when claim status column is missing", async () => {
    repo.getLivePolicyConfiguration = jest
      .fn()
      .mockResolvedValue({ policyConfiguration: { components: [] } });
    const claimStatusSpy = jest
      .spyOn<any, any>(service as any, "enrollmentTemplateHasClaimStatus")
      .mockResolvedValue(false);
    repo.findEnrollmentTemplateDocMap = jest
      .fn()
      .mockResolvedValue({ documentId: 22 });
    repo.getFileUploadById = jest.fn().mockResolvedValue({
      id: 22,
      fileKey:
        "uploads/company/policy/templates/policy-1-ENROLLMENT_TEMPLATE.xlsx",
    });
    repo.getFileUploadByKey = jest.fn().mockResolvedValue(null);
    repo.createFileUploadRecord = jest.fn().mockResolvedValue({
      id: 22,
      fileKey:
        "uploads/company/policy/templates/policy-1-ENROLLMENT_TEMPLATE.xlsx",
    });
    repo.createEnrollmentTemplateDocMap = jest.fn();

    try {
      const result = await service.generateEnrollmentTemplate(1);
      expect(result).toEqual({
        documentId: 22,
        fileName: "policy-1-ENROLLMENT_TEMPLATE.xlsx",
      });
      expect(repo.createFileUploadRecord).not.toHaveBeenCalled();
      expect(repo.createEnrollmentTemplateDocMap).not.toHaveBeenCalled();
    } finally {
      claimStatusSpy.mockRestore();
    }
  });

  it("should call repo on createEnrollmentUpload", async () => {
    await service.createEnrollmentUpload(2, 3, 4, "DOC");
    expect(repo.createEnrollmentUpload).toHaveBeenCalledWith(
      2,
      3,
      4,
      "DOC",
      0,
      0,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      false
    );
  });

  it("should call repo on listEnrollmentUploadSummary", async () => {
    await service.listEnrollmentUploadSummary(1, 1, 10);
    expect(repo.listEnrollmentUploadSummary).toHaveBeenCalledWith(
      1,
      1,
      10,
      undefined,
      undefined,
      undefined
    );
  });

  it("should call repo on listEndorsementBatches", async () => {
    await service.listEndorsementBatches(1, 1, 10);
    expect(repo.listEndorsementBatches).toHaveBeenCalledWith(1, 1, 10);
  });

  it("should call repo on getPolicyConstraintsByPolicyId", async () => {
    await service.getPolicyConstraintsByPolicyId(1);
    expect(repo.getPolicyConstraintsByPolicyId).toHaveBeenCalledWith(1);
  });

  it("should call repo to fetch KPI data", async () => {
    await service.getPolicyKpiData(1, 2, "FullYear", 2024);
    expect(repo.getPolicyKpiData).toHaveBeenCalledWith(1, 2, "FullYear", 2024);
  });

  it("should call repo on createEndorsementFieldMapping", async () => {
    await service.createEndorsementFieldMapping(1, { A: "a" });
    expect(repo.saveEndorsementFieldMapping).toHaveBeenCalledWith(1, {
      A: "a",
    });
  });

  it("should call repo on uploadEndorsementTemplate", async () => {
    await service.uploadEndorsementTemplate(1, 2, 3);
    expect(repo.createEndorsementTemplateDocMap).toHaveBeenCalledWith(1, 2, 3);
  });

  it("should fail when no enrollments", async () => {
    repo.findEndorsementTemplateDocMap.mockResolvedValue({ documentId: 1 });
    repo.getFileUploadById.mockResolvedValue({ fileKey: "path" });
    repo.getEndorsementFieldMapping.mockResolvedValue({ fieldMap: {} });
    repo.listEndorsementReadyEnrollments.mockResolvedValue([]);
    repo.fetchPolicyById.mockResolvedValue({
      policyFrom: new Date("2020-01-01"),
      policyTo: new Date("2020-12-31"),
      brokeragePercentage: 0,
      companyId: 1,
      terrorismAmount: 0,
      commissionTerrorism: 0,
    });
    repo.fetchPolicyById.mockResolvedValue({});
    const fs = require("fs");
    jest.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from(""));
    const XLSX = require("xlsx");
    jest
      .spyOn(XLSX, "read")
      .mockReturnValue({ SheetNames: ["s"], Sheets: { s: {} } });
    jest.spyOn(XLSX.utils, "sheet_to_json").mockReturnValue([[]]);
    jest.spyOn(XLSX.utils, "json_to_sheet").mockReturnValue({});
    jest.spyOn(XLSX, "write").mockReturnValue(Buffer.from(""));
    const fmUtils = require("../../../../service-lib/src/lib/utils/file-management.utils");
    jest.spyOn(fmUtils, "uploadToS3").mockResolvedValue("url");
    await expect(service.generateEndorsementExcel(1, 2)).rejects.toThrow(
      "No employee is ready for endorsement"
    );
  });

  it("should handle enrollments with missing employee information", async () => {
    repo.findEndorsementTemplateDocMap.mockResolvedValue({ documentId: 1 });
    repo.getFileUploadById.mockResolvedValue({ fileKey: "path" });
    repo.getEndorsementFieldMapping.mockResolvedValue({ fieldMap: {} });
    repo.listEndorsementReadyEnrollments.mockResolvedValue([
      {
        id: 1,
        employeeId: 10,
        policyId: 2,
        employee: null,
        components: [],
      },
    ]);
    repo.getEffectiveDateOfEmployee.mockResolvedValue(new Date("2020-01-01"));
    repo.fetchPolicyById.mockResolvedValue({
      policyFrom: new Date("2020-01-01"),
      policyTo: new Date("2020-12-31"),
      brokeragePercentage: 0,
      companyId: 1,
      terrorismAmount: 0,
      commissionTerrorism: 0,
    });
    repo.fetchPolicyById.mockResolvedValue({});
    const fs = require("fs");
    jest.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from(""));
    const XLSX = require("xlsx");
    jest
      .spyOn(XLSX, "read")
      .mockReturnValue({ SheetNames: ["s"], Sheets: { s: {} } });
    jest.spyOn(XLSX.utils, "sheet_to_json").mockReturnValue([["SL NO"]]);
    jest.spyOn(XLSX.utils, "json_to_sheet").mockReturnValue({});
    jest.spyOn(XLSX, "write").mockReturnValue(Buffer.from(""));
    const fmUtils = require("../../../../service-lib/src/lib/utils/file-management.utils");
    jest.spyOn(fmUtils, "uploadToS3").mockResolvedValue("url");
    await expect(service.generateEndorsementExcel(1, 2)).resolves.toBe("url");
  });

  it("should include dependents in generated endorsement excel", async () => {
    repo.findEndorsementTemplateDocMap.mockResolvedValue({ documentId: 1 });
    repo.getFileUploadById.mockResolvedValue({ fileKey: "path" });
    repo.getEndorsementFieldMapping.mockResolvedValue({ fieldMap: {} });
    repo.listEndorsementReadyEnrollments.mockResolvedValue([
      {
        id: 1,
        employeeId: 10,
        policyId: 2,
        employee: {
          employeeName: "Emp",
          dependents: [
            {
              name: "Dep",
              relation: "Spouse",
              gender: "F",
              dateOfBirth: "1990-01-01",
              endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
            },
          ],
        },
        components: [],
      },
    ]);
    repo.getEffectiveDateOfEmployee.mockResolvedValue(new Date("2020-01-01"));
    repo.fetchPolicyById.mockResolvedValue({
      policyFrom: new Date("2020-01-01"),
      policyTo: new Date("2020-12-31"),
      brokeragePercentage: 0,
      companyId: 1,
      terrorismAmount: 0,
      commissionTerrorism: 0,
    });
    repo.fetchPolicyById.mockResolvedValue({});
    const fs = require("fs");
    jest.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from(""));
    const XLSX = require("xlsx");
    jest
      .spyOn(XLSX, "read")
      .mockReturnValue({ SheetNames: ["s"], Sheets: { s: {} } });
    jest
      .spyOn(XLSX.utils, "sheet_to_json")
      .mockReturnValue([
        ["SL NO", "INSUREDNAME", "RELATION", "ENDORSEMENT TYPE"],
      ]);
    const jsonToSheetSpy = jest
      .spyOn(XLSX.utils, "json_to_sheet")
      .mockReturnValue({});
    jest.spyOn(XLSX, "write").mockReturnValue(Buffer.from(""));
    const fmUtils = require("../../../../service-lib/src/lib/utils/file-management.utils");
    jest.spyOn(fmUtils, "uploadToS3").mockResolvedValue("url");

    await expect(service.generateEndorsementExcel(1, 2)).resolves.toBe("url");
    const rows = jsonToSheetSpy.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows[1].INSUREDNAME).toBe("Dep");
    expect(rows[0]["ENDORSEMENT TYPE"]).toBe("Addition");
    expect(rows[1]["ENDORSEMENT TYPE"]).toBe("Addition");
  });

  it("should mark deleted dependents in generated endorsement excel", async () => {
    repo.findEndorsementTemplateDocMap.mockResolvedValue({ documentId: 1 });
  });

  it("should fallback to any template if insurer specific mapping missing", async () => {
    repo.findEndorsementTemplateDocMap.mockResolvedValue(null);
    repo.findAnyEndorsementTemplateDocMap.mockResolvedValue({ documentId: 5 });
    repo.getFileUploadById.mockResolvedValue({ fileKey: "path" });
    repo.getEndorsementFieldMapping.mockResolvedValue({ fieldMap: {} });
    repo.listEndorsementReadyEnrollments.mockResolvedValue([
      {
        id: 1,
        employeeId: 10,
        policyId: 2,
        employee: {
          employeeName: "Emp",
          dependents: [
            {
              name: "Dep",
              relation: "Spouse",
              gender: "F",
              dateOfBirth: "1990-01-01",
              deletedAt: new Date(),
            },
          ],
        },
        components: [],
      },
    ]);
    repo.getEffectiveDateOfEmployee.mockResolvedValue(new Date("2020-01-01"));
    repo.fetchPolicyById.mockResolvedValue({
      policyFrom: new Date("2020-01-01"),
      policyTo: new Date("2020-12-31"),
      brokeragePercentage: 0,
      companyId: 1,
      terrorismAmount: 0,
      commissionTerrorism: 0,
    });
    const fs = require("fs");
    jest.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from(""));
    const XLSX = require("xlsx");
    jest
      .spyOn(XLSX, "read")
      .mockReturnValue({ SheetNames: ["s"], Sheets: { s: {} } });
    const jsonToSheetSpy = jest
      .spyOn(XLSX.utils, "json_to_sheet")
      .mockReturnValue({});
    jest
      .spyOn(XLSX.utils, "sheet_to_json")
      .mockReturnValue([
        ["SL NO", "INSUREDNAME", "RELATION", "ENDORSEMENT TYPE"],
      ]);
    jest.spyOn(XLSX, "write").mockReturnValue(Buffer.from(""));
    const fmUtils = require("../../../../service-lib/src/lib/utils/file-management.utils");
    jest.spyOn(fmUtils, "uploadToS3").mockResolvedValue("url");

    await expect(service.generateEndorsementExcel(1, 2)).resolves.toBe("url");
    const rows = jsonToSheetSpy.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows[1].INSUREDNAME).toBe("Dep");
    expect(rows[1]["ENDORSEMENT TYPE"]).toBe("Deletion");
  });

  it("should include deleted employees in generated endorsement excel", async () => {
    repo.findEndorsementTemplateDocMap.mockResolvedValue({ documentId: 1 });
    repo.getFileUploadById.mockResolvedValue({ fileKey: "path" });
    repo.getEndorsementFieldMapping.mockResolvedValue({ fieldMap: {} });
    repo.listEndorsementReadyEnrollments.mockResolvedValue([
      {
        id: 1,
        employeeId: 10,
        policyId: 2,
        employee: {
          employeeName: "Emp",
          deletedAt: new Date(),
          dependents: [],
        },
        components: [],
      },
    ]);
    repo.getEffectiveDateOfEmployee.mockResolvedValue(new Date("2020-01-01"));
    repo.fetchPolicyById.mockResolvedValue({
      policyFrom: new Date("2020-01-01"),
      policyTo: new Date("2020-12-31"),
      brokeragePercentage: 0,
      companyId: 1,
      terrorismAmount: 0,
      commissionTerrorism: 0,
    });
    const fs = require("fs");
    jest.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from(""));
    const XLSX = require("xlsx");
    jest
      .spyOn(XLSX, "read")
      .mockReturnValue({ SheetNames: ["s"], Sheets: { s: {} } });
    const jsonToSheetSpy = jest
      .spyOn(XLSX.utils, "json_to_sheet")
      .mockReturnValue({});
    jest
      .spyOn(XLSX.utils, "sheet_to_json")
      .mockReturnValue([["SL NO", "INSUREDNAME", "ENDORSEMENT TYPE"]]);
    jest.spyOn(XLSX, "write").mockReturnValue(Buffer.from(""));
    const fmUtils = require("../../../../service-lib/src/lib/utils/file-management.utils");
    jest.spyOn(fmUtils, "uploadToS3").mockResolvedValue("url");

    await expect(service.generateEndorsementExcel(1, 2)).resolves.toBe("url");
    const rows = jsonToSheetSpy.mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0].INSUREDNAME).toBe("Emp");
    expect(repo.getEffectiveDateOfEmployee).toHaveBeenCalledWith(10, 2);
    expect(rows[0]["ENDORSEMENT TYPE"]).toBe("Deletion");
  });

  it("should fallback to any template if insurer specific mapping missing", async () => {
    repo.findEndorsementTemplateDocMap.mockResolvedValue(null);
    repo.findAnyEndorsementTemplateDocMap.mockResolvedValue({ documentId: 5 });
    repo.getFileUploadById.mockResolvedValue({ fileKey: "path" });
    repo.getEndorsementFieldMapping.mockResolvedValue({ fieldMap: {} });
    repo.listEndorsementReadyEnrollments.mockResolvedValue([
      {
        id: 1,
        employeeId: 10,
        policyId: 2,
        employee: null,
        components: [],
      },
    ]);
    repo.getEffectiveDateOfEmployee.mockResolvedValue(new Date("2020-01-01"));
    repo.fetchPolicyById.mockResolvedValue({
      policyFrom: new Date("2020-01-01"),
      policyTo: new Date("2020-12-31"),
      brokeragePercentage: 0,
      companyId: 1,
      terrorismAmount: 0,
      commissionTerrorism: 0,
    });
    const fs = require("fs");
    jest.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from(""));
    const XLSX = require("xlsx");
    jest
      .spyOn(XLSX, "read")
      .mockReturnValue({ SheetNames: ["s"], Sheets: { s: {} } });
    jest.spyOn(XLSX.utils, "sheet_to_json").mockReturnValue([["SL NO"]]);
    jest.spyOn(XLSX.utils, "json_to_sheet").mockReturnValue({});
    jest.spyOn(XLSX, "write").mockReturnValue(Buffer.from(""));
    const fmUtils = require("../../../../service-lib/src/lib/utils/file-management.utils");
    jest.spyOn(fmUtils, "uploadToS3").mockResolvedValue("url");
    await expect(service.generateEndorsementExcel(1, 2)).resolves.toBe("url");
  });

  it("should round transaction amount before updating CD balance", async () => {
    repo.findEndorsementTemplateDocMap.mockResolvedValue({ documentId: 1 });
    repo.getFileUploadById.mockResolvedValue({ fileKey: "path" });
    repo.getEndorsementFieldMapping.mockResolvedValue({ fieldMap: {} });
    repo.listEndorsementReadyEnrollments.mockResolvedValue([
      {
        id: 1,
        employeeId: 10,
        policyId: 2,
        employee: null,
        components: [],
        sumInsured: 0,
        totalPremium: 1000,
      },
    ]);
    repo.getEffectiveDateOfEmployee.mockResolvedValue(new Date("2020-07-01"));
    repo.fetchPolicyById.mockResolvedValue({
      policyFrom: new Date("2020-01-01"),
      policyTo: new Date("2020-12-31"),
      brokeragePercentage: 0,
      companyId: 1,
      terrorismAmount: 0,
      commissionTerrorism: 0,
    });
    const fs = require("fs");
    jest.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from(""));
    const XLSX = require("xlsx");
    jest
      .spyOn(XLSX, "read")
      .mockReturnValue({ SheetNames: ["s"], Sheets: { s: {} } });
    jest.spyOn(XLSX.utils, "sheet_to_json").mockReturnValue([["SL NO"]]);
    jest.spyOn(XLSX.utils, "json_to_sheet").mockReturnValue({});
    jest.spyOn(XLSX, "write").mockReturnValue(Buffer.from(""));
    const fmUtils = require("../../../../service-lib/src/lib/utils/file-management.utils");
    jest.spyOn(fmUtils, "uploadToS3").mockResolvedValue("url");

    await service.generateEndorsementExcel(1, 2);
    const amount =
      repo.updateCautionDepositBalance.mock.calls[0][1].transactionAmount;
    expect(Number.isInteger(amount)).toBe(true);
  });

  describe("getPolicyCoversMetaById", () => {
    it("should sort cover meta by cover template id", async () => {
      repo.findOnePolicy.mockResolvedValueOnce({
        id: 10,
        companyId: 20,
        coverMappings: [
          {
            coverTemplateId: 200,
            coversMeta: {
              order: "20",
              formConfig: [
                {
                  label: "Second cover",
                  order: 20,
                },
              ],
              defaultValues: {
                200: "value-2",
              },
            },
          },
          {
            coverTemplateId: 100,
            coversMeta: {
              order: 10,
              formConfig: [
                {
                  label: "First cover",
                  order: 10,
                },
              ],
              defaultValues: {
                100: "value-1",
              },
            },
          },
        ],
      } as any);

      const response = await service.getPolicyCoversMetaById(10);

      expect(repo.findOnePolicy).toHaveBeenCalledWith(10, [
        "policyStatus",
        "coverMappings",
      ]);
      expect(response.result.formConfig.map((config: any) => config.id)).toEqual([
        "100",
        "200",
      ]);
      expect(
        response.result.formConfig.map((config: any) => config.order)
      ).toEqual([10, 20]);
      expect(response.result.defaultcoverValues).toEqual({
        100: "value-1",
        200: "value-2",
      });
    });

    it("should maintain form configuration order within each cover", async () => {
      repo.findOnePolicy.mockResolvedValueOnce({
        id: 55,
        companyId: 65,
        coverMappings: [
          {
            coverTemplateId: 300,
            coversMeta: {
              formConfig: [
                {
                  label: "Later step one",
                  order: 5,
                },
                {
                  label: "Later step two",
                  order: 7,
                },
              ],
              defaultValues: {
                300: "later",
              },
            },
          },
          {
            coverTemplateId: 100,
            coversMeta: {
              formConfig: [
                {
                  label: "First step one",
                  order: 1,
                },
                {
                  label: "First step two",
                  order: 3,
                },
              ],
              defaultValues: {
                100: "first",
              },
            },
          },
        ],
      } as any);

      const response = await service.getPolicyCoversMetaById(55);

      expect(
        response.result.formConfig.map((config: any) => config.id)
      ).toEqual(["100", "100", "300", "300"]);
      expect(
        response.result.formConfig.map((config: any) => config.order)
      ).toEqual([1, 3, 5, 7]);
    });
  });

  it("should update policy cover and return latest cover snapshot", async () => {
    repo.updatePolicyCover.mockResolvedValue(undefined);
    const dto = { covers: { "5774595": "7" } } as any;
    const expected = {
      id: 5,
      companyId: 1,
      covers: { 5774595: "7" },
    } as any;
    const getCoversSpy = jest
      .spyOn(service, "getPolicyCoversDataById")
      .mockResolvedValue(expected);

    await expect(service.updatePolicyCover(5, dto, 99)).resolves.toEqual(
      expected
    );
    expect(repo.updatePolicyCover).toHaveBeenCalledWith(5, dto, 99);
    expect(getCoversSpy).toHaveBeenCalledWith(5);
    getCoversSpy.mockRestore();
  });

  it("should validate payload before updating policy cover", async () => {
    const dto = { covers: {} } as any;
    await expect(service.updatePolicyCover(5, dto, 1)).rejects.toThrow(
      BadRequestException
    );
    expect(repo.updatePolicyCover).not.toHaveBeenCalled();
  });

  it("should reject invalid policy cover template identifiers", async () => {
    const dto = { covers: { invalid: "value" } } as any;
    await expect(service.updatePolicyCover(5, dto, 1)).rejects.toThrow(
      BadRequestException
    );
    expect(repo.updatePolicyCover).not.toHaveBeenCalled();
  });

  it("should reject empty policy cover responses", async () => {
    const dto = { covers: { "5774595": "  " } } as any;
    await expect(service.updatePolicyCover(5, dto, 1)).rejects.toThrow(
      BadRequestException
    );
    expect(repo.updatePolicyCover).not.toHaveBeenCalled();
  });

  it("should throw bad request when policy cover update fails", async () => {
    repo.updatePolicyCover.mockRejectedValue(new Error("failed"));

    await expect(
      service.updatePolicyCover(5, { covers: { "5774595": "value" } } as any, 42)
    ).rejects.toThrow(BadRequestException);
  });

  it("should update caution deposit account number", async () => {
    const dto = { cdAccountNumber: "CD-ACC-01" } as any;
    const repositoryResponse = {
      id: 10,
      companyId: 21,
      insurerId: 34,
      cdAccountNumber: "CD-ACC-01",
      cdAccountName: "CD Account",
      cdBankName: "Bank",
      balanceAmount: 5000,
      remarks: "Updated",
      status: "ACTIVE",
      previousCdAccountNumber: "CD-ACC-OLD",
    } as any;
    repo.updateCautionDepositAccountNumber.mockResolvedValue(
      repositoryResponse
    );

    const result = await service.updateCautionDepositAccountNumber(10, dto, 7);

    expect(result).toEqual({
      id: 10,
      companyId: 21,
      insurerId: 34,
      cdAccountNumber: "CD-ACC-01",
      cdAccountName: "CD Account",
      cdBankName: "Bank",
      balanceAmount: 5000,
      remarks: "Updated",
      status: "ACTIVE",
    });
    expect(result.previousCdAccountNumber).toBeUndefined();
    expect(repo.updateCautionDepositAccountNumber).toHaveBeenCalledWith(
      10,
      "CD-ACC-01",
      7
    );
    expect(repo.createPolicyAuditLogEntry).toHaveBeenCalledWith({
      policyId: null,
      policyConfigurationId: null,
      entityType: POLICY_AUDIT_ENTITY_CAUTION_DEPOSIT,
      entityId: 10,
      action: POLICY_AUDIT_ACTION_CAUTION_DEPOSIT_ACCOUNT_NUMBER_UPDATED,
      performedBy: 7,
      remarks: null,
      metadata: {
        companyId: 21,
        insurerId: 34,
        previousCdAccountNumber: "CD-ACC-OLD",
        updatedCdAccountNumber: "CD-ACC-01",
      },
    });
  });

  it("should bubble up known errors when updating caution deposit account number", async () => {
    const error = new NotFoundException("not found");
    repo.updateCautionDepositAccountNumber.mockRejectedValue(error);

    await expect(
      service.updateCautionDepositAccountNumber(
        11,
        { cdAccountNumber: "ACC" } as any,
        9
      )
    ).rejects.toThrow(error);
    expect(repo.createPolicyAuditLogEntry).not.toHaveBeenCalled();
  });

  it("should wrap unknown errors when updating caution deposit account number", async () => {
    repo.updateCautionDepositAccountNumber.mockRejectedValue(
      new Error("unexpected")
    );

    await expect(
      service.updateCautionDepositAccountNumber(
        12,
        { cdAccountNumber: "ACC" } as any,
        9
      )
    ).rejects.toThrow(BadRequestException);
    expect(repo.createPolicyAuditLogEntry).not.toHaveBeenCalled();
  });

  describe("submitPolicySection", () => {
    const policyId = 10;
    const section = POLICY_SECTION_APPROVAL_SECTIONS.POLICY_DETAILS;
    const userId = 25;
    const refreshedStatuses = {
      policyId,
      sections: {
        [section]: { comments: null },
      },
    } as any;

    beforeEach(() => {
      repo.updatePolicySectionStatus.mockResolvedValue({
        sections: {},
      });
      repo.getParentUserWithPrivilege.mockResolvedValue({ userId: 30 });
      repo.getPolicySectionStatuses.mockResolvedValue(refreshedStatuses);
    });

    it("should create an approval task for the approver", async () => {
      const result = await service.submitPolicySection(
        policyId,
        { section, comments: "Please review" } as any,
        userId
      );

      expect(repo.updatePolicySectionStatus).toHaveBeenCalledWith(
        policyId,
        section,
        POLICY_SECTION_APPROVAL_STATUS_VALUE.SUBMITTED,
        userId,
        "Please review"
      );
      expect(repo.getParentUserWithPrivilege).toHaveBeenCalledWith(
        userId,
        ACL_CATEGORY.POLICY,
        ACL_ACTIONS.APPROVE_POLICY_CHANGES
      );
      expect(repo.createPolicySectionApprovalTask).toHaveBeenCalledWith(
        policyId,
        section,
        30,
        userId
      );
      expect(repo.getPolicySectionStatuses).toHaveBeenCalledWith(policyId);
      expect(result.sections[section].comments).toBe("Please review");
    });
  });

  describe("approvePolicySection", () => {
    const policyId = 55;
    const section = POLICY_SECTION_APPROVAL_SECTIONS.POLICY_COVERS;
    const userId = 42;
    const statuses = {
      policyId,
      sections: {
        [section]: { comments: null },
      },
    } as any;

    beforeEach(() => {
      repo.updatePolicySectionStatus.mockResolvedValue(statuses);
      repo.getPolicySectionStatuses.mockResolvedValue(statuses);
    });

    it("should mark the approval task as completed when approved", async () => {
      const response = await service.approvePolicySection(
        policyId,
        { section, status: POLICY_SECTION_APPROVAL_DECISION_STATUS.APPROVED } as any,
        userId
      );

      expect(repo.getPolicySectionStatuses).toHaveBeenCalledWith(policyId);
      expect(response.sections[section].comments).toBeNull();
      expect(repo.completePolicySectionApprovalTask).toHaveBeenCalledWith(
        policyId,
        section,
        userId
      );
    });

    it("should not complete the task when approval is rejected", async () => {
      await service.approvePolicySection(
        policyId,
        {
          section,
          status: POLICY_SECTION_APPROVAL_DECISION_STATUS.REJECTED,
          comments: "Needs work",
        } as any,
        userId
      );

      expect(repo.completePolicySectionApprovalTask).not.toHaveBeenCalled();
    });
  });
});
