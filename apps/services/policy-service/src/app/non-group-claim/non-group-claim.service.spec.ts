import { Test, TestingModule } from "@nestjs/testing";
import { NonGroupClaimService } from "./non-group-claim.service";
import { NonGroupClaimRepository } from "./non-group-claim.repository";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("NonGroupClaimService", () => {
  let service: NonGroupClaimService;
  const repository = {
    createNonGroupClaim: jest.fn(),
    findNonGroupClaimById: jest.fn(),
    updateNonGroupClaim: jest.fn(),
    findAllNonGroupClaims: jest.fn(),
    findClaimActivityMap: jest.fn(),
    findClaimActivitiesByPolicy: jest.fn(),
    updateClaimActivityStatus: jest.fn(),
    saveActivityData: jest.fn(),
    updateActivityData: jest.fn(),
    validateActivityData: jest.fn(),
    flattenValidationErrors: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NonGroupClaimService,
        { provide: NonGroupClaimRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<NonGroupClaimService>(NonGroupClaimService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createClaimActivityMeta", () => {
    it("should create claim activity meta successfully", async () => {
      const userId = 1;
      const activityMetaData = {
        policyId: 1,
        claimNumber: "CLM001",
        activityTable: "claim_informed",
        activityData: {
          claimType: "Motor",
          intimationDate: new Date(),
        },
      };

      const mockActivityMap = {
        id: 1,
        policyId: 1,
        claimNumber: "CLM001",
        activityTable: "claim_informed",
        statusLid: 0,
        createdBy: 1,
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSavedActivity = {
        id: 1,
        createdBy: 1,
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findClaimActivityMap.mockResolvedValue(mockActivityMap);
      repository.validateActivityData.mockResolvedValue([]);
      repository.saveActivityData.mockResolvedValue(mockSavedActivity);
      repository.updateClaimActivityStatus.mockResolvedValue({
        ...mockActivityMap,
        statusLid: 1,
        updatedBy: userId,
      });

      const result = await service.createClaimActivityMeta(
        activityMetaData,
        userId
      );

      expect(repository.findClaimActivityMap).toHaveBeenCalledWith(
        activityMetaData.policyId,
        activityMetaData.claimNumber
      );
      expect(repository.validateActivityData).toHaveBeenCalledWith(
        "claim_informed",
        activityMetaData.activityData
      );
      expect(repository.saveActivityData).toHaveBeenCalledWith(
        "claim_informed",
        activityMetaData.activityData,
        mockActivityMap.id,
        userId
      );
      expect(repository.updateClaimActivityStatus).toHaveBeenCalledWith(
        mockActivityMap.id,
        1,
        userId
      );
      expect(result).toEqual({
        id: mockSavedActivity.id,
        policyId: mockActivityMap.policyId,
        claimNumber: mockActivityMap.claimNumber,
        activityTable: "claim_informed",
        statusLid: 1,
        createdBy: mockSavedActivity.createdBy,
        updatedBy: mockSavedActivity.updatedBy,
        createdAt: mockSavedActivity.createdAt,
        updatedAt: mockSavedActivity.updatedAt,
      });
    });

    it("should throw NotFoundException when activity map not found", async () => {
      const userId = 1;
      const activityMetaData = {
        policyId: 1,
        claimNumber: "CLM001",
        activityTable: "claim_informed",
        activityData: {},
      };

      repository.findClaimActivityMap.mockRejectedValue(
        new NotFoundException("Claim activity not found")
      );

      await expect(
        service.createClaimActivityMeta(activityMetaData, userId)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when validation fails", async () => {
      const userId = 1;
      const activityMetaData = {
        policyId: 1,
        claimNumber: "CLM001",
        activityTable: "claim_informed",
        activityData: {},
      };

      const mockActivityMap = {
        id: 1,
        policyId: 1,
        claimNumber: "CLM001",
        activityTable: "claim_informed",
        statusLid: 0,
      };

      const mockValidationErrors = [
        {
          property: "claimType",
          constraints: { isNotEmpty: "claimType should not be empty" },
        },
      ];

      repository.findClaimActivityMap.mockResolvedValue(mockActivityMap);
      repository.validateActivityData.mockResolvedValue(mockValidationErrors);
      repository.flattenValidationErrors.mockReturnValue({
        claimType: ["claimType should not be empty"],
      });

      await expect(
        service.createClaimActivityMeta(activityMetaData, userId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("updateClaimActivityMeta", () => {
    it("should update claim activity meta successfully", async () => {
      const claimActivityId = 1;
      const userId = 1;
      const activityMetaData = {
        policyId: 1,
        claimNumber: "CLM001",
        activityTable: "claim_informed",
        activityData: {
          claimType: "Motor Updated",
        },
      };

      const mockActivityMap = {
        id: 1,
        policyId: 1,
        claimNumber: "CLM001",
        activityTable: "claim_informed",
        statusLid: 1,
      };

      const mockUpdatedActivity = {
        id: 1,
        createdBy: 1,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.validateActivityData.mockResolvedValue([]);
      repository.updateActivityData.mockResolvedValue(mockUpdatedActivity);
      repository.updateClaimActivityStatus.mockResolvedValue({
        ...mockActivityMap,
        updatedBy: userId,
      });

      const result = await service.updateClaimActivityMeta(
        claimActivityId,
        activityMetaData,
        userId
      );

      expect(repository.validateActivityData).toHaveBeenCalledWith(
        "claim_informed",
        activityMetaData.activityData
      );
      expect(repository.updateActivityData).toHaveBeenCalledWith(
        "claim_informed",
        activityMetaData.activityData,
        claimActivityId,
        userId
      );
      expect(result).toBeDefined();
    });
  });

  describe("getClaimActivityMeta", () => {
    it("should get claim activity meta for single ID successfully", async () => {
      const claimActivityId = 1;

      const mockActivityMap = {
        id: 1,
        claimId: 1,
        activityTable: "claim_informed",
        statusLid: 1,
      };

      const mockActivityData = {
        claimActivityId: 1,
        statusKey: "claim_informed",
        data: {
          id: 1,
          claimType: "Motor",
          intimationDate: new Date(),
        },
      };

      repository.findClaimActivityMap.mockResolvedValue(mockActivityMap);
      jest
        .spyOn(service, "getActivityDataByTable")
        .mockResolvedValue(mockActivityData);

      const result = await service.getClaimActivityMeta(claimActivityId);

      expect(repository.findClaimActivityMap).toHaveBeenCalledWith(
        claimActivityId
      );
      expect(result).toEqual({
        message: "Claim activity data retrieved successfully",
        data: [mockActivityData],
      });
    });

    it("should get claim activity meta for multiple IDs successfully", async () => {
      const claimActivityIds = [1, 2];

      const mockActivityMap1 = {
        id: 1,
        claimId: 1,
        activityTable: "claim_informed",
        statusLid: 1,
      };

      const mockActivityMap2 = {
        id: 2,
        claimId: 1,
        activityTable: "claim_fnol_details",
        statusLid: 1,
      };

      const mockActivityData1 = {
        claimActivityId: 1,
        statusKey: "claim_informed",
        data: {
          id: 1,
          claimType: "Motor",
        },
      };

      const mockActivityData2 = {
        claimActivityId: 2,
        statusKey: "claim_fnol_details",
        data: {
          id: 2,
          vehicleNumber: "KA01AB1234",
        },
      };

      repository.findClaimActivityMap
        .mockResolvedValueOnce(mockActivityMap1)
        .mockResolvedValueOnce(mockActivityMap2);

      jest
        .spyOn(service, "getActivityDataByTable")
        .mockResolvedValueOnce(mockActivityData1)
        .mockResolvedValueOnce(mockActivityData2);

      const result = await service.getClaimActivityMeta(claimActivityIds);

      expect(repository.findClaimActivityMap).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        message: "Claim activity data retrieved successfully",
        data: [mockActivityData1, mockActivityData2],
      });
    });

    it("should handle missing activity map gracefully", async () => {
      const claimActivityId = 999;

      repository.findClaimActivityMap.mockResolvedValue(null);

      const result = await service.getClaimActivityMeta(claimActivityId);

      expect(repository.findClaimActivityMap).toHaveBeenCalledWith(
        claimActivityId
      );
      expect(result).toEqual({
        message: "Claim activity data retrieved successfully",
        data: [
          {
            claimActivityId: 999,
            statusKey: null,
            data: null,
            error: "Claim activity not found for id: 999",
          },
        ],
      });
    });

    it("should handle errors when getting claim activity meta", async () => {
      const claimActivityId = 1;
      const error = new Error("Database error");

      repository.findClaimActivityMap.mockRejectedValue(error);

      await expect(
        service.getClaimActivityMeta(claimActivityId)
      ).rejects.toThrow("Failed to get claim activity meta: Database error");
    });
  });

  describe("createNonGroupClaim", () => {
    it("should create non-group claim successfully", async () => {
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

      repository.createNonGroupClaim.mockResolvedValue(mockClaim);

      const result = await service.createNonGroupClaim(claimData, userId);

      expect(repository.createNonGroupClaim).toHaveBeenCalledWith(
        claimData,
        userId
      );
      expect(result).toEqual(mockClaim);
    });
  });

  describe("getNonGroupClaim", () => {
    it("should get non-group claim by id successfully", async () => {
      const claimId = 1;
      const mockClaim = {
        id: 1,
        policyId: 1,
        claimNumber: "CLM001",
        claimType: "Motor",
        createdBy: 1,
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findNonGroupClaimById.mockResolvedValue(mockClaim);

      const result = await service.getNonGroupClaim(claimId);

      expect(repository.findNonGroupClaimById).toHaveBeenCalledWith(claimId);
      expect(result).toEqual(mockClaim);
    });
  });

  describe("getAllNonGroupClaims", () => {
    it("should get all non-group claims successfully", async () => {
      const queries = {
        page: 1,
        limit: 10,
        searchBy: "claimNumber",
        searchValue: "CLM001",
      };
      const userId = 1;
      const mockResult = {
        data: [
          {
            id: 1,
            policyId: 1,
            claimNumber: "CLM001",
            claimType: "Motor",
            createdBy: 1,
            updatedBy: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        count: 1,
      };

      repository.findAllNonGroupClaims.mockResolvedValue(mockResult);

      const result = await service.getAllNonGroupClaims(queries, userId);

      expect(repository.findAllNonGroupClaims).toHaveBeenCalledWith(
        userId,
        queries.page,
        queries.limit,
        expect.any(Array),
        undefined,
        queries.searchBy,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );
      expect(result).toEqual(mockResult);
    });
  });
});
