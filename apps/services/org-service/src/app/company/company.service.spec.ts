import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { CreateAddressDto } from "../address/dto/create-address.dto";
import { LookUpRepository } from "../look-up/look-up.repository";
import { CompanyService } from "./comapny.service";
import { CompanyRepository } from "./company.repository";
import { CompanyDetailsDto } from "./dto/company-detail.dto";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { UpdateAddressDto } from "../address/dto/update-address.dto";
import { AddressService } from "../address/address.service";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  OWNER_TYPES,
} from "../../../../../../libs/service-lib/src/lib/constants";
describe("CompanyService", () => {
  let service: CompanyService;
  let lookUpValidationService: LookUpValidationService;
  let companyRepository: jest.Mocked<CompanyRepository>;
  let lookUpRepository: jest.Mocked<LookUpRepository>;
  let dataSource: jest.Mocked<DataSource>;
  let masterValidationService: jest.Mocked<any>;
  let addressService: jest.Mocked<any>;
  let scopeServiceMock: { getNewEmployeeHierarchyByUserId: jest.Mock };

  beforeEach(async () => {
    masterValidationService = {
      validateMasterIds: jest.fn(),
    };

    addressService = {
      addAddress: jest.fn(),
      updateAddressById: jest.fn(),
    };
    scopeServiceMock = {
      getNewEmployeeHierarchyByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: CompanyRepository,
          useValue: {
            findCompanyByName: jest.fn(),
            createCompany: jest.fn(),
            createGstDetail: jest.fn(),
            createCompanyDetails: jest.fn(),
            getCompanyById: jest.fn(),
            deleteByCompanyId: jest.fn(),
            findAllCompanyList: jest.fn(),
            updateCompany: jest.fn(),
            updateCompanyDetails: jest.fn(),
            createGroupCompanyMap: jest.fn(),
            createCompanyDocMap: jest.fn(),
            CompanyList: jest.fn(),
            findCompanyById: jest.fn(),
            getCompanyListData: jest.fn(),
            getCompanyList: jest.fn(),
            getCompanyListById: jest.fn(),
            getCompanyBasicDetails: jest.fn(),
            updateGstDetail: jest.fn(),
            updateOrCreateGroupCompanyMap: jest.fn(),
            createOrUpdateGroupCompanyMap: jest.fn(),
            createOrUpdateCompanyDocMap: jest.fn(),
            updateCompanyDocMap: jest.fn(),
            deleteGroupCompanyMap: jest.fn(),
            getCompanies: jest.fn(), // Add this mock
            findCompanyByNameAndId: jest.fn(),
            findCompanyByNameAndIdForUpdate: jest.fn(),
            findCompaniesByOwnerIds: jest.fn(),
          },
        },
        {
          provide: LookUpRepository,
          useValue: {
            getLookUpById: jest.fn().mockResolvedValue({
              data: {
                lookUpName: "Group Company",
                lookUpValueKey: "GROUP_COMPANY",
              },
            }), // Mock implementation for getLookUpById
          },
        },
        {
          provide: LookUpValidationService,
          useValue: {
            validateDynamicLookupValues: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
        {
          provide: MasterValidationService,
          useValue: {
            validateMasterIds: jest.fn(),
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
          provide: ScopeService,
          useValue: scopeServiceMock,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    lookUpValidationService = module.get(LookUpValidationService);
    companyRepository = module.get(CompanyRepository);
    lookUpRepository = module.get(LookUpRepository);
    dataSource = module.get(DataSource);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(lookUpValidationService).toBeDefined();
    expect(masterValidationService).toBeDefined();
    expect(addressService).toBeDefined();
  });

  describe("createCompany", () => {
    it("should create a company successfully", async () => {
      const createCompanyDto: CreateCompanyDto = {
        companyName: "Test Company",
        displayName: "Test Display Name",
        companyTypeLid: 1,
        industrySegmentLid: 2,
        groupCompanyLid: 3,
        priorityLid: 4,
        annualPremium: 100000,
        gstDetails: [
          {
            stateId: 1,
            gstNumber: "22ABCDE1234F1Z5",
            gstCategoryLid: 101,
          },
        ],
        groupCompanyMap: {
          groupCompanyId: 2,
        },
        companyDocMaps: [
          {
            documentId: 101,
          },
        ],
        addresses: [
          {
            address1: "Test Address",
            addressTypeLid: 1,
            countryId: 1,
            stateId: 1,
            cityId: 1,
            pinCode: "123456",
            phoneNumber: "1234567890",
          },
        ],
      };

      const companyDetailsDto: CompanyDetailsDto = {
        companyHistory: "Test Company History",
        createdBy: 1,
        updatedBy: 1,
      };

      // Mock repository and service methods
      companyRepository.findCompanyByName.mockResolvedValue(null);
      lookUpValidationService.validateDynamicLookupValues.mockResolvedValue(
        true
      );
      masterValidationService.validateMasterIds.mockResolvedValue(true);
      lookUpRepository.findByLookUpKey.mockResolvedValue([{ id: 1 }]);
      companyRepository.createCompany.mockResolvedValue({ id: 1 });
      companyRepository.createCompanyDetails.mockResolvedValue({});
      companyRepository.createGstDetail.mockResolvedValue({});
      addressService.addAddress.mockResolvedValue({ id: 1 });
      companyRepository.createGroupCompanyMap.mockResolvedValue({});
      companyRepository.createCompanyDocMap.mockResolvedValue({});
      dataSource.transaction.mockImplementation(async (callback) =>
        callback({})
      );

      const result = await service.createCompany(
        createCompanyDto,
        companyDetailsDto
      );

      // Assertions
      expect(result).toEqual({ id: 1 });
      expect(companyRepository.findCompanyByName).toHaveBeenCalledWith(
        "Test Company"
      );
      expect(
        lookUpValidationService.validateDynamicLookupValues
      ).toHaveBeenCalledWith(createCompanyDto, expect.any(Object));
      expect(masterValidationService.validateMasterIds).toHaveBeenCalledWith(
        createCompanyDto,
        expect.any(Object)
      );
      expect(companyRepository.createCompany).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          companyName: "Test Company",
          annualPremium: 100000,
        })
      );
      expect(companyRepository.createCompanyDetails).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          companyHistory: "Test Company History",
        })
      );
      expect(companyRepository.createGstDetail).toHaveBeenCalledTimes(1);
      expect(addressService.addAddress).toHaveBeenCalledTimes(1);
      expect(companyRepository.createGroupCompanyMap).toHaveBeenCalledTimes(1);
      expect(companyRepository.createCompanyDocMap).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if transaction fails", async () => {
      const createCompanyDto: CreateCompanyDto = {
        companyName: "Test Company",
        displayName: "",
        companyTypeLid: 0,
        industrySegmentLid: 0,
        groupCompanyLid: 0,
        priorityLid: 0,
      };
      const addressesDto: CreateAddressDto[] = [
        {
          address1: "Test Address",
          addressTypeLid: 0,
          countryId: 0,
          stateId: 0,
          cityId: 0,
          pinCode: "",
          phoneNumber: "",
        },
      ];
      const companyDetailsDto: CompanyDetailsDto = {
        accountStrategy: "Test Detail",
      };

      companyRepository.findCompanyByName.mockResolvedValue(null);
      dataSource.transaction.mockRejectedValue(new Error("Transaction failed"));

      await expect(
        service.createCompany(createCompanyDto, addressesDto, companyDetailsDto)
      ).rejects.toThrow("Transaction failed");
    });
  });

  describe("getCompanyById", () => {
    it("should return a company by ID", async () => {
      companyRepository.getCompanyById.mockResolvedValue({ id: 1 });

      const result = await service.getCompanyById("1");

      expect(result).toEqual({ id: 1 });
      expect(companyRepository.getCompanyById).toHaveBeenCalledWith(1);
    });

    it("should throw InternalServerErrorException if there is an error during company retrieval", async () => {
      companyRepository.getCompanyById.mockRejectedValue(
        new Error("Database error")
      );

      await expect(service.getCompanyById("1")).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("deleteCompanyById", () => {
    it("should delete a company by ID", async () => {
      companyRepository.getCompanyById.mockResolvedValue({ id: 1 });
      companyRepository.deleteByCompanyId.mockResolvedValue({ affected: 1 });

      const result = await service.deleteCompanyById("1");

      expect(result).toBe(true);
      expect(companyRepository.deleteByCompanyId).toHaveBeenCalledWith("1");
    });

    it("should throw an error if the company does not exist", async () => {
      companyRepository.getCompanyById.mockResolvedValue(null);

      await expect(service.deleteCompanyById("1")).rejects.toThrowError(
        "Company with ID 1 does not exist"
      );
    });
  });

  describe("listCompanies", () => {
    it("should return a paginated list of companies with contacts", async () => {
      const page = 1;
      const limit = 10;
      const search = "test";
      const sort = "companyName:ASC";
      const userId = 123;
      const searchBy = "";

      const mockCompanies = {
        data: [
          {
            id: 1,
            companyName: "Test Company",
            companyContactMaps: [
              { contact: { id: 1, name: "John Doe" } },
              { contact: { id: 2, name: "Jane Doe" } },
            ],
          },
          {
            id: 2,
            companyName: "Another Company",
            companyContactMaps: [],
          },
        ],
        total: 2,
      };

      jest
        .spyOn(companyRepository, "findAllCompanyList")
        .mockResolvedValue(mockCompanies);

      const result = await service.listCompanies(
        page,
        limit,
        search,
        sort,
        userId,
        searchBy,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );
      expect(result).toEqual({
        data: [
          {
            id: 1,
            companyName: "Test Company",
            companyContactMaps: [
              { contact: { id: 1, name: "John Doe" } },
              { contact: { id: 2, name: "Jane Doe" } },
            ],
            contacts: [
              { id: 1, name: "John Doe" },
              { id: 2, name: "Jane Doe" },
            ],
          },
          {
            id: 2,
            companyName: "Another Company",
            companyContactMaps: [],
            contacts: [],
          },
        ],
        total: 2,
      });
    });

    it("should throw a NotFoundException if no companies are found", async () => {
      const page = 1;
      const limit = 10;
      const search = "test";
      const sort = "companyName:ASC";
      const userId = 123;
      const searchBy = "";

      jest
        .spyOn(companyRepository, "findAllCompanyList")
        .mockRejectedValue(new NotFoundException());

      await expect(
        service.listCompanies(
          page,
          limit,
          search,
          sort,
          userId,
          searchBy,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined
        )
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw a generic error if an unexpected error occurs", async () => {
      const page = 1;
      const limit = 10;
      const search = "test";
      const sort = "companyName:ASC";
      const userId = 123;
      const searchBy = "";

      jest
        .spyOn(companyRepository, "findAllCompanyList")
        .mockRejectedValue(new Error("Failed to fetch companies"));

      await expect(
        service.listCompanies(
          page,
          limit,
          search,
          sort,
          userId,
          searchBy,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined
        )
      ).rejects.toThrow("Failed to fetch companies");
    });
  });
  describe("getCompanyList", () => {
    it("should return a list of companies", async () => {
      const mockCompanies = {
        data: [{ id: 1, name: "Test Company" }],
        count: 1,
      };

      companyRepository.CompanyList.mockResolvedValue(mockCompanies);

      const result = await service.getCompanyList(1, 10, "", 1, [2]);

      expect(result).toEqual(mockCompanies);
      expect(companyRepository.CompanyList).toHaveBeenCalledWith(1, 10, "", 1, [
        2,
      ]);
    });

    it("should throw NotFoundException if no companies are found", async () => {
      companyRepository.CompanyList.mockRejectedValue(new NotFoundException());

      await expect(service.getCompanyList(1, 10, "", 1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw a generic error if an unexpected error occurs", async () => {
      const errorMessage = "Failed to fetch companies";
      companyRepository.CompanyList.mockRejectedValue(new Error(errorMessage));

      await expect(service.getCompanyList(1, 10, "", 1)).rejects.toThrow(
        errorMessages.companyListFailed
      );
    });
  });
  describe("getCompanyBasicDetails", () => {
    it("should return company basic details when valid id and userId are provided", async () => {
      const mockCompanyDetails = {
        id: 1,
        companyName: "Test Company",
        displayName: "Test Display Name",
      };

      companyRepository.getCompanyListData.mockResolvedValue(
        mockCompanyDetails
      );

      const result = await service.getCompanyBasicDetails(1, 123);

      expect(result).toEqual(mockCompanyDetails);
      expect(companyRepository.getCompanyListData).toHaveBeenCalledWith(
        ["id", "companyName", "displayName"],
        ["companyAddresses.address", "companyContactMaps.contact"],
        { id: 1, createdBy: 123 }
      );
    });

    it("should throw NotFoundException if company details are not found", async () => {
      companyRepository.getCompanyListData.mockResolvedValue(null);

      await expect(service.getCompanyBasicDetails(1, 123)).rejects.toThrow(
        InternalServerErrorException
      );
      expect(companyRepository.getCompanyListData).toHaveBeenCalledWith(
        ["id", "companyName", "displayName"],
        ["companyAddresses.address", "companyContactMaps.contact"],
        { id: 1, createdBy: 123 }
      );
    });

    it("should throw InternalServerErrorException if an unexpected error occurs", async () => {
      const errorMessage = "Database error";
      companyRepository.getCompanyListData.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(service.getCompanyBasicDetails(1, 123)).rejects.toThrow(
        InternalServerErrorException
      );
      expect(companyRepository.getCompanyListData).toHaveBeenCalledWith(
        ["id", "companyName", "displayName"],
        ["companyAddresses.address", "companyContactMaps.contact"],
        { id: 1, createdBy: 123 }
      );
    });
  });

  describe("getCompaniesByHierarchy", () => {
    it("should return companies for team view by expanding hierarchy", async () => {
      scopeServiceMock.getNewEmployeeHierarchyByUserId.mockResolvedValue([
        { userId: 11 },
        { userId: 12 },
      ]);
      const companies = {
        data: [{ companyId: 1, companyName: "A", displayName: "A" }],
        count: 1,
      };
      companyRepository.findCompaniesByOwnerIds.mockResolvedValue(companies);

      const result = await service.getCompaniesByHierarchy(
        10,
        5,
        OWNER_TYPES.TEAM,
        DEFAULT_PAGE,
        DEFAULT_LIMIT
      );

      expect(
        scopeServiceMock.getNewEmployeeHierarchyByUserId
      ).toHaveBeenCalledWith(5);
      expect(companyRepository.findCompaniesByOwnerIds).toHaveBeenCalledWith(
        [11, 12],
        DEFAULT_PAGE,
        DEFAULT_LIMIT,
        undefined
      );
      expect(result).toEqual(companies);
    });

    it("should default to logged in user when viewBy is manager", async () => {
      const companies = {
        data: [{ companyId: 2, companyName: "B", displayName: "B" }],
        count: 1,
      };
      companyRepository.findCompaniesByOwnerIds.mockResolvedValue(companies);

      const result = await service.getCompaniesByHierarchy(
        10,
        undefined,
        OWNER_TYPES.MANAGER,
        DEFAULT_PAGE,
        DEFAULT_LIMIT
      );

      expect(
        scopeServiceMock.getNewEmployeeHierarchyByUserId
      ).not.toHaveBeenCalled();
      expect(companyRepository.findCompaniesByOwnerIds).toHaveBeenCalledWith(
        [10],
        DEFAULT_PAGE,
        DEFAULT_LIMIT,
        undefined
      );
      expect(result).toEqual(companies);
    });

    it("should return empty array when no user ids resolved", async () => {
      scopeServiceMock.getNewEmployeeHierarchyByUserId.mockResolvedValue([]);

      const result = await service.getCompaniesByHierarchy(
        10,
        5,
        OWNER_TYPES.TEAM,
        DEFAULT_PAGE,
        DEFAULT_LIMIT
      );

      expect(companyRepository.findCompaniesByOwnerIds).not.toHaveBeenCalled();
      expect(result).toEqual({ data: [], count: 0 });
    });

    it("should throw internal server error on repository failure", async () => {
      scopeServiceMock.getNewEmployeeHierarchyByUserId.mockResolvedValue([
        { userId: 11 },
      ]);
      companyRepository.findCompaniesByOwnerIds.mockRejectedValue(
        new Error("db error")
      );

      await expect(
        service.getCompaniesByHierarchy(
          10,
          5,
          OWNER_TYPES.TEAM,
          DEFAULT_PAGE,
          DEFAULT_LIMIT
        )
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("updateCompany", () => {
    it("should update a company successfully", async () => {
      const companyId = "1";
      const companyDto: UpdateCompanyDto = {
        updatedBy: 123,
        gstDetails: [{ id: 1, gstNumber: "GST123" }], // Ensure this is properly mocked
        companyDocMaps: [{ documentId: 1 }],
        groupCompanyMap: {
          groupCompanyId: 1,
        },
        addresses: [{ id: 1, address1: "Updated Address" }],
      };
      const companyDetailsDto: CompanyDetailsDto = {
        companyHistory: "Updated History",
      };

      const mockEntityManager = {
        find: jest.fn().mockResolvedValue([{ address: { id: 1 } }]), // Mock existing addresses
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
      };

      jest
        .spyOn(dataSource, "transaction")
        .mockImplementation(async (callback) => {
          return callback({
            find: jest.fn().mockResolvedValue([{ address: { id: 1 } }]), // Mock existing addresses
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          });
        });

      jest.spyOn(companyRepository, "updateCompany").mockResolvedValue({
        id: 1,
        groupCompanyLid: 1,
      });
      jest
        .spyOn(companyRepository, "deleteGroupCompanyMap")
        .mockResolvedValue({});
      jest.spyOn(companyRepository, "updateGstDetail").mockResolvedValue({});
      jest.spyOn(companyRepository, "createGstDetail").mockResolvedValue({});
      jest
        .spyOn(companyRepository, "updateCompanyDetails")
        .mockResolvedValue({});
      jest
        .spyOn(companyRepository, "createOrUpdateGroupCompanyMap")
        .mockResolvedValue({});
      jest
        .spyOn(companyRepository, "createOrUpdateCompanyDocMap")
        .mockResolvedValue({});
      jest.spyOn(addressService, "updateAddressById").mockResolvedValue({});
      jest.spyOn(addressService, "addAddress").mockResolvedValue({ id: 2 });
      const result = await service.updateCompany(
        companyId,
        companyDto,
        companyDetailsDto
      );

      expect(result).toEqual({ id: 1 });
      expect(companyRepository.updateCompany).toHaveBeenCalledWith(
        expect.anything(),
        companyId,
        companyDto
      );
      expect(companyRepository.updateGstDetail).toHaveBeenCalled();
      expect(companyRepository.createGstDetail).toHaveBeenCalled();
      expect(companyRepository.updateCompanyDetails).toHaveBeenCalled();
      expect(
        companyRepository.createOrUpdateGroupCompanyMap
      ).toHaveBeenCalled();
      expect(companyRepository.createOrUpdateCompanyDocMap).toHaveBeenCalled();
      expect(addressService.updateAddressById).toHaveBeenCalled();
      expect(addressService.addAddress).toHaveBeenCalled();
    });

    it("should delete the group company map if groupCompanyMap is not provided", async () => {
      const companyId = "1";
      const companyDto: UpdateCompanyDto = {
        updatedBy: 123,
        gstDetails: [],
        companyDocMaps: [],
      }; // No groupCompanyMap provided
      const companyDetailsDto: CompanyDetailsDto = {};

      jest
        .spyOn(dataSource, "transaction")
        .mockImplementation(async (callback) => {
          return callback({});
        });

      const result = await service.updateCompany(
        companyId,
        companyDto,
        companyDetailsDto
      );

      expect(result).toEqual({ id: 1 });
      expect(companyRepository.deleteGroupCompanyMap).toHaveBeenCalledWith(
        expect.anything(),
        Number(companyId)
      );
    });

    it("should throw an error if non-editable fields are modified", async () => {
      const companyId = "1";
      const companyDto: UpdateCompanyDto = {
        updatedBy: 123,
        nonEditableField: "value", // Simulating a non-editable field
      } as any;

      await expect(
        service.updateCompany(companyId, companyDto, null)
      ).rejects.toThrow(ForbiddenException);

      it("should throw a NotFoundException if the company is not found", async () => {
        const companyId = "1";
        const companyDto: UpdateCompanyDto = { updatedBy: 123 };

        jest.spyOn(companyRepository, "updateCompany").mockResolvedValue(null);

        await expect(
          service.updateCompany(companyId, companyDto, null)
        ).rejects.toThrow(NotFoundException);
      });

      it("should throw a NotFoundException if an address ID is invalid", async () => {
        const companyId = "1";
        const companyDto: UpdateCompanyDto = {
          updatedBy: 123,
          addresses: [{ id: 999, address1: "Invalid Address" }],
        };

        jest
          .spyOn(dataSource, "transaction")
          .mockImplementation(async (callback) => {
            return callback({
              find: jest.fn().mockResolvedValue([{ address: { id: 1 } }]), // Simulate existing address
            });
          });

        await expect(
          service.updateCompany(companyId, companyDto, null)
        ).rejects.toThrow(`Company not found`);
      });

      it("should throw an error for duplicate entries", async () => {
        const companyId = "1";
        const companyDto: UpdateCompanyDto = { updatedBy: 123 };

        jest
          .spyOn(dataSource, "transaction")
          .mockRejectedValue(new Error("Duplicate entry"));

        await expect(
          service.updateCompany(companyId, companyDto, null)
        ).rejects.toThrow("Duplicate entry");
      });

      it("should handle errors during the update process", async () => {
        const companyId = "1";
        const companyDto: UpdateCompanyDto = { updatedBy: 123 };

        jest
          .spyOn(dataSource, "transaction")
          .mockRejectedValue(new Error("Unexpected error"));

        await expect(
          service.updateCompany(companyId, companyDto, null)
        ).rejects.toThrow("Unexpected error");
      });
    });

    describe("getCompanies", () => {
      it("should return a list of companies when successful", async () => {
        const mockCompanies = [
          { id: 1, name: "Company A" },
          { id: 2, name: "Company B" },
        ];
        companyRepository.getCompanies.mockResolvedValue(mockCompanies);

        const result = await service.getCompanies(1, 10, "searchTerm");

        expect(result).toEqual(mockCompanies);
        expect(companyRepository.getCompanies).toHaveBeenCalledWith(
          1,
          10,
          "searchTerm"
        );
      });
    });
    it("should throw NotFoundException if no companies are found", async () => {
      companyRepository.getCompanies.mockRejectedValue(
        new NotFoundException("No companies found")
      );

      await expect(service.getCompanies(1, 10, "searchTerm")).rejects.toThrow(
        NotFoundException
      );
      expect(companyRepository.getCompanies).toHaveBeenCalledWith(
        1,
        10,
        "searchTerm"
      );
    });

    it("should throw a generic error if an unexpected error occurs", async () => {
      companyRepository.getCompanies.mockRejectedValue(
        new Error("Unexpected error")
      );

      await expect(service.getCompanies(1, 10, "searchTerm")).rejects.toThrow(
        new Error(errorMessages.companyListFailed)
      );
      expect(companyRepository.getCompanies).toHaveBeenCalledWith(
        1,
        10,
        "searchTerm"
      );
    });
  });
  describe("bulkUpdateCompanies", () => {
    beforeEach(() => {
      // Ensure transaction executes callback
      dataSource.transaction.mockImplementation(async (cb) => cb({}));
    });

    it("should return zero counts when recordIds is empty", async () => {
      const result = await service.bulkUpdateCompanies(
        [],
        [
          { fieldName: "status", newValue: 2, operation: "set" },
        ],
        99
      );
      expect(result).toEqual({
        totalRecords: 0,
        successCount: 0,
        failureCount: 0,
        errors: [],
        affectedRecords: [],
        processingDuration: 0,
      });
    });

    it("should update companies and collect errors for not found / invalid fields", async () => {
      // Mock repository lookups
      companyRepository.getCompanyById.mockImplementation(
        async (id: number) => {
          if (id === 1 || id === 2) {
            return { id, priorityLid: 5, status: 1 };
          }
          return null;
        }
      );
      companyRepository.updateCompany.mockResolvedValue({ id: 1 });

      const result = await service.bulkUpdateCompanies(
        [1, 2, 3],
        [
          { fieldName: "status", newValue: 10, operation: "set" },
          { fieldName: "priority", newValue: 4, operation: "set" },
          { fieldName: "non_editable_x", newValue: "bad", operation: "set" },
        ],
        42
      );

      expect(result.totalRecords).toBe(3);
      expect(result.successCount + result.failureCount).toBe(3);
      expect(result.affectedRecords).toEqual(expect.arrayContaining([1, 2]));
      // At least one error for not found companyId 3
      expect(
        result.errors.find(
          (e) => e.recordId === 3 && e.errorCode === "NOT_FOUND"
        )
      ).toBeTruthy();
      // Error for non bulk editable field
      expect(
        result.errors.find(
          (e) =>
            e.fieldName === "non_editable_x" &&
            e.errorCode === "FIELD_NOT_BULK_EDITABLE"
        )
      ).toBeTruthy();
    });
  });
});
