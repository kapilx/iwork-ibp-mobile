import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";
import { NonGroupClaimController } from "./non-group-claim.controller";
import { NonGroupClaimService } from "./non-group-claim.service";

type MockRequest = Partial<Request> & {
  headers?: { userid?: string };
};

type MockResponse = Partial<Response> & {
  status: jest.Mock;
  json: jest.Mock;
};

describe("NonGroupClaimController", () => {
  let controller: NonGroupClaimController;
  let mockService: jest.Mocked<NonGroupClaimService>;
  let mockResponse: MockResponse;

  beforeEach(async () => {
    mockService = {
      createClaimActivityMeta: jest.fn(),
      updateClaimActivityMeta: jest.fn(),
      getClaimActivityMeta: jest.fn(),
      createNonGroupClaim: jest.fn(),
      getNonGroupClaim: jest.fn(),
      getAllNonGroupClaims: jest.fn(),
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NonGroupClaimController],
      providers: [{ provide: NonGroupClaimService, useValue: mockService }],
    }).compile();

    controller = module.get<NonGroupClaimController>(NonGroupClaimController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("createNonGroupClaim", () => {
    it("should create non-group claim successfully", async () => {
      const mockRequest: MockRequest = {
        headers: { userid: "1" },
      };
      const mockClaimData = {
        policyId: 1,
        claimNumber: "CLM001",
        claimType: "Motor",
      };
      const mockResult = {
        claim: {
          id: 1,
          policyId: 1,
          claimNumber: "CLM001",
          claimType: "Motor",
          createdBy: 1,
          updatedBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        activities: [
          {
            id: 1,
            activityName: "Claim Informed",
            activityTable: "claim_informed",
          },
        ],
      };

      mockService.createNonGroupClaim.mockResolvedValue(mockResult);

      await controller.createNonGroupClaim(
        mockClaimData as any,
        mockRequest as any,
        mockResponse as any
      );

      expect(mockService.createNonGroupClaim).toHaveBeenCalledWith(
        mockClaimData,
        1
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.CREATED,
        message: "Non-group claim created successfully",
        data: mockResult.claim,
        timestamp: expect.any(String),
      });
    });

    it("should handle errors when creating non-group claim", async () => {
      const mockRequest: MockRequest = {
        headers: { userid: "1" },
      };
      const mockClaimData = {
        policyId: 1,
        claimNumber: "CLM001",
        claimType: "Motor",
      };
      const error = new Error("Database error");

      mockService.createNonGroupClaim.mockRejectedValue(error);

      await controller.createNonGroupClaim(
        mockClaimData as any,
        mockRequest as any,
        mockResponse as any
      );

      expect(mockService.createNonGroupClaim).toHaveBeenCalledWith(
        mockClaimData,
        1
      );
    });
  });

  describe("getNonGroupClaim", () => {
    it("should get non-group claim by id successfully", async () => {
      const claimId = 1;
      const mockResult = {
        id: 1,
        policyId: 1,
        claimNumber: "CLM001",
        claimType: "Motor",
        companyId: 1,
        opportunityId: 1,
        statusKey: "ACTIVE",
        createdBy: 1,
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.getNonGroupClaim.mockResolvedValue(mockResult);

      await controller.getNonGroupClaim(claimId, mockResponse as any);

      expect(mockService.getNonGroupClaim).toHaveBeenCalledWith(claimId);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.OK,
        message: "successMessage",
        data: mockResult,
        timestamp: expect.any(String),
      });
    });

    it("should handle errors when getting non-group claim", async () => {
      const claimId = 1;
      const error = new Error("Claim not found");

      mockService.getNonGroupClaim.mockRejectedValue(error);

      await controller.getNonGroupClaim(claimId, mockResponse as any);

      expect(mockService.getNonGroupClaim).toHaveBeenCalledWith(claimId);
    });
  });

  describe("getAllNonGroupClaims", () => {
    it("should get all non-group claims successfully", async () => {
      const mockRequest: MockRequest = {
        headers: { userid: "1" },
      };
      const mockQueries = {
        page: 1,
        limit: 10,
      };
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

      mockService.getAllNonGroupClaims.mockResolvedValue(mockResult);

      await controller.getAllNonGroupClaims(
        mockQueries as any,
        mockResponse as any,
        mockRequest as any
      );

      expect(mockService.getAllNonGroupClaims).toHaveBeenCalledWith(
        mockQueries,
        1
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.OK,
        message: "Non-group claims retrieved successfully",
        data: mockResult,
        timestamp: expect.any(String),
      });
    });

    it("should handle errors when getting all non-group claims", async () => {
      const mockRequest: MockRequest = {
        headers: { userid: "1" },
      };
      const mockQueries = {
        page: 1,
        limit: 10,
      };
      const error = new Error("Database error");

      mockService.getAllNonGroupClaims.mockRejectedValue(error);

      await controller.getAllNonGroupClaims(
        mockQueries as any,
        mockResponse as any,
        mockRequest as any
      );

      expect(mockService.getAllNonGroupClaims).toHaveBeenCalledWith(
        mockQueries,
        1
      );
    });
  });

  describe("createClaimActivityMeta", () => {
    it("should create claim activity meta successfully", async () => {
      const mockRequest: MockRequest = {
        headers: { userid: "1" },
      };
      const mockActivityData = {
        policyId: 1,
        claimNumber: "CLM001",
        activityTable: "claim_informed",
        activityData: {
          claimType: "Motor",
          intimationDate: new Date(),
        },
      };
      const mockResult = {
        message: "Activity created successfully",
        data: {
          id: 1,
          policyId: 1,
          claimNumber: "CLM001",
          activityTable: "claim_informed",
          statusLid: 1,
          createdBy: 1,
          updatedBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockService.createClaimActivityMeta.mockResolvedValue(mockResult);

      await controller.createClaimActivityMeta(
        mockActivityData,
        mockRequest as any,
        mockResponse as any
      );

      expect(mockService.createClaimActivityMeta).toHaveBeenCalledWith(
        mockActivityData,
        1
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.CREATED,
        message: mockResult.message,
        data: mockResult.data,
        timestamp: expect.any(String),
      });
    });

    it("should handle errors when creating claim activity meta", async () => {
      const mockRequest: MockRequest = {
        headers: { userid: "1" },
      };
      const mockActivityData = {
        policyId: 1,
        claimNumber: "CLM001",
        activityTable: "claim_informed",
        activityData: {},
      };
      const error = new Error("Validation error");

      mockService.createClaimActivityMeta.mockRejectedValue(error);

      await controller.createClaimActivityMeta(
        mockActivityData,
        mockRequest as any,
        mockResponse as any
      );

      expect(mockService.createClaimActivityMeta).toHaveBeenCalledWith(
        mockActivityData,
        1
      );
    });
  });

  describe("updateClaimActivityMeta", () => {
    it("should update claim activity meta successfully", async () => {
      const claimActivityId = 1;
      const mockRequest: MockRequest = {
        headers: { userid: "1" },
      };
      const mockActivityData = {
        policyId: 1,
        claimNumber: "CLM001",
        activityTable: "claim_informed",
        activityData: {
          claimType: "Motor Updated",
        },
      };
      const mockResult = {
        message: "Activity updated successfully",
        data: {
          id: 1,
          policyId: 1,
          claimNumber: "CLM001",
          activityTable: "claim_informed",
          statusLid: 1,
          createdBy: 1,
          updatedBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockService.updateClaimActivityMeta.mockResolvedValue(mockResult);

      await controller.updateClaimActivityMeta(
        claimActivityId,
        mockActivityData,
        mockRequest as any,
        mockResponse as any
      );

      expect(mockService.updateClaimActivityMeta).toHaveBeenCalledWith(
        claimActivityId,
        mockActivityData,
        1
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.OK,
        message: mockResult.message,
        data: mockResult.data,
        timestamp: expect.any(String),
      });
    });

    it("should handle errors when updating claim activity meta", async () => {
      const claimActivityId = 1;
      const mockRequest: MockRequest = {
        headers: { userid: "1" },
      };
      const mockActivityData = {
        policyId: 1,
        claimNumber: "CLM001",
        activityTable: "claim_informed",
        activityData: {},
      };
      const error = new Error("Update error");

      mockService.updateClaimActivityMeta.mockRejectedValue(error);

      await controller.updateClaimActivityMeta(
        claimActivityId,
        mockActivityData,
        mockRequest as any,
        mockResponse as any
      );

      expect(mockService.updateClaimActivityMeta).toHaveBeenCalledWith(
        claimActivityId,
        mockActivityData,
        1
      );
    });
  });

  describe("getClaimActivityMeta", () => {
    it("should get claim activity meta for single ID successfully", async () => {
      const claimActivityIdParam = "1";
      const mockResult = {
        message: "Claim activity data retrieved successfully",
        data: [
          {
            claimActivityId: 1,
            statusKey: "claim_informed",
            data: {
              id: 1,
              claimType: "Motor",
              intimationDate: new Date(),
            },
          },
        ],
      };

      mockService.getClaimActivityMeta.mockResolvedValue(mockResult);

      await controller.getClaimActivityMeta(
        claimActivityIdParam,
        mockResponse as any
      );

      expect(mockService.getClaimActivityMeta).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.OK,
        message: "success",
        data: mockResult,
        timestamp: expect.any(String),
      });
    });

    it("should get claim activity meta for multiple IDs successfully", async () => {
      const claimActivityIdParam = "1,2,3";
      const mockResult = {
        message: "Claim activity data retrieved successfully",
        data: [
          {
            claimActivityId: 1,
            statusKey: "claim_informed",
            data: { id: 1, claimType: "Motor" },
          },
          {
            claimActivityId: 2,
            statusKey: "claim_fnol_details",
            data: { id: 2, vehicleNumber: "KA01AB1234" },
          },
          {
            claimActivityId: 3,
            statusKey: null,
            data: null,
            error: "Claim activity not found for id: 3",
          },
        ],
      };

      mockService.getClaimActivityMeta.mockResolvedValue(mockResult);

      await controller.getClaimActivityMeta(
        claimActivityIdParam,
        mockResponse as any
      );

      expect(mockService.getClaimActivityMeta).toHaveBeenCalledWith([1, 2, 3]);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.OK,
        message: "success",
        data: mockResult,
        timestamp: expect.any(String),
      });
    });

    it("should handle invalid single ID parameter", async () => {
      const claimActivityIdParam = "invalid";

      await controller.getClaimActivityMeta(
        claimActivityIdParam,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: "Invalid claim activity ID parameter",
        timestamp: expect.any(String),
      });
    });

    it("should handle invalid comma-separated IDs parameter", async () => {
      const claimActivityIdParam = "invalid,data,here";

      await controller.getClaimActivityMeta(
        claimActivityIdParam,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: "Invalid claim activity IDs in comma-separated parameter",
        timestamp: expect.any(String),
      });
    });

    it("should handle errors when getting claim activity meta", async () => {
      const claimActivityIdParam = "1";
      const error = new Error("Database error");

      mockService.getClaimActivityMeta.mockRejectedValue(error);

      await controller.getClaimActivityMeta(
        claimActivityIdParam,
        mockResponse as any
      );

      expect(mockService.getClaimActivityMeta).toHaveBeenCalledWith(1);
    });
  });
});
