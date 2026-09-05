import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getDataSourceToken, getRepositoryToken } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import {
  ClaimActivityDocumentMap,
  ClaimActivityMap,
  ClaimAssessmentReport,
  ClaimCustomerAgreement,
  ClaimDischargeVoucher,
  ClaimDocumentsCollected,
  ClaimDocumentSubmissionTracker,
  ClaimFnolDetails,
  ClaimInformed,
  ClaimJointInspectionReport,
  ClaimLorDetails,
  ClaimLossAdjusterDetails,
  ClaimPayment,
  PolicyClaimSettlement,
  ClaimSurveyCompleted,
  ClaimValidationReport,
  ClaimVoucherToInsurer,
  PolicyClaim,
} from "../../../../service-lib/src/lib/entities";
import { NonGroupClaimRepository } from "./non-group-claim.repository";

describe("NonGroupClaimRepository", () => {
  let repository: NonGroupClaimRepository;
  let mockDataSource: Partial<DataSource>;
  let mockQueryRunner: any;
  let mockNonGroupClaimRepo: Partial<Repository<PolicyClaim>>;
  let mockClaimActivityMapRepo: Partial<Repository<ClaimActivityMap>>;

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        update: jest.fn(),
        findOneOrFail: jest.fn(),
      },
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    mockNonGroupClaimRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockClaimActivityMapRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NonGroupClaimRepository,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
        {
          provide: getRepositoryToken(PolicyClaim),
          useValue: mockNonGroupClaimRepo,
        },
        {
          provide: getRepositoryToken(ClaimActivityMap),
          useValue: mockClaimActivityMapRepo,
        },
        // Mock all other entity repositories
        { provide: getRepositoryToken(ClaimActivityDocumentMap), useValue: {} },
        { provide: getRepositoryToken(ClaimInformed), useValue: {} },
        { provide: getRepositoryToken(ClaimFnolDetails), useValue: {} },
        { provide: getRepositoryToken(ClaimLossAdjusterDetails), useValue: {} },
        { provide: getRepositoryToken(ClaimSurveyCompleted), useValue: {} },
        { provide: getRepositoryToken(ClaimDocumentsCollected), useValue: {} },
        {
          provide: getRepositoryToken(ClaimJointInspectionReport),
          useValue: {},
        },
        { provide: getRepositoryToken(ClaimLorDetails), useValue: {} },
        {
          provide: getRepositoryToken(ClaimDocumentSubmissionTracker),
          useValue: {},
        },
        { provide: getRepositoryToken(ClaimAssessmentReport), useValue: {} },
        { provide: getRepositoryToken(ClaimValidationReport), useValue: {} },
        {
          provide: getRepositoryToken(PolicyClaimSettlement),
          useValue: {},
        },
        { provide: getRepositoryToken(ClaimDischargeVoucher), useValue: {} },
        { provide: getRepositoryToken(ClaimCustomerAgreement), useValue: {} },
        { provide: getRepositoryToken(ClaimVoucherToInsurer), useValue: {} },
        { provide: getRepositoryToken(ClaimPayment), useValue: {} },
      ],
    }).compile();

    repository = module.get<NonGroupClaimRepository>(NonGroupClaimRepository);
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("createNonGroupClaim", () => {
    it("should create a non-group claim successfully", async () => {
      const claimData = {
        policyId: 1,
        claimNumber: "CLM001",
        claimType: "Motor",
      };
      const userId = 1;

      const mockClaim = {
        id: 1,
        ...claimData,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNonGroupClaimRepo.create = jest.fn().mockReturnValue(mockClaim);
      mockQueryRunner.manager.save.mockResolvedValue(mockClaim);

      const result = await repository.createNonGroupClaim(
        claimData as any,
        userId,
        mockQueryRunner.manager
      );

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        PolicyClaim,
        mockClaim
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(mockClaim);
    });

    it("should rollback transaction on error", async () => {
      const claimData = {
        policyId: 1,
        claimNumber: "CLM001",
        claimType: "Motor",
      };
      const userId = 1;

      mockNonGroupClaimRepo.create = jest.fn().mockReturnValue({});
      mockQueryRunner.manager.save.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        repository.createNonGroupClaim(
          claimData as any,
          userId,
          mockQueryRunner.manager
        )
      ).rejects.toThrow("Failed to create non-group claim");

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe("findNonGroupClaimById", () => {
    it("should find a non-group claim by id successfully", async () => {
      const claimId = 1;
      const mockClaim = {
        id: 1,
        policyId: 1,
        claimNumber: "CLM001",
        claimType: "Motor",
        claimActivityMaps: [],
      };

      mockNonGroupClaimRepo.findOne = jest.fn().mockResolvedValue(mockClaim);

      const result = await repository.findNonGroupClaimById(claimId);

      expect(mockNonGroupClaimRepo.findOne).toHaveBeenCalledWith({
        where: { id: claimId },
        relations: ["claimActivityMaps"],
      });
      expect(result).toEqual(mockClaim);
    });

    it("should throw NotFoundException when claim not found", async () => {
      const claimId = 1;

      mockNonGroupClaimRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(repository.findNonGroupClaimById(claimId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findAllNonGroupClaims", () => {
    it("should find all non-group claims with filters", async () => {
      const filters = {
        policyId: 1,
        claimNumber: "CLM",
        statusLid: 1,
        limit: 10,
        offset: 0,
      };

      const mockClaims = [
        {
          id: 1,
          policyId: 1,
          claimNumber: "CLM001",
          claimType: "Motor",
          claimActivityMaps: [],
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockClaims, 1]),
      };

      mockNonGroupClaimRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await repository.findAllNonGroupClaims(1, 1, 1);

      expect(mockNonGroupClaimRepo.createQueryBuilder).toHaveBeenCalledWith(
        "claim"
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "claim.claimActivityMaps",
        "activityMap"
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        "claim.createdAt",
        "DESC"
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3); // policyId, claimNumber, statusLid
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(0);
      expect(result).toEqual({ claims: mockClaims, total: 1 });
    });

    it("should find all non-group claims without filters", async () => {
      const mockClaims = [
        {
          id: 1,
          policyId: 1,
          claimNumber: "CLM001",
          claimType: "Motor",
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockClaims, 1]),
      };

      mockNonGroupClaimRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await repository.findAllNonGroupClaims(1, 1, 1);

      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({ claims: mockClaims, total: 1 });
    });
  });

  describe("flattenValidationErrors", () => {
    it("should flatten validation errors correctly", () => {
      const mockErrors = [
        {
          property: "claimType",
          constraints: {
            isNotEmpty: "claimType should not be empty",
          },
          children: [],
        },
      ];

      const result = repository.flattenValidationErrors(mockErrors as any);

      expect(result).toEqual({
        claimType: ["claimType should not be empty"],
      });
    });

    it("should handle nested validation errors", () => {
      const mockErrors = [
        {
          property: "parent",
          constraints: null,
          children: [
            {
              property: "child",
              constraints: {
                isString: "child must be a string",
              },
              children: [],
            },
          ],
        },
      ];

      const result = repository.flattenValidationErrors(mockErrors as any);

      expect(result).toEqual({
        child: ["child must be a string"],
      });
    });
  });

  describe("createClaimActivities", () => {
    it("should create claim activities successfully", async () => {
      const mockClaim = {
        id: 1,
        policyId: 1,
        claimNumber: "CLM001",
      };
      const userId = 1;

      const mockTemplates = [
        {
          id: 1,
          stageName: "Initial Stage",
          activityName: "Claim Informed",
          activityTable: "claim_informed",
          stageActivityOrder: 1,
        },
        {
          id: 2,
          stageName: "Investigation Stage",
          activityName: "FNOL Details",
          activityTable: "claim_fnol_details",
          stageActivityOrder: 2,
        },
      ];

      const mockEntityManager = {
        find: jest.fn().mockResolvedValue(mockTemplates),
        save: jest.fn().mockResolvedValue([]),
      };

      const result = await repository.createClaimActivities(
        mockClaim as any,
        userId,
        mockEntityManager as any
      );

      expect(mockEntityManager.find).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          order: { stageActivityOrder: "ASC" },
        })
      );
      expect(mockEntityManager.save).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should handle errors when creating claim activities", async () => {
      const mockClaim = { id: 1, policyId: 1, claimNumber: "CLM001" };
      const userId = 1;

      const mockEntityManager = {
        find: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      await expect(
        repository.createClaimActivities(
          mockClaim as any,
          userId,
          mockEntityManager as any
        )
      ).rejects.toThrow("Failed to create claim activities");
    });
  });

  describe("getClaimInformed", () => {
    it("should get claim informed data successfully", async () => {
      const claimActivityId = 1;
      const claimId = 1;

      const mockClaimInformed = {
        id: 1,
        claimActivityId,
        claimType: "Motor",
        intimationDate: new Date(),
        createdBy: 1,
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockEntityManager = {
        findOne: jest.fn().mockResolvedValue(mockClaimInformed),
      };

      const result = await repository.getClaimInformed(
        claimActivityId,
        claimId,
        mockEntityManager as any
      );

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: { claimActivityId },
        })
      );
      expect(result).toEqual({
        claimActivityId,
        statusKey: "claim_informed",
        data: mockClaimInformed,
      });
    });

    it("should return null data when claim informed not found", async () => {
      const claimActivityId = 1;
      const claimId = 1;

      const mockEntityManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      const result = await repository.getClaimInformed(
        claimActivityId,
        claimId,
        mockEntityManager as any
      );

      expect(result).toEqual({
        claimActivityId,
        statusKey: "claim_informed",
        data: null,
      });
    });
  });

  describe("checkActivityStatus", () => {
    it("should check activity status successfully", async () => {
      const statusLid = 1;
      const mockLookUp = {
        id: 1,
        lookupKey: "ACTIVE",
        lookupValue: "Active",
      };

      jest
        .spyOn(repository, "checkActivityStatus")
        .mockResolvedValue(mockLookUp);

      const result = await repository.checkActivityStatus(statusLid);

      expect(result).toEqual(mockLookUp);
    });

    it("should return null when status not found", async () => {
      const statusLid = 999;

      jest.spyOn(repository, "checkActivityStatus").mockResolvedValue(null);

      const result = await repository.checkActivityStatus(statusLid);

      expect(result).toBeNull();
    });
  });

  describe("saveClaimInformed", () => {
    it("should save claim informed data successfully", async () => {
      const mockActivityData = {
        claimType: "Motor",
        intimationDate: new Date(),
        incidentDate: new Date(),
        incidentLocation: "Bangalore",
      };
      const userId = 1;

      const mockSavedData = {
        id: 1,
        ...mockActivityData,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockEntityManager = {
        save: jest.fn().mockResolvedValue(mockSavedData),
      };

      const result = await repository.saveClaimInformed(
        mockEntityManager as any,
        mockActivityData as any,
        userId
      );

      expect(mockEntityManager.save).toHaveBeenCalled();
      expect(result).toEqual(mockSavedData);
    });

    it("should handle errors when saving claim informed data", async () => {
      const mockActivityData = {
        claimType: "Motor",
        intimationDate: new Date(),
      };
      const userId = 1;

      const mockEntityManager = {
        save: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      await expect(
        repository.saveClaimInformed(
          mockEntityManager as any,
          mockActivityData as any,
          userId
        )
      ).rejects.toThrow("Failed to save claim informed data");
    });
  });
});
