import { Test, TestingModule } from "@nestjs/testing";
import { BrokerController } from "./broker.controller";
import { BrokerService } from "./broker.service";
import { CreateBrokerDto } from "./dto/create-broker.dto";
import { UpdateBrokerDto } from "./dto/update-broker.dto";
import { HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { AuthGuard } from "../../../../../services/auth-service/src/guards/auth.guard";

describe("BrokerController", () => {
  let controller: BrokerController;
  let service: BrokerService;

  const mockBrokerService = {
    createBroker: jest.fn().mockResolvedValue({
      id: 1,
      brokerName: "Test Broker",
      displayName: "Test Display Name",
      address: [],
    }),
    getAllBrokers: jest.fn().mockResolvedValue({
      brokers: [],
      total: 0,
      totalBrokers: 0,
    }),
    getBrokerList: jest.fn().mockResolvedValue({
      brokers: [],
      total: 0,
    }),
    getBrokerDetails: jest.fn().mockResolvedValue({
      id: 1,
      brokerName: "Test Broker",
      displayName: "Test Display Name",
      address: [],
    }),
    getBrokerById: jest.fn().mockResolvedValue({
      id: 1,
      brokerName: "Test Broker", // Only return the expected fields
    }),
    modifyBroker: jest.fn().mockResolvedValue({
      id: 1,
      brokerName: "Updated Broker",
      displayName: "Updated Display Name",
    }),
    deleteBroker: jest.fn().mockResolvedValue({
      success: true,
    }),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true), // Mock the AuthGuard to always allow access
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrokerController],
      providers: [
        {
          provide: BrokerService,
          useValue: mockBrokerService,
        },
      ],
    })
      .overrideGuard(AuthGuard) // Override the AuthGuard with a mock
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<BrokerController>(BrokerController);
    service = module.get<BrokerService>(BrokerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("createBroker", () => {
    it("should create a broker successfully", async () => {
      const createBrokerDto: CreateBrokerDto = {
        brokerName: "Test Broker",
        displayName: "Test Display Name",
        address: [],
      };
      const userId = 1;
      const mockRequest = { user: { userDetails: { userId } } } as any;
      const mockBroker = { id: 1, ...createBrokerDto };

      mockBrokerService.createBroker.mockResolvedValue(mockBroker);

      await controller.createBroker(mockRequest, createBrokerDto, mockResponse);

      expect(mockBrokerService.createBroker).toHaveBeenCalledWith(
        createBrokerDto,
        userId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.CREATED,
        message: "Broker created successfully",
        data: mockBroker,
      });
    });

    it("should handle errors when creating a broker", async () => {
      const createBrokerDto: CreateBrokerDto = {
        brokerName: "Test Broker",
        displayName: "Test Display Name",
        address: [],
      };
      const userId = 1;
      const mockRequest = { user: { userDetails: { userId } } } as any;

      mockBrokerService.createBroker.mockRejectedValue(new Error("Error"));

      await controller.createBroker(mockRequest, createBrokerDto, mockResponse);

      expect(mockBrokerService.createBroker).toHaveBeenCalledWith(
        createBrokerDto,
        userId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.BAD_REQUEST,
        message: "Error",
      });
    });
  });

  describe("getAllBrokers", () => {
    it("should return all brokers successfully", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        sort: "id",
        sortOrder: "DESC",
        search: undefined,
        searchBy: undefined,
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockRequest = {
        user: {
          userDetails: {
            userId: 1,
          },
        },
      };

      const mockResult = {
        brokers: [],
        total: 0,
        totalBrokers: 0,
      };

      mockBrokerService.getAllBrokers.mockResolvedValue(mockResult);

      await controller.getAllBrokers(mockQuery, mockResponse, mockRequest);

      expect(mockBrokerService.getAllBrokers).toHaveBeenCalledWith(
        1,
        10,
        "id",
        undefined,
        undefined,
        1
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "Broker list retrieved successfully",
        data: {
          data: mockResult.brokers,
          count: mockResult.total,
          totalBrokers: mockResult.totalBrokers,
        },
      });
    });

    it("should handle errors when fetching all brokers", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        sort: "id",
        sortOrder: "DESC",
        search: undefined,
        searchBy: undefined,
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockRequest = {
        user: {
          userDetails: {
            userId: 1,
          },
        },
      };

      mockBrokerService.getAllBrokers.mockRejectedValue(
        new Error("Database error")
      );

      await controller.getAllBrokers(mockQuery, mockResponse, mockRequest);

      expect(mockBrokerService.getAllBrokers).toHaveBeenCalledWith(
        1,
        10,
        "id",
        undefined,
        undefined,
        1
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.BAD_REQUEST,
        message: "Failed to fetch brokers",
      });
    });
  });

  describe("getBrokerList", () => {
    it("should return a list of brokers successfully", async () => {
      const mockQuery = { page: 1, limit: 10 };
      const mockRequest = { user: { userDetails: { userId: 1 } } } as any;
      const mockBrokerList = { brokers: [], total: 0 };

      mockBrokerService.getBrokerList.mockResolvedValue(mockBrokerList);

      await controller.getBrokerList(mockQuery, mockResponse, mockRequest);

      expect(mockBrokerService.getBrokerList).toHaveBeenCalledWith(
        1,
        10,
        "",
        "id",
        "DESC",
        1
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "Broker list retrieved successfully",
        data: mockBrokerList,
      });
    });

    it("should handle errors when fetching the broker list", async () => {
      const mockQuery = { page: 1, limit: 10 };
      const mockRequest = { user: { userDetails: { userId: 1 } } } as any;

      mockBrokerService.getBrokerList.mockRejectedValue(new Error("Error"));

      await controller.getBrokerList(mockQuery, mockResponse, mockRequest);

      expect(mockBrokerService.getBrokerList).toHaveBeenCalledWith(
        1,
        10,
        "",
        "id",
        "DESC",
        1
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.BAD_REQUEST,
        message: "Error",
      });
    });
  });

  describe("getBrokerById", () => {
    it("should return a broker by ID successfully", async () => {
      const brokerId = 1; // Pass brokerId as a number
      const mockBroker = { id: 1, brokerName: "Test Broker" };

      mockBrokerService.getBrokerById.mockResolvedValue(mockBroker);

      await controller.getBrokerById(brokerId, mockResponse, {} as any);

      expect(mockBrokerService.getBrokerById).toHaveBeenCalledWith(brokerId);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "Broker retrieved successfully",
        data: mockBroker,
      });
    });

    it("should handle errors when fetching a broker by ID", async () => {
      const brokerId = 1; // Pass brokerId as a number

      mockBrokerService.getBrokerById.mockRejectedValue(
        new Error("Broker not found")
      );

      await controller.getBrokerById(brokerId, mockResponse, {} as any);

      expect(mockBrokerService.getBrokerById).toHaveBeenCalledWith(brokerId);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.BAD_REQUEST,
        message: "Broker not found",
      });
    });
  });

  describe("modifyBroker", () => {
    it("should modify a broker successfully", async () => {
      const brokerId = 1;
      const updateBrokerDto: UpdateBrokerDto = {
        brokerName: "Updated Broker",
        displayName: "Updated Display Name",
      };
      const userId = 1;
      const mockRequest = { user: { userDetails: { userId } } } as any;
      const mockBroker = { id: brokerId, ...updateBrokerDto };

      mockBrokerService.modifyBroker.mockResolvedValue(mockBroker);

      await controller.modifyBroker(
        mockRequest,
        brokerId,
        updateBrokerDto,
        mockResponse
      );

      expect(mockBrokerService.modifyBroker).toHaveBeenCalledWith(
        brokerId,
        updateBrokerDto,
        userId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "Broker updated successfully",
        data: mockBroker,
      });
    });
  });

  describe("deleteBroker", () => {
    it("should delete a broker successfully", async () => {
      const brokerId = 1; // Pass brokerId as a number
      const mockResult = { success: true };

      mockBrokerService.deleteBroker.mockResolvedValue(mockResult);

      await controller.deleteBroker(brokerId, {} as any, mockResponse);

      expect(mockBrokerService.deleteBroker).toHaveBeenCalledWith(brokerId);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "Broker deleted successfully",
        data: mockResult,
      });
    });
  });
});
