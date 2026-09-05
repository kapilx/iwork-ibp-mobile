import {
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { DEFAULT_TPA_STATUS_ACTIVE_KEY_ID } from "../../../../../../libs/service-lib/src/lib/constants";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { TpaAddress } from "../../../../service-lib/src/lib/entities/tpa-address.entity";
import { TpaContact } from "../../../../service-lib/src/lib/entities/tpa-contact.entity";
import { Tpa } from "../../../../service-lib/src/lib/entities/tpa.entity";
import { CreateTpaDto } from "./dto/create-tpa.dto";
import { UpdateTpaDto } from "./dto/update-tpa.dto";
import { TpaRepository } from "./tpa.repository";

describe("TpaRepository", () => {
  let repository: TpaRepository;
  let tpaRepository: jest.Mocked<Repository<Tpa>>;
  let tpaAddressRepository: jest.Mocked<Repository<TpaAddress>>;
  let tpaContactRepository: jest.Mocked<Repository<TpaContact>>;
  let lookUpRepository: jest.Mocked<Repository<LookUp>>;
  let entityService: jest.Mocked<EntityService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TpaRepository,
        {
          provide: getRepositoryToken(Tpa),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            findAndCount: jest.fn(),
            manager: {
              connection: {
                createQueryRunner: jest.fn().mockReturnValue({
                  connect: jest.fn(),
                  startTransaction: jest.fn(),
                  commitTransaction: jest.fn(),
                  rollbackTransaction: jest.fn(),
                  release: jest.fn(),
                  manager: {
                    save: jest.fn(),
                    update: jest.fn(),
                    softDelete: jest.fn(),
                  },
                }),
              },
            },
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
            }),
          },
        },
        {
          provide: getRepositoryToken(TpaAddress),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TpaContact),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            softDelete: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LookUp),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: EntityService,
          useValue: {
            getData: jest.fn(),
            getListOfValues: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<TpaRepository>(TpaRepository);
    tpaRepository = module.get(getRepositoryToken(Tpa));
    tpaAddressRepository = module.get(getRepositoryToken(TpaAddress));
    tpaContactRepository = module.get(getRepositoryToken(TpaContact));
    lookUpRepository = module.get(getRepositoryToken(LookUp));
    entityService = module.get(EntityService);
  });

  describe("addTpa", () => {
    it("should create a new TPA and return the saved TPA ID", async () => {
      const createTpaDto: CreateTpaDto = {
        tpaName: "Test TPA",
        address: [
          {
            address1: "123 Main St",
            countryId: 1,
            stateId: 1,
            cityId: 1,
          },
        ],
      };
      const userId = 1;

      const mockSavedTpa: Tpa = { id: 1 } as Tpa;
      const mockLookUp = { id: 80, lookUpKey: "TPA_STATUS_ACTIVE" };
      const mockSavedAddress = { id: 10, address1: "123 Main St" };
      const mockSavedTpaAddress = { id: 1, addressId: 10 };

      // Mocks
      jest.spyOn(repository, "findTpaByName").mockResolvedValue(null);
      lookUpRepository.findOne = jest.fn().mockResolvedValue(mockLookUp);
      tpaRepository.create = jest.fn().mockReturnValue(mockSavedTpa);
      tpaRepository.save = jest.fn().mockResolvedValue(mockSavedTpa);
      tpaAddressRepository.create = jest
        .fn()
        .mockReturnValue(mockSavedTpaAddress);

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest
            .fn()
            .mockImplementation((entityClassOrInstance, entity?) => {
              // Simulate Address save
              if (entity?.address1) {
                return Promise.resolve(mockSavedAddress);
              }

              // Simulate TpaAddress save
              if (entity?.addressId) {
                return Promise.resolve(mockSavedTpaAddress);
              }

              // Default return
              return Promise.resolve(entity);
            }),
        },
      };

      jest
        .spyOn(tpaRepository.manager.connection, "createQueryRunner")
        .mockReturnValue(mockQueryRunner as any);

      // Mock getTpaById to return final TPA data
      const finalTpaData = { id: 1, tpaName: "Test TPA" };
      jest
        .spyOn(repository, "getTpaById")
        .mockResolvedValue(finalTpaData as any);

      const result = await repository.addTpa(createTpaDto, userId);

      expect(result).toEqual(finalTpaData);
      expect(repository.findTpaByName).toHaveBeenCalledWith("Test TPA");
      expect(lookUpRepository.findOne).toHaveBeenCalledWith({
        where: { lookUpKey: "TPA_STATUS_ACTIVE" },
      });
      expect(tpaRepository.create).toHaveBeenCalled();
      expect(tpaRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
        })
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          address1: "123 Main St",
          countryId: { id: 1 },
          stateId: { id: 1 },
          cityId: { id: 1 },
        })
      );
      expect(tpaAddressRepository.create).toHaveBeenCalledWith({
        id: 1,
        addressId: 10,
      });
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe("getTpaById", () => {
    it("should retrieve a TPA by ID", async () => {
      const id = 1;
      const mockTpa = {
        id,
        tpaName: "Test TPA",
        tpaAddresses: [],
        status: {},
        companyType: {}, // Add this to match the implementation
      };

      tpaRepository.findOne.mockResolvedValue(mockTpa);

      const result = await repository.getTpaById(id);

      expect(result).toEqual(mockTpa);
      expect(tpaRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: [
          "tpaAddresses.address.addressType", // Match the actual implementation
          "status",
          "companyType", // Include this relation
        ],
      });
    });

    it("should throw NotFoundException if TPA is not found", async () => {
      const id = 1;

      tpaRepository.findOne.mockResolvedValue(null);

      await expect(repository.getTpaById(id)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("updateTpaById", () => {
    it("should update a TPA by ID and return the updated TPA ID", async () => {
      const id = 1;
      const updateTpaDto: UpdateTpaDto = {
        tpaName: "Updated TPA",
        address: [
          {
            id: 1,
            address1: "123 Main St",
            countryId: 1,
            stateId: 1,
            cityId: 1,
          },
        ],
      };
      const userId = 1;

      const mockTpa: Tpa = { id: 1 } as Tpa;

      // Mock the Tpa repository to return the existing TPA
      tpaRepository.findOne.mockResolvedValue(mockTpa);

      // Mock the Tpa repository to update the TPA
      tpaRepository.update.mockResolvedValue({ affected: 1 });

      const result = await repository.updateTpaById(id, updateTpaDto, userId);

      expect(result).toEqual({ id: 1 });
      expect(tpaRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ["tpaAddresses", "tpaAddresses.address"],
      });
      expect(tpaRepository.update).toHaveBeenCalledWith(id, {
        tpaName: "Updated TPA",
        updatedBy: userId,
      });
    });
  });

  describe("deleteTpaById", () => {
    it("should delete a TPA by ID and return true", async () => {
      const id = 1;

      tpaRepository.findOne.mockResolvedValue({ id, addresses: [] });
      tpaRepository.manager.connection
        .createQueryRunner()
        .manager.softDelete.mockResolvedValue({
          affected: 1,
        });

      const result = await repository.deleteTpaById(id);

      expect(result).toBe(true);
      expect(
        tpaRepository.manager.connection.createQueryRunner().manager.softDelete
      ).toHaveBeenCalled();
    });

    it("should throw NotFoundException if TPA is not found", async () => {
      const id = 1;

      tpaRepository.findOne.mockResolvedValue(null);

      await expect(repository.deleteTpaById(id)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("deleteTpaAddressById", () => {
    it("should delete a TPA address by ID and return true", async () => {
      const tpaAddressId = 1;

      const mockTpaAddress = { tpaAddressId };
      tpaAddressRepository.findOne.mockResolvedValue(mockTpaAddress);
      tpaAddressRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await repository.deleteTpaAddressById(tpaAddressId);

      expect(result).toBe(true);
      expect(tpaAddressRepository.findOne).toHaveBeenCalledWith({
        where: { tpaAddressId },
      });
      expect(tpaAddressRepository.softDelete).toHaveBeenCalledWith(
        tpaAddressId
      );
    });

    it("should throw NotFoundException if TPA address is not found", async () => {
      const tpaAddressId = 1;

      tpaAddressRepository.findOne.mockResolvedValue(null);

      await expect(
        repository.deleteTpaAddressById(tpaAddressId)
      ).rejects.toThrow(
        new NotFoundException(`TPA Address with ID ${tpaAddressId} not found`)
      );
      expect(tpaAddressRepository.findOne).toHaveBeenCalledWith({
        where: { tpaAddressId },
      });
      expect(tpaAddressRepository.softDelete).not.toHaveBeenCalled();
    });

    it("should return false if softDelete does not affect any rows", async () => {
      const tpaAddressId = 1;

      const mockTpaAddress = { tpaAddressId };
      tpaAddressRepository.findOne.mockResolvedValue(mockTpaAddress);
      tpaAddressRepository.softDelete.mockResolvedValue({ affected: 0 });

      const result = await repository.deleteTpaAddressById(tpaAddressId);

      expect(result).toBe(false);
      expect(tpaAddressRepository.findOne).toHaveBeenCalledWith({
        where: { tpaAddressId },
      });
      expect(tpaAddressRepository.softDelete).toHaveBeenCalledWith(
        tpaAddressId
      );
    });
  });

  describe("delinkTpaContactMapping", () => {
    it("should delete a TPA contact mapping", async () => {
      const tpaContactDto = { tpaId: 1, contactId: 1 };

      // Mock the delete method to resolve successfully
      tpaContactRepository.delete.mockResolvedValue({ affected: 1 });

      // Call the method
      await repository.delinkTpaContactMapping(tpaContactDto);

      // Assertions
      expect(tpaContactRepository.delete).toHaveBeenCalledWith(tpaContactDto);
    });

    it("should throw an error if deletion fails", async () => {
      const tpaContactDto = { tpaId: 1, contactId: 1 };

      // Mock the delete method to reject with an error
      tpaContactRepository.delete.mockRejectedValue(
        new Error("Deletion failed")
      );

      // Call the method and expect an error
      await expect(
        repository.delinkTpaContactMapping(tpaContactDto)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
  describe("addTpaAddress", () => {
    it("should add a TPA address mapping", async () => {
      const tpaAddressDto = { tpaId: 1, addressId: 1 };

      tpaAddressRepository.save.mockResolvedValue(tpaAddressDto);

      await repository.addTpaAddress(tpaAddressDto);

      expect(tpaAddressRepository.save).toHaveBeenCalledWith(tpaAddressDto);
    });

    it("should throw an error if saving fails", async () => {
      const tpaAddressDto = { tpaId: 1, addressId: 1 };

      tpaAddressRepository.save.mockRejectedValue(new Error("Save failed"));

      await expect(repository.addTpaAddress(tpaAddressDto)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("findTpaCompanyAddressMap", () => {
    it("should find a TPA address mapping by TPA ID and address ID", async () => {
      const tpaId = 1;
      const addressId = 1;
      const mockTpaAddress = { tpaId, addressId };

      tpaAddressRepository.findOne.mockResolvedValue(mockTpaAddress);

      const result = await repository.findTpaCompanyAddressMap(
        tpaId,
        addressId
      );

      expect(result).toEqual(mockTpaAddress);
      expect(tpaAddressRepository.findOne).toHaveBeenCalledWith({
        where: {
          tpa: { id: tpaId },
          address: { id: addressId },
        },
      });
    });

    it("should return null if no mapping is found", async () => {
      const tpaId = 1;
      const addressId = 1;

      tpaAddressRepository.findOne.mockResolvedValue(null);

      const result = await repository.findTpaCompanyAddressMap(
        tpaId,
        addressId
      );

      expect(result).toBeNull();
    });
  });
  describe("CompanyList", () => {
    it("should return a paginated list of active TPA companies", async () => {
      const mockTpaList = [{ id: 1, tpaName: "Test TPA" }];
      const mockCount = 1;

      tpaRepository.findAndCount.mockResolvedValue([mockTpaList, mockCount]);

      const result = await repository.CompanyList(
        1,
        10,
        "",
        "tpaName",
        "ASC",
        1
      );

      expect(result).toEqual({ data: mockTpaList, count: mockCount });
      expect(tpaRepository.findAndCount).toHaveBeenCalledWith({
        where: { createdBy: 1, statusLid: DEFAULT_TPA_STATUS_ACTIVE_KEY_ID },
        order: { tpaName: "ASC" },
        skip: 0,
        take: 10,
        select: ["id", "tpaName", "displayName"],
      });
    });

    it("should throw an error if fetching fails", async () => {
      tpaRepository.findAndCount.mockRejectedValue(new Error("Fetch failed"));

      await expect(
        repository.CompanyList(1, 10, "", "tpaName", "ASC", 1)
      ).rejects.toThrow("Failed to fetch tpa company name list");
    });
  });

  describe("getCompanyListData", () => {
    it("should return basic TPA company data", async () => {
      const mockData = {
        id: 1,
        tpaName: "Test TPA",
        displayName: "Test TPA Display",
        tpaAddresses: [
          {
            address: {
              id: 1,
              address1: "123 Main St",
              cityId: { id: 1, name: "City" },
            },
          },
        ],
      };

      entityService.getListOfValues.mockResolvedValue(mockData);

      const result = await repository.getCompanyListData(
        ["id", "tpaName"],
        ["tpaAddresses"],
        { id: 1 }
      );

      expect(result).toEqual({
        id: 1,
        tpaName: "Test TPA",
        displayName: "Test TPA Display",
        tpaAddresses: [
          {
            id: 1,
            address1: "123 Main St",
            city: { id: 1, name: "City" },
          },
        ],
      });
    });

    it("should return an error if fetching fails", async () => {
      entityService.getListOfValues.mockRejectedValue(
        new Error("Fetch failed")
      );

      const result = await repository.getCompanyListData(
        ["id", "tpaName"],
        ["tpaAddresses"],
        { id: 1 }
      );

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe("transformResponse", () => {
    it("should transform the response object for TPA details", async () => {
      const mockData = {
        id: 1,
        tpaName: "Test TPA",
        displayName: "Test TPA Display",
        tpaAddresses: [
          {
            address: {
              id: 1,
              address1: "123 Main St",
              cityId: { id: 1, name: "City" },
            },
          },
        ],
      };

      const result = await repository.transformResponse(mockData);

      expect(result).toEqual({
        id: 1,
        tpaName: "Test TPA",
        displayName: "Test TPA Display",
        tpaAddresses: [
          {
            id: 1,
            address1: "123 Main St",
            city: { id: 1, name: "City" },
          },
        ],
      });
    });
  });
  describe("getTpaCountsByStatus", () => {
    it("should return counts of TPAs grouped by status", async () => {
      const mockResult = [
        { statusKey: "ACTIVE", count: "5" },
        { statusKey: "INACTIVE", count: "3" },
      ];

      tpaRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockResult),
      } as never);

      const result = await repository.getTpaCountsByStatus();

      expect(result).toEqual({ ACTIVE: 5, INACTIVE: 3 });
      expect(tpaRepository.createQueryBuilder).toHaveBeenCalledWith("tpa");
    });

    it("should return an empty object if no data is found", async () => {
      tpaRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      } as never);

      const result = await repository.getTpaCountsByStatus();

      expect(result).toEqual({});
    });
  });

  describe("findTpaByName", () => {
    it("should find a TPA by name", async () => {
      const tpaName = "Test TPA";
      const mockTpa = { id: 1, tpaName };

      tpaRepository.findOne.mockResolvedValue(mockTpa);

      const result = await repository.findTpaByName(tpaName);

      expect(result).toEqual(mockTpa);
      expect(tpaRepository.findOne).toHaveBeenCalledWith({
        where: { tpaName: ILike(tpaName) },
      });
    });

    it("should return null if no TPA is found", async () => {
      const tpaName = "Nonexistent TPA";

      tpaRepository.findOne.mockResolvedValue(null);

      const result = await repository.findTpaByName(tpaName);

      expect(result).toBeNull();
    });
  });
});
