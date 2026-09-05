import { Test, TestingModule } from "@nestjs/testing";
import { BrokerService } from "./broker.service";
import { BrokerRepository } from "./broker.repository";
import { AddressService } from "../address/address.service";
import { DataSource } from "typeorm";
import { LookUpRepository } from "../look-up/look-up.repository";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import {
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from "@nestjs/common";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";

describe("BrokerService", () => {
  let service: BrokerService;
  let brokerRepository: BrokerRepository;
  let addressService: AddressService;
  let lookUpRepository: LookUpRepository;
  let dataSource: DataSource;

  let consoleErrorMock: jest.SpyInstance;
  let consoleLogMock: jest.SpyInstance;

  const mockBrokerRepository = {
    findBrokerByName: jest.fn(),
    addBroker: jest.fn(),
    fetchAllBrokers: jest.fn(),
    fetchBrokerById: jest.fn(),
    modifyBroker: jest.fn(),
    softDeleteBroker: jest.fn(),
    fetchBrokerList: jest.fn(),
    fetchBrokerDetails: jest.fn(),
    getBrokerById: jest.fn(),
    addBrokerAddress: jest.fn(),
  };

  const mockAddressService = {
    addAddress: jest.fn(),
    updateAddressById: jest.fn(),
  };

  const mockLookUpRepository = {
    findByLookUpKey: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    }),
  };

  const mockMasterValidation = {
    validateMasterIds: jest.fn(),
  };

  const mockLookUpValidation = {
    validateDynamicLookupValues: jest.fn(),
  };

  beforeEach(async () => {
    consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    consoleLogMock = jest.spyOn(console, "log").mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrokerService,
        { provide: BrokerRepository, useValue: mockBrokerRepository },
        { provide: AddressService, useValue: mockAddressService },
        { provide: LookUpRepository, useValue: mockLookUpRepository },
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: LookUpValidationService,
          useValue: mockLookUpValidation,
          // validateDynamicLookupValues: jest.fn(),
        },
        {
          provide: MasterValidationService,
          useValue: mockMasterValidation,
        },
      ],
    }).compile();

    service = module.get<BrokerService>(BrokerService);
    brokerRepository = module.get<BrokerRepository>(BrokerRepository);
    addressService = module.get<AddressService>(AddressService);
    lookUpRepository = module.get<LookUpRepository>(LookUpRepository);
    dataSource = module.get<DataSource>(DataSource);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
  afterEach(() => {
    // Restore console.error and console.log
    consoleErrorMock.mockRestore();
    consoleLogMock.mockRestore();
  });

  describe("createBroker", () => {
    it("should create a broker successfully", async () => {
      const createBrokerDto = {
        brokerName: "Test Broker",
        address: [{ address1: "123 Main St", city: "City" }],
      };
      const userId = 1;
      const mockBroker = { id: 1, brokerName: "Test Broker" };
      const mockAddress = { id: 1, address1: "123 Main St", city: "City" };
      const mockBrokerDetails = {
        id: 1,
        brokerName: "Test Broker",
        address: [mockAddress],
      };

      // Mock dependencies
      mockBrokerRepository.findBrokerByName.mockResolvedValue(null); // No existing broker
      mockLookUpRepository.findByLookUpKey.mockResolvedValue([{ id: 1 }]); // Default status
      mockMasterValidation.validateMasterIds.mockResolvedValue(undefined);
      mockLookUpValidation.validateDynamicLookupValues.mockResolvedValue(
        undefined
      );
      mockBrokerRepository.addBroker.mockResolvedValue(mockBroker); // Created broker
      mockAddressService.addAddress.mockResolvedValue(mockAddress); // Saved address
      mockBrokerRepository.addBrokerAddress.mockResolvedValue(null); // Linked address
      mockBrokerRepository.fetchBrokerById.mockResolvedValue(mockBrokerDetails); // Final fetch

      const result = await service.createBroker(createBrokerDto, userId);

      expect(mockBrokerRepository.findBrokerByName).toHaveBeenCalledWith(
        "Test Broker"
      );
      expect(mockMasterValidation.validateMasterIds).toHaveBeenCalledWith(
        createBrokerDto,
        expect.anything()
      );
      expect(
        mockLookUpValidation.validateDynamicLookupValues
      ).toHaveBeenCalledWith(createBrokerDto, expect.anything());
      expect(mockBrokerRepository.addBroker).toHaveBeenCalled();
      expect(mockAddressService.addAddress).toHaveBeenCalled();
      expect(mockBrokerRepository.addBrokerAddress).toHaveBeenCalled();
      expect(mockBrokerRepository.fetchBrokerById).toHaveBeenCalledWith(1);

      expect(result).toEqual({
        id: 1,
        brokerName: "Test Broker",
        address: [mockAddress],
      });
    });

    it("should throw an error if broker already exists", async () => {
      const createBrokerDto = { brokerName: "Test Broker", address: [] };
      const userId = 1;

      mockBrokerRepository.findBrokerByName.mockResolvedValue({ id: 1 });

      await expect(
        service.createBroker(createBrokerDto, userId)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("getAllBrokers", () => {
    it("should return all brokers successfully", async () => {
      const mockResult = { data: [], count: 0 };
      mockBrokerRepository.fetchAllBrokers.mockResolvedValue(mockResult);

      const result = await service.getAllBrokers(1, 10, "id", "ASC");

      expect(mockBrokerRepository.fetchAllBrokers).toHaveBeenCalled();
      expect(result).toEqual({
        brokers: [],
        total: 0,
        totalBrokers: 0,
      });
    });

    it("should throw an error when fetching all brokers fails", async () => {
      mockBrokerRepository.fetchAllBrokers.mockRejectedValue(
        new Error("Error")
      );

      await expect(service.getAllBrokers(1, 10, "id", "ASC")).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("getBrokerById", () => {
    it("should return a broker by ID successfully", async () => {
      const mockBroker = { id: 1, brokerName: "Test Broker" };
      mockBrokerRepository.fetchBrokerById.mockResolvedValue(mockBroker);

      const result = await service.getBrokerById(1);

      expect(mockBrokerRepository.fetchBrokerById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBroker);
    });

    it("should throw NotFoundException if broker is not found", async () => {
      mockBrokerRepository.fetchBrokerById.mockResolvedValue(null);

      await expect(service.getBrokerById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("modifyBroker", () => {
    it("should modify a broker successfully", async () => {
      const brokerId = 1;
      const updateBrokerDto = { brokerName: "Updated Broker", address: [] };
      const userId = 1;
      const mockBroker = {
        id: brokerId,
        brokerName: "Updated Broker",
        address: [],
      }; // Include the address field

      mockBrokerRepository.getBrokerById.mockResolvedValue(mockBroker);
      mockBrokerRepository.modifyBroker.mockResolvedValue(mockBroker);

      const result = await service.modifyBroker(
        brokerId,
        updateBrokerDto,
        userId
      );

      expect(mockBrokerRepository.getBrokerById).toHaveBeenCalledWith(brokerId);
      expect(mockBrokerRepository.modifyBroker).toHaveBeenCalled();
      expect(result).toEqual(mockBroker); // Ensure the result matches the updated mockBroker
    });

    it("should throw NotFoundException if broker is not found", async () => {
      const brokerId = 1;
      const updateBrokerDto = { brokerName: "Updated Broker", address: [] };
      const userId = 1;

      mockBrokerRepository.getBrokerById.mockResolvedValue(null);

      await expect(
        service.modifyBroker(brokerId, updateBrokerDto, userId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deleteBroker", () => {
    it("should delete a broker successfully", async () => {
      const brokerId = 1;
      const mockBroker = { id: brokerId };

      mockBrokerRepository.getBrokerById.mockResolvedValue(mockBroker);
      mockBrokerRepository.softDeleteBroker.mockResolvedValue(null);

      const result = await service.deleteBroker(brokerId);

      expect(mockBrokerRepository.getBrokerById).toHaveBeenCalledWith(brokerId);
      expect(mockBrokerRepository.softDeleteBroker).toHaveBeenCalledWith(
        brokerId
      );
      expect(result).toEqual({ message: "Broker deleted successfully" });
    });

    it("should throw NotFoundException if broker is not found", async () => {
      const brokerId = 1;

      mockBrokerRepository.getBrokerById.mockResolvedValue(null);

      await expect(service.deleteBroker(brokerId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("getBrokerList", () => {
    it("should return a list of brokers successfully", async () => {
      const mockResult = { data: [], total: 0 };
      mockBrokerRepository.fetchBrokerList.mockResolvedValue(mockResult);

      const result = await service.getBrokerList(1, 10, "", "id", "ASC", 1);

      expect(mockBrokerRepository.fetchBrokerList).toHaveBeenCalledWith(
        1,
        10,
        "",
        "id",
        "ASC",
        1
      );
      expect(result).toEqual(mockResult);
    });

    it("should throw an error when fetching broker list fails", async () => {
      mockBrokerRepository.fetchBrokerList.mockRejectedValue(
        new Error("Error")
      );

      await expect(
        service.getBrokerList(1, 10, "", "id", "ASC", 1)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("getBrokerDetails", () => {
    it("should return broker details successfully", async () => {
      const mockBrokerDetails = {
        id: 1,
        brokerName: "Test Broker",
        displayName: "Test Display Name",
        brokerAddresses: [
          {
            address: {
              id: 1,
              address1: "123 Main St",
              cityId: "City",
            },
          },
        ],
      };

      mockBrokerRepository.fetchBrokerDetails.mockResolvedValue(
        mockBrokerDetails
      );

      const result = await service.getBrokerDetails(1, 1);

      expect(mockBrokerRepository.fetchBrokerDetails).toHaveBeenCalledWith(
        ["id", "brokerName", "displayName", "createdAt"],
        ["brokerAddresses.address"],
        { id: 1, createdBy: 1 }
      );
      expect(result).toEqual({
        id: 1,
        brokerName: "Test Broker",
        displayName: "Test Display Name",
        brokerAddresses: [
          {
            id: 1,
            address1: "123 Main St",
            city: "City",
          },
        ],
      });
    });

    it("should throw NotFoundException if broker details are not found", async () => {
      mockBrokerRepository.fetchBrokerDetails.mockResolvedValue(null);

      await expect(service.getBrokerDetails(1, 1)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
