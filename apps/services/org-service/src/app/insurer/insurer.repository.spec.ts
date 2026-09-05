import {
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ILike, QueryRunner, Repository } from "typeorm";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { InsurerAddress } from "../../../../service-lib/src/lib/entities/insurer-address.entity";
import { InsureContact } from "../../../../service-lib/src/lib/entities/insurer-contact.entity";
import { Insurer } from "../../../../service-lib/src/lib/entities/insurer.entity";
import { InsurerRepository } from "./insurer.repository";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import {
  SALES_OPPORTUNITY,
  RENEWAL_OPPORTUNITY,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { find } from "rxjs";

describe("InsurerRepository", () => {
  let repository: InsurerRepository;
  let insurerRepoMock: jest.Mocked<Repository<Insurer>>;
  let insurerAddressRepoMock: jest.Mocked<Repository<InsurerAddress>>;
  let insurerContactRepoMock: jest.Mocked<Repository<InsureContact>>;
  let entityServiceMock: jest.Mocked<EntityService>;

  beforeEach(async () => {
    insurerRepoMock = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<Insurer>>;

    insurerAddressRepoMock = {
      save: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<InsurerAddress>>;

    insurerContactRepoMock = {
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<InsureContact>>;

    entityServiceMock = {
      getData: jest.fn(),
      fetchEntityList: jest.fn(),
      getListOfValues: jest.fn(),
    } as unknown as jest.Mocked<EntityService>;

    policyQueryBuilderMock = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };

    policyRepoMock = {
      createQueryBuilder: jest.fn().mockReturnValue(policyQueryBuilderMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsurerRepository,
        {
          provide: getRepositoryToken(Insurer),
          useValue: insurerRepoMock,
        },
        {
          provide: getRepositoryToken(InsurerAddress),
          useValue: insurerAddressRepoMock,
        },
        {
          provide: getRepositoryToken(InsureContact),
          useValue: insurerContactRepoMock,
        },
        {
          provide: EntityService,
          useValue: entityServiceMock,
        },
        {
          provide: getRepositoryToken(Policy),
          useValue: policyRepoMock,
        },
      ],
    }).compile();

    repository = module.get<InsurerRepository>(InsurerRepository);
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("addInsurer", () => {
    it("should add a new insurer", async () => {
      const queryRunnerMock = {
        manager: {
          create: jest
            .fn()
            .mockReturnValue({ id: 1, insurerName: "Test Insurer" }),
          save: jest
            .fn()
            .mockResolvedValue({ id: 1, insurerName: "Test Insurer" }),
        },
      } as unknown as QueryRunner;

      const createInsurerDto = { insurerName: "Test Insurer" };

      const result = await repository.addInsurer(
        queryRunnerMock,
        createInsurerDto
      );

      expect(queryRunnerMock.manager.create).toHaveBeenCalledWith(
        Insurer,
        createInsurerDto
      );
      expect(queryRunnerMock.manager.save).toHaveBeenCalledWith({
        id: 1,
        insurerName: "Test Insurer",
      });
      expect(result).toEqual({ id: 1, insurerName: "Test Insurer" });
    });

    it("should throw InternalServerErrorException on failure", async () => {
      const queryRunnerMock = {
        manager: {
          create: jest.fn(),
          save: jest.fn().mockRejectedValue(new Error("Database error")),
        },
      } as unknown as QueryRunner;

      const createInsurerDto = { insurerName: "Test Insurer" };

      await expect(
        repository.addInsurer(queryRunnerMock, createInsurerDto)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("fetchInsurerById", () => {
    it("should return an insurer by ID", async () => {
      const mockInsurer = { id: 1, insurerName: "Test Insurer" };
      insurerRepoMock.findOne.mockResolvedValue(mockInsurer);

      const result = await repository.fetchInsurerById(1);

      expect(insurerRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["insurerAddresses.address", "status"], // Include relations
      });
      expect(result).toEqual(mockInsurer);
    });

    it("should throw NotFoundException if insurer is not found", async () => {
      insurerRepoMock.findOne.mockResolvedValue(null);

      await expect(repository.fetchInsurerById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw InternalServerErrorException on failure", async () => {
      insurerRepoMock.findOne.mockRejectedValue(new Error("Database error"));

      await expect(repository.fetchInsurerById(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("fetchAllInsurersWithAddress", () => {
    it("should return a list of insurers with addresses", async () => {
      const mockInsurers = [
        {
          id: 1,
          insurerName: "Test Insurer",
          displayName: "Test Display",
          insurerAddresses: [
            {
              id: 1,
              address: {
                address1: "123 Main St",
                cityId: { id: 1, name: "Test City" },
                stateId: { id: 1, name: "Test State" },
                countryId: { id: 1, name: "Test Country" },
                phoneNumber: "1234567890",
              },
            },
          ],
          status: { id: 1, lookUpValue: "Active" },
        },
      ];

      const mockResult = { data: mockInsurers, count: 1 };

      // Mock entityServiceMock.fetchEntityList
      jest
        .spyOn(entityServiceMock, "fetchEntityList")
        .mockResolvedValue(mockResult);

      const result = await repository.fetchAllInsurersWithAddress(
        1,
        10,
        [],
        [],
        undefined,
        1
      );

      expect(result).toEqual({
        data: [
          {
            id: 1,
            insurerName: "Test Insurer",
            displayName: "Test Display",
            status: { id: 1, lookUpValue: "Active" },
            companyTag: null,
            companyType: null,
            insurerAddresses: [
              {
                id: 1,
                address1: "123 Main St",
                city: { id: 1, name: "Test City" },
                state: { id: 1, name: "Test State" },
                country: { id: 1, name: "Test Country" },
                phoneNumber: "1234567890",
              },
            ],
          },
        ],
        count: 1,
      });

      expect(entityServiceMock.fetchEntityList).toHaveBeenCalledWith(
        "insurer",
        1,
        10,
        [{ field: "id", order: "ASC" }],
        [
          "insurerAddresses",
          "insurerAddresses.address",
          "insurerAddresses.address.cityId",
          "insurerAddresses.address.stateId",
          "insurerContacts",
          "insurerContacts.contact",
          "insurerContacts.contact.contactAddresses",
          "insurerContacts.contact.contactAddresses.address",
          "status",
          "companyTag",
          "companyType",
        ],
        { createdBy: 1 },
        undefined,
        [],
        undefined,
        undefined,
        expect.any(Object)
      );
    });
  });

  describe("addInsurerAddress", () => {
    it("should save an insurer address", async () => {
      const queryRunnerMock = {
        manager: {
          save: jest.fn().mockResolvedValue(undefined),
        },
      } as unknown as QueryRunner;

      const insurerAddress = { id: 1, insurerId: 1, addressId: 1 };

      await repository.addInsurerAddress(queryRunnerMock, insurerAddress);

      expect(queryRunnerMock.manager.save).toHaveBeenCalledWith(insurerAddress);
    });

    it("should throw InternalServerErrorException on failure", async () => {
      const queryRunnerMock = {
        manager: {
          save: jest.fn().mockRejectedValue(new Error("Database error")),
        },
      } as unknown as QueryRunner;

      const insurerAddress = { id: 1, insurerId: 1, addressId: 1 };

      await expect(
        repository.addInsurerAddress(queryRunnerMock, insurerAddress)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("softDeleteInsurer", () => {
    it("should soft delete an insurer", async () => {
      insurerRepoMock.update.mockResolvedValue(undefined);

      await repository.softDeleteInsurer(1);

      expect(insurerRepoMock.update).toHaveBeenCalledWith(1, {
        deletedAt: expect.any(Date),
      });
    });

    it("should throw InternalServerErrorException on failure", async () => {
      insurerRepoMock.update.mockRejectedValue(new Error("Database error"));

      await expect(repository.softDeleteInsurer(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("fetchInsurerList", () => {
    it("should return a paginated list of insurers", async () => {
      const mockInsurers = [
        { id: 1, insurerName: "Test Insurer 1", displayName: "Display 1" },
        { id: 2, insurerName: "Test Insurer 2", displayName: "Display 2" },
      ];
      const mockCount = 2;

      insurerRepoMock.findAndCount.mockResolvedValue([mockInsurers, mockCount]);

      const result = await repository.fetchInsurerList(
        1, // page
        10, // limit
        "Test", // search
        "insurerName", // sortBy
        "ASC", // sortOrder
        1 // userId
      );

      expect(insurerRepoMock.findAndCount).toHaveBeenCalledWith({
        where: {
          createdBy: 1,
          insurerName: expect.any(Object), // Match the FindOperator instance
          statusLid: 85, // Replace with the actual value of DEFAULT_INSURER_STATUS_ACTIVE_KEY_ID
        },
        order: { insurerName: "ASC" },
        skip: 0,
        take: 10,
        select: ["id", "insurerName", "displayName"],
      });

      expect(result).toEqual({ data: mockInsurers, total: mockCount });
    });
  });

  describe("fetchInsurerDetails", () => {
    it("should return insurer details", async () => {
      const mockInsurer = {
        id: 1,
        insurerName: "Test Insurer",
        displayName: "Test Display",
        status: { id: 1, lookUpValue: "Active" },
      };

      // Mock entityServiceMock.getListOfValues to return a flat array
      jest
        .spyOn(entityServiceMock, "getListOfValues")
        .mockResolvedValue([mockInsurer]);

      const result = await repository.fetchInsurerDetails(
        ["id", "insurerName", "displayName"],
        ["status"],
        { id: 1 }
      );

      expect(result).toEqual([mockInsurer]); // Expect a flat array

      expect(entityServiceMock.getListOfValues).toHaveBeenCalledWith(
        "Insurer",
        ["id", "insurerName", "displayName"],
        { id: 1 },
        ["status"]
      );
    });

    it("should throw NotFoundException if no insurer is found", async () => {
      // Mock entityServiceMock.getListOfValues to return an empty array
      jest.spyOn(entityServiceMock, "getListOfValues").mockResolvedValue([]);

      await expect(
        repository.fetchInsurerDetails(
          ["id", "insurerName", "displayName"],
          ["status"],
          { id: 1 }
        )
      ).rejects.toThrow(NotFoundException);

      expect(entityServiceMock.getListOfValues).toHaveBeenCalledWith(
        "Insurer",
        ["id", "insurerName", "displayName"],
        { id: 1 },
        ["status"]
      );
    });
  });

  describe("getTotalActiveInsurers", () => {
    it("should return the total number of active insurers", async () => {
      insurerRepoMock.count.mockResolvedValue(5);

      const result = await repository.getTotalActiveInsurers(1);

      expect(insurerRepoMock.count).toHaveBeenCalledWith({
        where: { statusLid: 1 },
      });
      expect(result).toBe(5);
    });

    it("should throw InternalServerErrorException on failure", async () => {
      insurerRepoMock.count.mockRejectedValue(new Error("Database error"));

      await expect(repository.getTotalActiveInsurers(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  it("should return insurer details with relations", async () => {
    const mockInsurer = {
      id: 1,
      insurerName: "Test Insurer",
      displayName: "Test Display",
      insurerAddresses: [],
      companyTag: { id: undefined, lookUpValue: undefined },
      companyTagLid: undefined,
      companyType: { id: undefined, lookUpValue: undefined },
      companyTypeLid: undefined,
      insureCode: undefined,
      insurerContacts: undefined,
      isLife: { id: undefined, lookUpValue: undefined },
      policy: [],
      remarks: undefined,
      status: { id: undefined, lookUpValue: undefined },
      website: undefined,
    };

    insurerRepoMock.findOne.mockResolvedValue(mockInsurer);

    const result = await repository.fetchInsurerByIdWithDetails(1);

    expect(insurerRepoMock.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: [
        "insurerAddresses",
        "insurerAddresses.address.addressType",
        "insurerContacts",
        "insurerContacts.contact",
        "insurerContacts.contact.contactAddresses",
        "insurerContacts.contact.contactAddresses.address.addressType",
        "companyTag",
        "companyType",
        "status",
        "isLife",
      ],
    });
    expect(result).toEqual(mockInsurer);
  });

  it("should throw NotFoundException if insurer is not found", async () => {
    insurerRepoMock.findOne.mockResolvedValue(null);

    await expect(repository.fetchInsurerByIdWithDetails(1)).rejects.toThrow(
      NotFoundException
    );
  });

  describe("findInsurerByName", () => {
    it("should return a list of insurers matching the name", async () => {
      const mockInsurers = [{ id: 1, insurerName: "Test Insurer" }];

      insurerRepoMock.find.mockResolvedValue(mockInsurers);

      const result = await repository.findInsurerByName("Test");

      expect(insurerRepoMock.find).toHaveBeenCalledWith({
        where: { insurerName: ILike("%Test%") },
      });
      expect(result).toEqual(mockInsurers);
    });

    it("should return an empty array if no insurers match the name", async () => {
      insurerRepoMock.find.mockResolvedValue([]);

      const result = await repository.findInsurerByName("Nonexistent");

      expect(result).toEqual([]);
    });

    it("should throw InternalServerErrorException on failure", async () => {
      insurerRepoMock.find.mockRejectedValue(new Error("Database error"));

      await expect(repository.findInsurerByName("Test")).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("delinkInsurerContactMapping", () => {
    it("should remove an insurer contact mapping", async () => {
      const docObject = { insurerId: 1, contactId: 1 };

      insurerContactRepoMock.delete.mockResolvedValue(undefined);

      await repository.delinkInsurerContactMapping(docObject);

      expect(insurerContactRepoMock.delete).toHaveBeenCalledWith(docObject);
    });

    it("should throw InternalServerErrorException on failure", async () => {
      const docObject = { insurerId: 1, contactId: 1 };

      insurerContactRepoMock.delete.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        repository.delinkInsurerContactMapping(docObject)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("addInsurerContact", () => {
    it("should save an insurer-company contact mapping", async () => {
      const insurerContact = { insurerId: 1, contactId: 1 };

      insurerContactRepoMock.save.mockResolvedValue(undefined);

      await repository.addInsurerContact(insurerContact);

      expect(insurerContactRepoMock.save).toHaveBeenCalledWith(insurerContact);
    });

    it("should throw InternalServerErrorException on failure", async () => {
      const insurerContact = { insurerId: 1, contactId: 1 };

      insurerContactRepoMock.save.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        repository.addInsurerContact(insurerContact)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("findInsurerCompanyAddressMap", () => {
    it("should return the insurer company and address mapping if found", async () => {
      const mockMapping = { insurer: { id: 1 }, address: { id: 1 } };

      insurerAddressRepoMock.findOne.mockResolvedValue(mockMapping);

      const result = await repository.findInsurerCompanyAddressMap(1, 1);

      expect(insurerAddressRepoMock.findOne).toHaveBeenCalledWith({
        where: { insurer: { id: 1 }, address: { id: 1 } },
      });
      expect(result).toEqual(mockMapping);
    });

    it("should return null if no mapping is found", async () => {
      insurerAddressRepoMock.findOne.mockResolvedValue(null);

      const result = await repository.findInsurerCompanyAddressMap(1, 1);

      expect(result).toBeNull();
    });
  });
});

  describe("findCompanyInsurers", () => {
    it("should return mapped insurers", async () => {
      policyQueryBuilderMock.getRawMany.mockResolvedValue([
        { insurerId: 1, insurerName: "A" },
        { insurerId: null, insurerName: "B" },
      ]);

      const result = await repository.findCompanyInsurers(3, 1, 10, "a");

      expect(policyRepoMock.createQueryBuilder).toHaveBeenCalledWith("policy");
      expect(policyQueryBuilderMock.innerJoin).toHaveBeenCalledWith(
        "policy.insurerMappings",
        "insurerMapping"
      );
      expect(policyQueryBuilderMock.innerJoin).toHaveBeenCalledWith(
        "insurerMapping.insurer",
        "insurer"
      );
      expect(policyQueryBuilderMock.where).toHaveBeenCalledWith(
        "policy.companyId = :companyId",
        { companyId: 3 }
      );
      expect(policyQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        "policy.opportunityType IN (:...opportunityTypes)",
        { opportunityTypes: [SALES_OPPORTUNITY, RENEWAL_OPPORTUNITY] }
      );
      expect(result).toEqual({
        data: [{ insurerId: 1, insurerName: "A" }],
        count: 1,
      });
    });

    it("should throw internal server error on failure", async () => {
      policyQueryBuilderMock.getRawMany.mockRejectedValue(new Error("err"));

      await expect(repository.findCompanyInsurers(3, 1, 10)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });
