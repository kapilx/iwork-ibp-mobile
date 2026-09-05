import {
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { AddressService } from "../address/address.service";
import { ContactService } from "../contact/contact.service";
import { LookUpRepository } from "../look-up/look-up.repository";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation"; // Import LookUpValidationService
import * as helperUtils from "../../../../../../libs/service-lib/src/lib/utils/helper.utils"; // Import helperUtils
import { CreateInsurerDto } from "./dto/create-insurer.dto";
import { UpdateInsurerDto } from "./dto/update-insurer.dto";
import { InsurerRepository } from "./insurer.repository";
import { InsurerService } from "./insurer.service";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import { Insurer } from "../../../../service-lib/src/lib/entities";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  LOOK_UP_DATA,
  MASTER_DATA,
} from "../../../../../../libs/service-lib/src/lib/constants";

describe("InsurerService", () => {
  let service: InsurerService;
  let repository: InsurerRepository;
  let addressService: AddressService;
  let lookUpRepository: LookUpRepository; // Add this line

  const mockContactService = {
    addContact: jest.fn(),
    updateContactById: jest.fn(),
    getContactById: jest.fn(),
  };

  const mockMasterValidation = {
    validateMasterIds: jest.fn(),
  };

  const lookUpValidation = {
    validateDynamicLookupValues: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: MasterValidationService,
          useValue: mockMasterValidation,
        },
        InsurerService,
        {
          provide: InsurerRepository,
          useValue: {
            findInsurerByName: jest.fn(),
            addInsurer: jest.fn(),
            fetchAllInsurersWithAddress: jest.fn(),
            getTotalActiveInsurers: jest.fn(),
            addInsurerAddress: jest.fn(),
            fetchInsurerById: jest.fn(),
            modifyInsurer: jest.fn(),
            softDeleteInsurer: jest.fn(),
            fetchInsurerByIdWithDetails: jest.fn(),
            fetchInsurerList: jest.fn(),
            fetchInsurerDetails: jest.fn(),
            findCompanyInsurers: jest.fn(),
          },
        },
        {
          provide: AddressService,
          useValue: {
            addAddress: jest.fn(),
            updateAddressById: jest.fn(),
          },
        },
        {
          provide: ContactService,
          useValue: mockContactService,
        },
        {
          provide: LookUpRepository,
          useValue: {
            findByLookUpKey: jest.fn(),
          },
        },
        {
          provide: LookUpValidationService,
          useValue: {
            validateDynamicLookupValues: jest.fn(),
          },
        },
        {
          provide: MasterValidationService,
          useValue: {
            validateMasterIds: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<InsurerService>(InsurerService);
    repository = module.get<InsurerRepository>(InsurerRepository);
    addressService = module.get<AddressService>(AddressService);
    lookUpRepository = module.get<LookUpRepository>(LookUpRepository); // Add this line
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("addInsurer", () => {
    it("should throw ConflictException if insurer already exists", async () => {
      const createInsurerDto: CreateInsurerDto = {
        insurerName: "Existing Insurer",
        displayName: "Test Display",
        companyTypeLid: 1,
        isLifeLid: 1,
        companyTagLid: 1,
        address: [],
      };
      const userId = 1;

      jest.spyOn(repository, "findInsurerByName").mockResolvedValue([{}]);

      await expect(
        service.addInsurer(createInsurerDto, userId)
      ).rejects.toThrow(ConflictException);
    });

    it("should throw InternalServerErrorException if adding insurer fails", async () => {
      const createInsurerDto: CreateInsurerDto = {
        insurerName: "Test Insurer",
        displayName: "Test Display",
        companyTypeLid: 1,
        isLifeLid: 1,
        companyTagLid: 1,
        address: [],
      };
      const userId = 1;

      jest.spyOn(repository, "findInsurerByName").mockResolvedValue([]);
      jest
        .spyOn(repository, "addInsurer")
        .mockRejectedValue(new Error("Database error"));

      await expect(
        service.addInsurer(createInsurerDto, userId)
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("should throw InternalServerErrorException if address saving fails", async () => {
      const createInsurerDto: CreateInsurerDto = {
        insurerName: "Test Insurer",
        displayName: "Test Display",
        companyTypeLid: 1,
        isLifeLid: 1,
        companyTagLid: 1,
        address: [
          {
            addressTypeLid: 1,
            address1: "123 Main St",
            countryId: 1,
            stateId: 1,
            cityId: 1,
            phoneNumber: "1234567890",
            pinCode: "12345",
          },
        ],
      };
      const userId = 1;

      jest.spyOn(repository, "findInsurerByName").mockResolvedValue([]);
      jest.spyOn(repository, "addInsurer").mockResolvedValue({ id: 1 });
      jest
        .spyOn(addressService, "addAddress")
        .mockRejectedValue(new Error("Address error"));

      await expect(
        service.addInsurer(createInsurerDto, userId)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("getAllInsurers", () => {
    afterEach(() => {
      jest.restoreAllMocks(); // Reset all mocks after each test
    });

    it("should throw InternalServerErrorException on failure", async () => {
      jest
        .spyOn(repository, "fetchAllInsurersWithAddress")
        .mockRejectedValue(new Error("Database error"));

      await expect(
        service.getAllInsurers(
          1,
          10,
          "createdAt",
          "ASC",
          "Test",
          "insurerName",
          1
        )
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("getInsurerById", () => {
    it("should return an insurer by ID", async () => {
      const mockInsurer = { id: 1, insurerName: "Test Insurer" };

      jest
        .spyOn(repository, "fetchInsurerByIdWithDetails")
        .mockResolvedValue(mockInsurer);

      const result = await service.getInsurerById(1);

      expect(repository.fetchInsurerByIdWithDetails).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockInsurer);
    });

    it("should throw NotFoundException if insurer is not found", async () => {
      jest
        .spyOn(repository, "fetchInsurerByIdWithDetails")
        .mockResolvedValue(null);

      await expect(service.getInsurerById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw InternalServerErrorException if fetchInsurerByIdWithDetails fails", async () => {
      jest
        .spyOn(repository, "fetchInsurerByIdWithDetails")
        .mockRejectedValue(new Error("Database error"));

      await expect(service.getInsurerById(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("modifyInsurer", () => {
    it("should modify an insurer", async () => {
      const updateInsurerDto: UpdateInsurerDto = {
        insurerName: "Updated Insurer",
        address: [
          {
            id: 1,
            addressTypeLid: 1,
            address1: "456 Updated St",
            countryId: 1,
            stateId: 1,
            cityId: 1,
            phoneNumber: "9876543210",
            pinCode: "54321",
          },
        ],
      };

      const mockInsurer = {
        id: 1,
        insurerName: "Updated Insurer",
        address: [
          {
            id: 1,
            addressTypeLid: 1,
            address1: "456 Updated St",
            countryId: 1,
            stateId: 1,
            cityId: 1,
            phoneNumber: "9876543210",
            pinCode: "54321",
          },
        ], // Add the expected address array here
      };
      const mockAddress = { id: 1, ...updateInsurerDto.address[0] };

      jest.spyOn(repository, "fetchInsurerById").mockResolvedValue(mockInsurer);
      jest.spyOn(repository, "modifyInsurer").mockResolvedValue(mockInsurer);
      jest
        .spyOn(addressService, "updateAddressById")
        .mockResolvedValue(mockAddress);

      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };
      jest
        .spyOn(service["dataSource"], "createQueryRunner")
        .mockReturnValue(queryRunner as never);

      const result = await service.modifyInsurer(1, updateInsurerDto, 1);

      expect(repository.fetchInsurerById).toHaveBeenCalledWith(1);
      expect(repository.modifyInsurer).toHaveBeenCalledWith(queryRunner, 1, {
        insurerName: "Updated Insurer",
        updatedBy: 1,
        updatedAt: expect.any(Date),
      });
      expect(addressService.updateAddressById).toHaveBeenCalledWith(
        1,
        updateInsurerDto.address[0],
        1
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(mockInsurer); // Ensure the result matches the updated mockInsurer
    });

    it("should throw NotFoundException if insurer is not found", async () => {
      const updateInsurerDto: UpdateInsurerDto = {
        insurerName: "Updated Insurer",
        address: [],
      };
      const insurerId = 1;
      const userId = 1;

      jest.spyOn(repository, "fetchInsurerById").mockResolvedValue(null);

      await expect(
        service.modifyInsurer(insurerId, updateInsurerDto, userId)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw InternalServerErrorException if updating insurer fails", async () => {
      const updateInsurerDto: UpdateInsurerDto = {
        insurerName: "Updated Insurer",
        address: [],
      };
      const insurerId = 1;
      const userId = 1;

      jest.spyOn(repository, "fetchInsurerById").mockResolvedValue({});
      jest
        .spyOn(repository, "modifyInsurer")
        .mockRejectedValue(new Error("Database error"));

      await expect(
        service.modifyInsurer(insurerId, updateInsurerDto, userId)
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("should throw InternalServerErrorException if address update fails", async () => {
      const updateInsurerDto: UpdateInsurerDto = {
        insurerName: "Updated Insurer",
        address: [
          {
            id: 1,
            addressTypeLid: 1,
            address1: "456 Updated St",
            countryId: 1,
            stateId: 1,
            cityId: 1,
            phoneNumber: "9876543210",
            pinCode: "54321",
          },
        ],
      };
      const insurerId = 1;
      const userId = 1;

      jest.spyOn(repository, "fetchInsurerById").mockResolvedValue({});
      jest.spyOn(repository, "modifyInsurer").mockResolvedValue({});
      jest
        .spyOn(addressService, "updateAddressById")
        .mockRejectedValue(new Error("Address error"));

      await expect(
        service.modifyInsurer(insurerId, updateInsurerDto, userId)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("deleteInsurer", () => {
    it("should delete an insurer", async () => {
      const mockInsurer = { id: 1, insurerName: "Test Insurer" };

      jest.spyOn(repository, "fetchInsurerById").mockResolvedValue(mockInsurer);
      jest.spyOn(repository, "softDeleteInsurer").mockResolvedValue(undefined);

      const result = await service.deleteInsurer(1);

      expect(repository.fetchInsurerById).toHaveBeenCalledWith(1);
      expect(repository.softDeleteInsurer).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: "Insurer deleted successfully" });
    });

    it("should throw NotFoundException if insurer is not found", async () => {
      jest.spyOn(repository, "fetchInsurerById").mockResolvedValue(null);

      await expect(service.deleteInsurer(1)).rejects.toThrow(NotFoundException);
    });

    it("should throw InternalServerErrorException if softDeleteInsurer fails", async () => {
      const mockInsurer = { id: 1, insurerName: "Test Insurer" };

      jest.spyOn(repository, "fetchInsurerById").mockResolvedValue(mockInsurer);
      jest
        .spyOn(repository, "softDeleteInsurer")
        .mockRejectedValue(new Error("Database error"));

      await expect(service.deleteInsurer(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("Validation for Required Fields", () => {
    it("should throw an error if insurerName is missing in CreateInsurerDto", async () => {
      const createInsurerDto: Partial<CreateInsurerDto> = {
        displayName: "Test Display",
        statusLid: 1,
        companyTypeLid: 0,
        isLifeLid: 0,
        companyTagLid: 0,
        address: [],
      };

      await expect(
        service.addInsurer(createInsurerDto as CreateInsurerDto, 1)
      ).rejects.toThrow(Error);
    });

    it("should throw an error if insurerName is missing in UpdateInsurerDto", async () => {
      const updateInsurerDto: Partial<UpdateInsurerDto> = {
        address: [],
      };

      await expect(
        service.modifyInsurer(1, updateInsurerDto as UpdateInsurerDto, 1)
      ).rejects.toThrow(Error);
    });
  });

  describe("getInsurerDetails", () => {
    it("should return insurer details", async () => {
      const mockDetails = {
        id: 1,
        insurerName: "Test Insurer",
        displayName: "Test Display",
        insurerAddresses: [],
      };

      jest
        .spyOn(repository, "fetchInsurerDetails")
        .mockResolvedValue(mockDetails);

      const result = await service.getInsurerDetails(1, 1);

      expect(repository.fetchInsurerDetails).toHaveBeenCalledWith(
        ["id", "insurerName", "displayName"],
        ["insurerAddresses.address"],
        { id: 1, createdBy: 1 }
      );
      expect(result).toEqual({
        id: 1,
        insurerName: "Test Insurer",
        displayName: "Test Display",
        insurerAddresses: [],
      });
    });

    it("should throw NotFoundException if insurer is not found", async () => {
      jest.spyOn(repository, "fetchInsurerDetails").mockResolvedValue(null);

      await expect(service.getInsurerDetails(1, 1)).rejects.toThrow(
        InternalServerErrorException
      );
    });

    it("should throw InternalServerErrorException on failure", async () => {
      jest
        .spyOn(repository, "fetchInsurerDetails")
        .mockRejectedValue(new Error("Database error"));

      await expect(service.getInsurerDetails(1, 1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("getInsurerList", () => {
    it("should return a paginated list of insurers", async () => {
      const mockResponse = { data: [], total: 0 };

      jest
        .spyOn(repository, "fetchInsurerList")
        .mockResolvedValue(mockResponse);

      const result = await service.getInsurerList(
        1,
        10,
        "Test",
        "insurerName",
        "ASC",
        1
      );

      expect(repository.fetchInsurerList).toHaveBeenCalledWith(
        1,
        10,
        "Test",
        "insurerName",
        "ASC",
        1
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw InternalServerErrorException on failure", async () => {
      jest
        .spyOn(repository, "fetchInsurerList")
        .mockRejectedValue(new Error("Database error"));

      await expect(
        service.getInsurerList(1, 10, "Test", "insurerName", "ASC", 1)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});

  describe("getCompanyInsurers", () => {
    it("should return insurers from repository", async () => {
      (repository.findCompanyInsurers as jest.Mock).mockResolvedValue({
        data: [{ insurerId: 1, insurerName: "ABC" }],
        count: 1,
      });

      const result = await service.getCompanyInsurers(
        5,
        DEFAULT_PAGE,
        DEFAULT_LIMIT,
        "test"
      );

      expect(repository.findCompanyInsurers).toHaveBeenCalledWith(
        5,
        DEFAULT_PAGE,
        DEFAULT_LIMIT,
        "test"
      );
      expect(result).toEqual({
        data: [{ insurerId: 1, insurerName: "ABC" }],
        count: 1,
      });
    });

    it("should throw internal server error on failure", async () => {
      (repository.findCompanyInsurers as jest.Mock).mockRejectedValue(
        new Error("failure")
      );

      await expect(
        service.getCompanyInsurers(5, DEFAULT_PAGE, DEFAULT_LIMIT)
      ).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });
