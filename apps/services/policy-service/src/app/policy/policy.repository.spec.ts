import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { PolicyRepository } from "./policy.repository";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { Endorsement } from "../../../../service-lib/src/lib/entities/endorsement.entity";
import { PolicyConfiguration } from "../../../../service-lib/src/lib/entities/policy-configuration.entity";
import { PolicyClaim } from "../../../../service-lib/src/lib/entities/policy-employee-claim.entity";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { DocumentProcessingFile } from "../../../../service-lib/src/lib/entities/document-processing-file.entity";
import { Employee } from "../../../../service-lib/src/lib/entities/employee.entity";
import {
  DOCUMENT_PROCESS_STATUS,
  DOCUMENT_TYPE_POLICY_TPA_ID_UPLOAD,
  EMPLOYEE_ENDORSEMENT_TPA_ACKNOWLEDGED,
  ENTITY_NAME,
} from "../../../../../../libs/service-lib/src/lib/constants";

jest.mock(
  "../../../../service-lib/src/lib/utils/file-management.utils",
  () => ({
    downloadFromS3: jest.fn().mockResolvedValue(Buffer.from("")),
    uploadToS3: jest.fn().mockResolvedValue(undefined),
    generateExcel: jest.fn().mockResolvedValue(Buffer.from("")),
  })
);

jest.mock("xlsx", () => ({
  read: jest.fn().mockReturnValue({ SheetNames: ["s"], Sheets: { s: {} } }),
  utils: {
    sheet_to_json: jest
      .fn()
      .mockReturnValue([{ employee_id: "E1", tpa_id: "T1", relation: "Self" }]),
    json_to_sheet: jest.fn(),
  },
  write: jest.fn().mockReturnValue(Buffer.from("")),
}));

import {
  CD_BALANCE_THRESHHOLD_PERCENTAGE_VALUE,
  ENDORSEMENT_STATUS,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { CautionDepositPolicyMapping } from "../../../../service-lib/src/lib/entities";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";

describe("PolicyRepository", () => {
  let repository: PolicyRepository;
  let configRepo: Repository<PolicyConfiguration>;
  let policyRepo: Repository<Policy>;
  let docRepo: Repository<DocumentProcessingFile>;
  let endorsementRepo: Repository<Endorsement>;
  let employeeRepo: Repository<Employee>;
  let entityService: { fetchEntityList: jest.Mock };
  let scopeService: {
    getUserWithRoles: jest.Mock;
    getEmployeeDetails: jest.Mock;
    getOrganisationDetails: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyRepository,
        {
          provide: getRepositoryToken(Policy),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: { findOne: jest.fn() },
        },
        { provide: getRepositoryToken(PolicyClaim), useValue: {} },
        {
          provide: getRepositoryToken(PolicyConfiguration),
          useValue: {
            create: jest.fn().mockReturnValue({}),
            save: jest.fn().mockResolvedValue({}),
            update: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn().mockResolvedValue([[], 0]),
          },
        },
        {
          provide: getRepositoryToken(DocumentProcessingFile),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn().mockReturnValue({}),
            save: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: getRepositoryToken(Endorsement),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn().mockImplementation((data) => ({ ...data })),
            save: jest
              .fn()
              .mockImplementation(async (data) => ({
                id: 10,
                createdAt: new Date("2024-01-01T00:00:00.000Z"),
                ...data,
              })),
            update: jest.fn(),
          },
        },
        {
          provide: EntityService,
          useValue: { fetchEntityList: jest.fn() },
        },
        {
          provide: ScopeService,
          useValue: {
            getUserWithRoles: jest.fn(),
            getEmployeeDetails: jest.fn(),
            getOrganisationDetails: jest.fn(),
          },
        },
      ],
    }).compile();
    repository = module.get(PolicyRepository);
    configRepo = module.get(getRepositoryToken(PolicyConfiguration));
    policyRepo = module.get(getRepositoryToken(Policy));
    docRepo = module.get(getRepositoryToken(DocumentProcessingFile));
    endorsementRepo = module.get(getRepositoryToken(Endorsement));
    employeeRepo = module.get(getRepositoryToken(Employee));
    entityService = module.get(EntityService) as any;
    scopeService = module.get(ScopeService) as any;
  });

  it("should create policy configuration", async () => {
    await repository.createPolicyConfiguration({} as any);
    expect(configRepo.create).toHaveBeenCalled();
    expect(configRepo.save).toHaveBeenCalled();
  });

  it("should update policy configuration status", async () => {
    configRepo.findOne = jest
      .fn()
      .mockResolvedValue({ id: 1, version: 1, policyId: 3 });
    repository.completePolicyConfigurationApprovalTask = jest
      .fn()
      .mockResolvedValue(undefined) as any;

    await repository.updatePolicyConfigurationStatus(1, true, 7);

    expect(configRepo.update).toHaveBeenCalled();
    expect(
      repository.completePolicyConfigurationApprovalTask as jest.Mock
    ).toHaveBeenCalledWith(3, 7);
  });

  it("should fetch policy constraints by policy id", async () => {
    (policyRepo.findOne as jest.Mock).mockResolvedValue({
      company: { countryId: 1 },
    });
    repository["policyRepository"].manager = {
      findOne: jest.fn().mockResolvedValue({ id: 1 }),
    } as any;
    const result = await repository.getPolicyConstraintsByPolicyId(1);
    expect(policyRepo.findOne).toHaveBeenCalled();
    expect(result).toEqual({ id: 1 });
  });

  it("should create enrollment upload", async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        policyName: "Test",
        companyId: 1,
        policyTypeLid: 1,
      }),
    };
    repository["policyRepository"] = { manager } as any;
    const transaction = jest
      .fn()
      .mockImplementation(async (callback: any) =>
        callback({
          getRepository: (entity: any) => {
            if (entity === Endorsement) {
              return endorsementRepo;
            }
            if (entity === DocumentProcessingFile) {
              return docRepo;
            }
            return null;
          },
        })
      );
    repository["dataSource"] = { transaction } as any;

    await repository.createEnrollmentUpload(1, 2, 3, "DOC");

    expect(transaction).toHaveBeenCalled();
    expect(manager.findOne).toHaveBeenCalled();
    expect(endorsementRepo.create).toHaveBeenCalled();
    expect(endorsementRepo.save).toHaveBeenCalled();
    expect(endorsementRepo.update).toHaveBeenCalled();
    expect(docRepo.create).toHaveBeenCalled();
    expect(docRepo.save).toHaveBeenCalled();
  });

  it("should list endorsement batches tracker", async () => {
    repository["policyEndorsementRepo"] = {
      findAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 1,
            endorsementEntryDate: new Date("2024-01-01"),
            tpaAcknowledgedDate: new Date("2024-01-03"),
            currentEndorsementStep: 1,
            endorsementStatus: "status",
          },
        ],
        1,
      ]),
    } as any;
    repository["policyRepository"] = {
      findOne: jest.fn().mockResolvedValue({ policyTypeLid: 1 }),
    } as any;
    repository["dataSource"] = {
      query: jest
        .fn()
        .mockResolvedValue([{ stepOrder: 1, stepLabel: "label" }]),
    } as any;
    const result = await repository.listEndorsementBatchesTracker(1, 1, 10);
    expect(result).toEqual({
      data: [
        {
          endorsementId: 1,
          TATduration: 2,
          currentStageOrder: 1,
          currentStageLabel: "label",
          currentStatus: ENDORSEMENT_STATUS.ENDORSEMENT_STATUS_PENDING,
        },
      ],
      count: 1,
    });
  });

  it("should list enrollment upload summary", async () => {
    const qb: any = {
      leftJoinAndMapOne: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    (docRepo.createQueryBuilder as jest.Mock) = jest.fn().mockReturnValue(qb);
    const result = await repository.listEnrollmentUploadSummary(1, 1, 10);
    expect(docRepo.createQueryBuilder).toHaveBeenCalledWith("upload");
    expect(qb.getManyAndCount).toHaveBeenCalled();
    expect(qb.andWhere).toHaveBeenCalledWith(
      "upload.documentType != :tpaDocType",
      { tpaDocType: DOCUMENT_TYPE_POLICY_TPA_ID_UPLOAD }
    );
    expect(result).toEqual({ data: [], count: 0 });
  });

  it("should list enrollment upload summary for tpa data", async () => {
    const qb: any = {
      leftJoinAndMapOne: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    (docRepo.createQueryBuilder as jest.Mock) = jest.fn().mockReturnValue(qb);
    await repository.listEnrollmentUploadSummary(1, 1, 10, undefined, undefined, "true");
    expect(qb.andWhere).toHaveBeenCalledWith(
      "upload.documentType = :tpaDocType",
      { tpaDocType: DOCUMENT_TYPE_POLICY_TPA_ID_UPLOAD }
    );
  });

  it("should list endorsement batches", async () => {
    repository["policyEndorsementRepo"] = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    } as any;
    repository["policyRepository"] = {
      findOne: jest.fn().mockResolvedValue({}),
    } as any;
    const result = await repository.listEndorsementBatches(1, 1, 10);
    expect(result).toEqual({ data: [], count: 0 });
  });

  it("should create employee enrollment", async () => {
    const save = jest.fn().mockResolvedValue({});
    repository["employeeEnrollmentRepo"] = {
      create: jest.fn().mockReturnValue({}),
      save,
    } as any;
    repository["employeeRepo"] = {
      findOne: jest.fn().mockResolvedValue({}),
    } as any;
    const result = await repository.createEmployeeEnrollment({
      employeeId: 1,
    } as any);
    expect(save).toHaveBeenCalled();
    expect(result).toEqual({});
  });

  it("should throw if employee not found", async () => {
    repository["employeeEnrollmentRepo"] = {
      create: jest.fn(),
      save: jest.fn(),
    } as any;
    repository["employeeRepo"] = {
      findOne: jest.fn().mockResolvedValue(null),
    } as any;
    await expect(
      repository.createEmployeeEnrollment({ employeeId: 1 } as any)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("should queue a TPA upload request", async () => {
    const createdRecord = {
      id: 10,
      processStatus: DOCUMENT_PROCESS_STATUS.CREATED,
      entityId: 2,
      documentId: 1,
    } as DocumentProcessingFile;

    docRepo.findOne = jest.fn().mockResolvedValue(null);
    endorsementRepo.findOne = jest.fn().mockResolvedValue({ id: 7 });
    docRepo.create = jest.fn().mockReturnValue(createdRecord);
    docRepo.save = jest.fn().mockResolvedValue(createdRecord);

    const ackDate = new Date("2024-01-01T00:00:00.000Z");
    const result = await repository.queueTpaIdUpload(1, 7, 2, ackDate);

    expect(docRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: ENTITY_NAME.POLICY,
        entityId: 2,
        documentId: 1,
        documentType: DOCUMENT_TYPE_POLICY_TPA_ID_UPLOAD,
        processStatus: DOCUMENT_PROCESS_STATUS.CREATED,
        endorsementId: 7,
      })
    );
    const createdArgs = (docRepo.create as jest.Mock).mock.calls[0][0];
    expect(createdArgs.expectedDependentsCount).toBe(
      Math.floor(ackDate.getTime() / 1000)
    );
    expect(result).toBe(createdRecord);
    expect(docRepo.save).toHaveBeenCalledWith(createdRecord);
  });

  it("should not allow multiple pending TPA uploads for a policy", async () => {
    docRepo.findOne = jest.fn().mockResolvedValue({ id: 1 });

    await expect(
      repository.queueTpaIdUpload(1, 7, 2)
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("should throw when endorsement does not belong to policy", async () => {
    docRepo.findOne = jest.fn().mockResolvedValue(null);
    endorsementRepo.findOne = jest.fn().mockResolvedValue(null);

    await expect(
      repository.queueTpaIdUpload(1, 7, 2)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  describe("getCautionDepositTransactionsByCautionDepositId sorting", () => {
    const buildQbMock = () => ({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getCount: jest.fn().mockResolvedValue(0),
    });

    it("falls back to cdt.transaction_date ASC when no sort is requested", async () => {
      const qb = buildQbMock();
      repository["policyRepository"].manager = {
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      } as any;

      await repository.getCautionDepositTransactionsByCautionDepositId(1, 1, 10);

      expect(qb.orderBy).toHaveBeenCalledWith("cdt.transaction_date", "ASC");
      expect(qb.addOrderBy).not.toHaveBeenCalled();
    });

    it("applies a requested sort as primary orderBy + addOrderBy tie-breakers, in request order", async () => {
      const qb = buildQbMock();
      repository["policyRepository"].manager = {
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      } as any;

      await repository.getCautionDepositTransactionsByCautionDepositId(
        1,
        1,
        10,
        undefined,
        "balance:DESC,transactionDate:ASC",
      );

      expect(qb.orderBy).toHaveBeenCalledWith("cdt.cd_balance_amount", "DESC");
      expect(qb.addOrderBy).toHaveBeenCalledWith("cdt.transaction_date", "ASC");
    });
  });
});
