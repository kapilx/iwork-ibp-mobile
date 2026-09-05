import { InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  EntityManager,
  ILike,
  In,
  QueryFailedError,
  Repository,
} from "typeorm";
import {
  DEFAULT_COMPANY_ENTITY_NAME,
  DUPLICATE_CONSTRAINT,
  OPPORTUNITY_STAGES,
  COMPANY_LIST_COLOUR,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { CompanyDetail } from "../../../../service-lib/src/lib/entities/company-detail.entity";
import { CompanyDocMap } from "../../../../service-lib/src/lib/entities/company-document-map.entity";
import { StateGstDetail } from "../../../../service-lib/src/lib/entities/company-gst-detail.entity";
import { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import { GroupCompanyMap } from "../../../../service-lib/src/lib/entities/group-comapny-map.entity";
import { CompanyRepository } from "./company.repository";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { Opportunity } from "../../../../service-lib/src/lib/entities/opportunity.entity";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { PolicyClaim } from "../../../../service-lib/src/lib/entities/policy-employee-claim.entity";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";

describe("CompanyRepository", () => {
  let repository: CompanyRepository;
  let companyRepoMock: jest.Mocked<Repository<Company>>;
  let companyQueryBuilderMock: any;
  let lookupRepoMock: jest.Mocked<Repository<LookUp>>;
  let opportunityRepoMock: jest.Mocked<Repository<Opportunity>>;
  let entityManagerMock: jest.Mocked<EntityManager>;
  let entityServiceMock: jest.Mocked<EntityService>;
  let policyRepoMock: any;
  let policyQueryBuilderMock: any;

  beforeEach(async () => {
    companyQueryBuilderMock = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };

    companyRepoMock = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
      update: jest.fn(),
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(companyQueryBuilderMock),
    } as unknown as jest.Mocked<Repository<Company>>;

    lookupRepoMock = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<LookUp>>;

    opportunityRepoMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      }),
    } as unknown as jest.Mocked<Repository<Opportunity>>;

    entityManagerMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    entityServiceMock = {
      getLookupValues: jest.fn(),
      getData: jest.fn(),
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
        CompanyRepository,
        { provide: getRepositoryToken(Company), useValue: companyRepoMock },
        { provide: getRepositoryToken(LookUp), useValue: lookupRepoMock },
        {
          provide: getRepositoryToken(Opportunity),
          useValue: opportunityRepoMock,
        },
        { provide: getRepositoryToken(Policy), useValue: policyRepoMock },
        { provide: getRepositoryToken(PolicyClaim), useValue: {} },
        { provide: ScopeService, useValue: {} },
        { provide: TraceIdService, useValue: {} },
        { provide: EntityManager, useValue: entityManagerMock },
        { provide: EntityService, useValue: entityServiceMock },
      ],
    }).compile();

    repository = module.get<CompanyRepository>(CompanyRepository);
  });

  describe("createCompany", () => {
    it("should create and save a company", async () => {
      const companyData = { name: "Test Company" };
      const savedCompany = { id: 1, ...companyData };

      entityManagerMock.create.mockReturnValue(savedCompany);
      entityManagerMock.save.mockResolvedValue(savedCompany);

      const result = await repository.createCompany(
        entityManagerMock,
        companyData
      );

      expect(entityManagerMock.create).toHaveBeenCalledWith(
        Company,
        companyData
      );
      expect(entityManagerMock.save).toHaveBeenCalledWith(savedCompany);
      expect(result).toEqual(savedCompany);
    });

    it("should throw an error for duplicate PAN entry", async () => {
      const companyData = { name: "Test Company" };
      const error = new QueryFailedError("", [], {
        constraint: DUPLICATE_CONSTRAINT.duplicatePanEntry,
      });

      entityManagerMock.save.mockRejectedValue(error);

      await expect(
        repository.createCompany(entityManagerMock, companyData)
      ).rejects.toThrow(errorMessages.DulicatePanEntry);
    });

    it("should throw an error for duplicate TAN entry", async () => {
      const companyData = { name: "Test Company" };
      const error = new QueryFailedError("", [], {
        constraint: DUPLICATE_CONSTRAINT.duplicateTanEntry,
      });

      entityManagerMock.save.mockRejectedValue(error);

      await expect(
        repository.createCompany(entityManagerMock, companyData)
      ).rejects.toThrow(errorMessages.DuplicateTanEntry);
    });

    it("should throw an error if createCompany fails with an unexpected error", async () => {
      const companyData = { name: "Test Company" };
      const error = new Error("Unexpected error");

      entityManagerMock.save.mockRejectedValue(error);

      await expect(
        repository.createCompany(entityManagerMock, companyData)
      ).rejects.toThrow("Unexpected error");
    });
  });

  describe("createCompanyDetails", () => {
    it("should create and save company details", async () => {
      const detailsData = { companyId: 1, acquisitionHistory: "Positive" };
      const savedDetails = { id: 1, ...detailsData };

      entityManagerMock.create.mockReturnValue(savedDetails);
      entityManagerMock.save.mockResolvedValue(savedDetails);

      const result = await repository.createCompanyDetails(
        entityManagerMock,
        detailsData
      );

      expect(entityManagerMock.create).toHaveBeenCalledWith(
        CompanyDetail,
        detailsData
      );
      expect(entityManagerMock.save).toHaveBeenCalledWith(savedDetails);
      expect(result).toEqual(savedDetails);
    });
  });

  describe("getCompanyById", () => {
    it("should throw NotFoundException if company is not found", async () => {
      const companyId = 1;

      companyRepoMock.findOne.mockResolvedValue(null);

      await expect(repository.getCompanyById(companyId)).rejects.toThrow(Error);
      expect(companyRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: companyId },
        relations: [
          "details",
          "companyAddresses",
          "companyAddresses.address",
          "companyAddresses.address.addressType",
          "stateGstDetails.gstCategory",
          "groupCompanyMaps",
          "groupCompanyMaps.groupCompany",
          "companyDocMaps",
          "companyContactMaps",
          "country",
          "owner",
        ],
      });
    });
    it("should throw an error if lookup values fetch fails", async () => {
      const companyId = 1;
      const mockCompany = {
        id: companyId,
        industrySegmentLid: 1,
        priorityLid: 2,
      };

      companyRepoMock.findOne.mockResolvedValue(mockCompany as Company);
      entityServiceMock.getLookupValues.mockRejectedValue(
        new Error("Failed to fetch lookup values")
      );

      await expect(repository.getCompanyById(companyId)).rejects.toThrow(
        "Failed to fetch lookup values"
      );
    });
    it("should throw an error if getCompanyById fails unexpectedly", async () => {
      const companyId = 1;
      const error = new Error("Unexpected error");
      companyRepoMock.findOne.mockRejectedValue(error);
      await expect(repository.getCompanyById(companyId)).rejects.toThrow(
        "Unexpected error"
      );
    });
    it("should throw an error if lookup value fetching fails", async () => {
      const companyId = 1;
      const mockCompany = {
        id: companyId,
        industrySegmentLid: 1,
        priorityLid: 2,
      };

      companyRepoMock.findOne.mockResolvedValue(mockCompany as Company);
      entityServiceMock.getLookupValues.mockResolvedValue(undefined); // Simulate undefined lookup values

      await expect(repository.getCompanyById(companyId)).rejects.toThrow(
        "Failed to fetch lookup values"
      );
    });
    it("should throw an error if lookup values are incomplete in getCompanyById", async () => {
      const companyId = 1;
      const mockCompany = { id: companyId, industrySegmentLid: 1 };
      companyRepoMock.findOne.mockResolvedValue(mockCompany as Company);
      entityServiceMock.getLookupValues.mockResolvedValue([]);
      await expect(repository.getCompanyById(companyId)).rejects.toThrow(
        "Failed to fetch lookup values"
      );
    });
  });

  describe("deleteByCompanyId", () => {
    it("should soft delete a company and its related entities", async () => {
      const companyId = "1";
      const result = { affected: 1 };

      companyRepoMock.manager.transaction.mockImplementation(
        async (callback) => {
          return callback(entityManagerMock);
        }
      );

      entityManagerMock.update.mockResolvedValue(result);

      const deleteResult = await repository.deleteByCompanyId(companyId);

      expect(entityManagerMock.update).toHaveBeenCalledTimes(4);
      expect(deleteResult).toEqual(result);
    });

    it("should throw an error during the transaction", async () => {
      const companyId = "1";
      const error = new Error("Transaction error");

      companyRepoMock.manager.transaction.mockRejectedValue(error);

      await expect(repository.deleteByCompanyId(companyId)).rejects.toThrow(
        "Transaction error"
      );
    });
  });
  describe("findAllCompanyList", () => {
    let companyRepository: CompanyRepository;
    let entityService: EntityService;

    beforeEach(() => {
      entityService = {
        getData: jest.fn(),
        getLookupValues: jest.fn(),
      } as unknown as EntityService;

      companyRepository = new CompanyRepository(
        null as any, // Mocked dependencies
        null as any,
        null as any,
        null as any,
        null as any,
        entityService,
        null as any,
        null as any
      );
    });

    it("should return a paginated list of companies with transformed data", async () => {
      const page = 1;
      const limit = 10;
      const search = "test";
      const sortBy = "companyName";
      const sort: "ASC" | "DESC" = "ASC";
      const userId = 123;

      const mockData = [
        {
          id: 1,
          companyName: "Test Company",
          priorityLid: 1,
          industrySegmentLid: 2,
          companyTypeLid: 3,
          sentimentLid: 4,
          companyAddresses: [
            {
              address: {
                cityId: { name: "City A" },
              },
            },
          ],
          leadCrmInfo: { firstName: "John", lastName: "Doe" },
          sumInsured: 1000,
          annualPremium: 500,
        },
      ];

      const mockLookupValues = [
        { id: 1, lookUpValue: "High Priority" },
        { id: 2, lookUpValue: "IT Industry" },
        { id: 3, lookUpValue: "Private Limited" },
        { id: 4, lookUpValue: "Positive" },
      ];

      const mockKpiCounts = [{ stageKey: "STAGE_CREATED", count: 5 }];

      jest.spyOn(entityService, "getData").mockResolvedValue({
        data: mockData,
        count: 1,
      });

      jest
        .spyOn(entityService, "getLookupValues")
        .mockResolvedValue(mockLookupValues);

      jest
        .spyOn(companyRepository, "getCompanyKpis")
        .mockResolvedValue(mockKpiCounts);

      jest
        .spyOn(companyRepository as any, "aggregateCompanyKpis")
        .mockResolvedValue({
          totalSoCount: 2,
          totalSoPremium: 0,
          totalRoCount: 0,
          totalRoPremium: 0,
          untappedCompanies: 0,
          totalCompaniesPremium: 0,
          totalCompaniesBrokerage: 0,
          totalPoliciesCount: 0,
        });

      jest.spyOn(companyRepository, "getCompanyAnalytics").mockResolvedValue({
        soCount: 2,
        soTotalPremium: 0,
        roCount: 0,
        roTotalPremium: 0,
        totalSumInsured: 2000,
        policyCount: 0,
        policyTotalPremium: 0,
        brokerage: 0,
        claimAmount: 0,
      });

      const result = await companyRepository.findAllCompanyList(
        page,
        limit,
        [],
        [],
        userId,
        ""
      );

      expect(result).toEqual({
        data: [
          {
            companyName: "Test Company",
            companyId: 1,
            displayName: undefined,
            noOfEmployees: undefined,
            city: "City A",
            priority: "High Priority",
            industrySegment: "IT Industry",
            companyType: "Private Limited",
            sentiment: "Positive",
            sumInsured: 2000,
            salesOpportunityCount: 2,
            renewalOpportunityCount: 0,
            policyCount: 0,
            annualPremium: 500,
            soPremium: 0,
            roPremium: 0,
            policyPremium: 0,
            brokerage: 0,
            claimAmount: 0,
            leadCRM: "John Doe",
            previousInsurer: "",
            previousTpa: "",
            previousBroker: "",
            salesOpportunityBeyondTheQuarterCount: 0,
            renewalOpportunityBeyondTheQuarterCount: 0,
            colorKey: COMPANY_LIST_COLOUR.RED,
          },
        ],
        count: 1,
        companyLeads: 5,
        companyProspects: 0,
        companyQcr: 0,
        companyClients: 0,
        totalSoCount: 2,
        totalSoPremium: 0,
        totalRoCount: 0,
        totalRoPremium: 0,
        untappedCompanies: 0,
        totalCompaniesPremium: 0,
        totalCompaniesBrokerage: 0,
        totalPoliciesCount: 0,
      });

      expect(entityService.getData).toHaveBeenCalledWith(
        "DEFAULT_COMPANY_ENTITY_NAME",
        page,
        limit,
        undefined,
        sortBy,
        sort,
        {
          details: true,
          companyAddresses: {
            address: {
              countryId: true,
            },
          },
          leadCrmInfo: true,
        },
        { createdBy: userId },
        undefined,
        [
          {
            searchBy: "companyName",
            searchValue: search,
          },
        ]
      );

      expect(entityService.getLookupValues).toHaveBeenCalledWith([1, 2, 3, 4]);
      expect(companyRepository.getCompanyKpis).toHaveBeenCalledWith(userId, [
        { searchBy: "companyName", searchValue: search },
        { searchBy: "displayName", searchValue: search },
      ]);
    });

    it("should return empty data if no companies are found", async () => {
      const page = 1;
      const limit = 10;
      const search = "test";
      const sortBy = "companyName";
      const sort: "ASC" | "DESC" = "ASC";
      const userId = 123;

      jest.spyOn(entityService, "getData").mockResolvedValue({
        data: [],
        count: 0,
      });

      const result = await companyRepository.findAllCompanyList(
        page,
        limit,
        [],
        [],
        userId,
        ""
      );

      expect(result).toEqual({
        data: [],
        count: 0,
        companyLeads: 0,
        companyProspects: 0,
        companyQcr: 0,
        companyClients: 0,
        totalSoCount: 0,
        totalSoPremium: 0,
        totalRoCount: 0,
        totalRoPremium: 0,
        untappedCompanies: 0,
        totalCompaniesPremium: 0,
        totalCompaniesBrokerage: 0,
        totalPoliciesCount: 0,
      });

      expect(entityService.getData).toHaveBeenCalled();
    });

    it("should throw an error if getData fails", async () => {
      const page = 1;
      const limit = 10;
      const search = "test";
      const sortBy = "companyName";
      const sort: "ASC" | "DESC" = "ASC";
      const userId = 123;

      jest
        .spyOn(entityService, "getData")
        .mockRejectedValue(new Error("Failed to fetch data"));

      await expect(
        companyRepository.findAllCompanyList(page, limit, [], [], userId, "")
      ).rejects.toThrow("Failed to fetch company list");
    });
  });
  describe("updateCompany", () => {
    it("should update a company", async () => {
      const companyId = "1";
      const companyData = { name: "Updated Company" };
      const existingCompany = { id: 1, name: "Old Company" };

      entityManagerMock.findOne.mockResolvedValue(existingCompany);
      entityManagerMock.update.mockResolvedValue({ affected: 1 });
      entityManagerMock.findOne.mockResolvedValue({ id: 1, ...companyData });

      const result = await repository.updateCompany(
        entityManagerMock,
        companyId,
        companyData
      );

      expect(entityManagerMock.findOne).toHaveBeenCalledWith(Company, {
        where: { id: Number(companyId) },
      });
      expect(entityManagerMock.update).toHaveBeenCalledWith(
        Company,
        { id: companyId },
        companyData
      );
      expect(result).toEqual({ id: 1, ...companyData });
    });

    it("should throw NotFoundException if company does not exist", async () => {
      const companyId = "1";
      const companyData = { name: "Updated Company" };

      entityManagerMock.findOne.mockResolvedValue(null);

      await expect(
        repository.updateCompany(entityManagerMock, companyId, companyData)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createGstDetail", () => {
    it("should create and save GST details", async () => {
      const gstData = { gstNumber: "12345" };
      const savedGstDetail = { id: 1, ...gstData };

      entityManagerMock.create.mockReturnValue(savedGstDetail);
      entityManagerMock.save.mockResolvedValue(savedGstDetail);

      const result = await repository.createGstDetail(
        entityManagerMock,
        gstData
      );

      expect(entityManagerMock.create).toHaveBeenCalledWith(
        StateGstDetail,
        gstData
      );
      expect(entityManagerMock.save).toHaveBeenCalledWith(savedGstDetail);
      expect(result).toEqual(savedGstDetail);
    });

    it("should throw an error for duplicate GST entry", async () => {
      const gstData = { gstNumber: "12345" };
      const error = new QueryFailedError("", [], {
        constraint: DUPLICATE_CONSTRAINT.duplicateGstinEntry,
      });

      entityManagerMock.save.mockRejectedValue(error);

      await expect(
        repository.createGstDetail(entityManagerMock, gstData)
      ).rejects.toThrow(errorMessages.DuplicateGstinEntry);
    });

    it("should throw an error for duplicate GSTIN entry", async () => {
      const gstData = { gstNumber: "12345" };
      const error = new QueryFailedError("", [], {
        constraint: DUPLICATE_CONSTRAINT.duplicateGstinEntry,
      });

      entityManagerMock.save.mockRejectedValue(error);

      await expect(
        repository.createGstDetail(entityManagerMock, gstData)
      ).rejects.toThrow(errorMessages.DuplicateGstinEntry);
    });
    it("should throw an error if createGstDetail fails unexpectedly", async () => {
      const gstData = { gstNumber: "GST12345" };
      const error = new Error("Unexpected error");

      entityManagerMock.save.mockRejectedValue(error);

      await expect(
        repository.createGstDetail(entityManagerMock, gstData)
      ).rejects.toThrow("Unexpected error");
    });
  });

  describe("createGroupCompanyMap", () => {
    it("should create and save a group company map", async () => {
      const groupCompanyMapData = { companyId: 1, groupCompanyId: 2 };
      const savedGroupCompanyMap = { id: 1, ...groupCompanyMapData };

      entityManagerMock.create.mockReturnValue(savedGroupCompanyMap);
      entityManagerMock.save.mockResolvedValue(savedGroupCompanyMap);

      const result = await repository.createGroupCompanyMap(
        entityManagerMock,
        groupCompanyMapData
      );

      expect(entityManagerMock.create).toHaveBeenCalledWith(
        GroupCompanyMap,
        groupCompanyMapData
      );
      expect(entityManagerMock.save).toHaveBeenCalledWith(savedGroupCompanyMap);
      expect(result).toEqual(savedGroupCompanyMap);
    });

    it("should throw NotFoundException for invalid foreign key", async () => {
      const groupCompanyMapData = { companyId: 1, groupCompanyId: 2 };
      const error = new QueryFailedError("", [], {
        message: "violates foreign key constraint",
      });

      entityManagerMock.save.mockRejectedValue(error);

      await expect(
        repository.createGroupCompanyMap(entityManagerMock, groupCompanyMapData)
      ).rejects.toThrow(NotFoundException);
    });
    it("should throw an error if createGroupCompanyMap fails unexpectedly", async () => {
      const groupCompanyMapData = { companyId: 1, groupCompanyId: 2 };
      const error = new Error("Unexpected error");

      entityManagerMock.save.mockRejectedValue(error);

      await expect(
        repository.createGroupCompanyMap(entityManagerMock, groupCompanyMapData)
      ).rejects.toThrow("Unexpected error");
    });
  });

  describe("deleteGroupCompanyMap", () => {
    it("should delete a group company map by companyId", async () => {
      const companyId = 1;
      const deleteResult = { affected: 1 };

      entityManagerMock.delete.mockResolvedValue(deleteResult);

      const result = await repository.deleteGroupCompanyMap(
        entityManagerMock,
        companyId
      );

      expect(entityManagerMock.delete).toHaveBeenCalledWith(GroupCompanyMap, {
        companyId,
      });
      expect(result).toEqual(deleteResult);
    });

    it("should throw NotFoundException if group company map is not found", async () => {
      const companyId = 1;

      entityManagerMock.delete.mockRejectedValue(
        new Error("GroupCompanyMap not found")
      );

      await expect(
        repository.deleteGroupCompanyMap(entityManagerMock, companyId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateCompanyDetails", () => {
    it("should update existing company details", async () => {
      const companyId = "1";
      const detailsData = { acquisitionHistory: "Positive" };
      const existingDetails = {
        id: 1,
        companyId: 1,
        acquisitionHistory: "Neutral",
      };

      entityManagerMock.findOne.mockResolvedValueOnce(existingDetails);
      entityManagerMock.update.mockResolvedValueOnce({ affected: 1 });
      entityManagerMock.findOne.mockResolvedValueOnce({
        ...existingDetails,
        ...detailsData,
      });

      const result = await repository.updateCompanyDetails(
        entityManagerMock,
        companyId,
        detailsData
      );

      expect(entityManagerMock.findOne).toHaveBeenCalledWith(CompanyDetail, {
        where: { companyId: 1 },
      });
      expect(entityManagerMock.update).toHaveBeenCalledWith(
        CompanyDetail,
        { companyId: 1 },
        detailsData
      );
      expect(result).toEqual({ ...existingDetails, ...detailsData });
    });

    it("should create new company details if none exist", async () => {
      const companyId = "1";
      const detailsData = { acquisitionHistory: "Positive" };
      const newDetails = { id: 1, companyId: 1, ...detailsData };

      entityManagerMock.findOne.mockResolvedValueOnce(null);
      entityManagerMock.create.mockReturnValueOnce(newDetails);
      entityManagerMock.save.mockResolvedValueOnce(newDetails);

      const result = await repository.updateCompanyDetails(
        entityManagerMock,
        companyId,
        detailsData
      );

      expect(entityManagerMock.create).toHaveBeenCalledWith(CompanyDetail, {
        ...detailsData,
        companyId: 1,
      });
      expect(entityManagerMock.save).toHaveBeenCalledWith(newDetails);
      expect(result).toEqual(newDetails);
    });

    it("should throw an error for duplicate GSTIN entry", async () => {
      const companyId = "1";
      const detailsData = { acquisitionHistory: "Positive" };
      const error = new QueryFailedError("", [], {
        constraint: DUPLICATE_CONSTRAINT.duplicateGstinEntry,
      });

      entityManagerMock.save.mockRejectedValue(error);

      await expect(
        repository.updateCompanyDetails(
          entityManagerMock,
          companyId,
          detailsData
        )
      ).rejects.toThrow(errorMessages.DuplicateGstinEntry);
    });
  });

  describe("updateOrCreateGroupCompanyMap", () => {
    it("should create a new group company map if none exists", async () => {
      const groupCompanyMapData = { companyId: 1, groupCompanyId: 2 };
      const newMap = { id: 1, ...groupCompanyMapData };

      entityManagerMock.findOne.mockResolvedValueOnce(null);
      entityManagerMock.create.mockReturnValueOnce(newMap);
      entityManagerMock.save.mockResolvedValueOnce(newMap);

      const result = await repository.createGroupCompanyMap(
        entityManagerMock,
        groupCompanyMapData
      );

      expect(entityManagerMock.create).toHaveBeenCalledWith(
        GroupCompanyMap,
        groupCompanyMapData
      );
      expect(entityManagerMock.save).toHaveBeenCalledWith(newMap);
      expect(result).toEqual(newMap);
    });
  });

  describe("createOrUpdateCompanyDocMap", () => {
    it("should update an existing company document map", async () => {
      const companyDocMapData = { id: 1, documentId: 2, companyId: 1 };
      const existingDocMap = { id: 1, ...companyDocMapData };

      entityManagerMock.getRepository = jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValueOnce(existingDocMap),
      });
      entityManagerMock.update.mockResolvedValueOnce({ affected: 1 });
      entityManagerMock.findOne.mockResolvedValueOnce(existingDocMap);

      const result = await repository.createOrUpdateCompanyDocMap(
        entityManagerMock,
        companyDocMapData
      );

      expect(entityManagerMock.update).toHaveBeenCalledWith(
        CompanyDocMap,
        { id: 1 },
        companyDocMapData
      );
      expect(result).toEqual(existingDocMap);
    });

    it("should create a new company document map if none exists", async () => {
      const companyDocMapData = { documentId: 2, companyId: 1 };
      const newDocMap = { id: 1, ...companyDocMapData };

      entityManagerMock.getRepository = jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValueOnce({ id: 2 }), // Mock document exists
      });
      entityManagerMock.create.mockReturnValueOnce(newDocMap);
      entityManagerMock.save.mockResolvedValueOnce(newDocMap);

      const result = await repository.createOrUpdateCompanyDocMap(
        entityManagerMock,
        companyDocMapData
      );

      expect(entityManagerMock.create).toHaveBeenCalledWith(
        CompanyDocMap,
        companyDocMapData
      );
      expect(entityManagerMock.save).toHaveBeenCalledWith(newDocMap);
      expect(result).toEqual(newDocMap);
    });

    it("should throw an error if document ID is not found", async () => {
      const companyDocMapData = { documentId: 1, companyId: 1 };

      entityManagerMock.getRepository = jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });

      await expect(
        repository.createOrUpdateCompanyDocMap(
          entityManagerMock,
          companyDocMapData
        )
      ).rejects.toThrow("Document with ID 1 not found in fileupload table");
    });
  });

  describe("CompanyList", () => {
    it("should return a paginated list of companies", async () => {
      const page = 1;
      const limit = 10;
      const search = "Test";
      const sortBy = "companyName";
      const sort = "ASC";
      const userId = 1;
      const companies = [
        { id: 1, companyName: "Test Company", displayName: "Test" },
      ];
      const count = 1;

      companyRepoMock.findAndCount.mockResolvedValueOnce([companies, count]);

      scopeServiceMock.validateScope.mockResolvedValue({
        data: companies,
        count,
      });

      const result = await repository.CompanyList(page, limit, search, userId);

      expect(scopeServiceMock.validateScope).toHaveBeenCalled();
      expect(result).toEqual({ data: companies, count });
    });

    it("should throw an error during the query", async () => {
      const error = new Error("Query error");

      scopeServiceMock.validateScope.mockRejectedValue(error);

      await expect(repository.CompanyList(1, 10, "Test", 1)).rejects.toThrow(
        "Failed to fetch company name list"
      );
    });
  });

  describe("transformResponse", () => {
    it("should transform company data into the desired format", async () => {
      const mockData = {
        id: 1,
        companyName: "Test Company",
        displayName: "Test",
        companyAddresses: [
          {
            address: {
              id: 1,
              address1: "123 Street",
              cityId: { id: 1, name: "City" },
            },
          },
        ],
        companyContactMaps: [
          {
            contact: {
              id: 1,
              firstName: "John",
              lastName: "Doe",
              middleName: "M",
              displayName: "John Doe",
            },
          },
        ],
      };

      const result = await repository.transformResponse(mockData);

      expect(result).toEqual({
        id: 1,
        companyName: "Test Company",
        displayName: "Test",
        companyAddresses: [
          {
            id: 1,
            address1: "123 Street",
            cityId: { id: 1, name: "City" },
          },
        ],
        contacts: [
          {
            id: 1,
            firstName: "John",
            lastName: "Doe",
            middleName: "M",
            displayName: "John Doe",
          },
        ],
      });
    });

    it("should return an empty object if no data is provided", async () => {
      const result = await repository.transformResponse(null);

      expect(result).toEqual(null);
    });
  });

  describe("findCompanyByName", () => {
    it("should return a company if it exists", async () => {
      const companyName = "Test Company";
      const mockCompany = { id: 1, companyName: "Test Company" };

      companyRepoMock.findOne.mockResolvedValue(mockCompany as Company);

      const result = await repository.findCompanyByName(companyName);

      expect(companyRepoMock.findOne).toHaveBeenCalledWith({
        where: {
          companyName: ILike(companyName),
        },
      });
      expect(result).toEqual(mockCompany);
    });

    it("should return null if no company is found", async () => {
      const companyName = "Nonexistent Company";

      companyRepoMock.findOne.mockResolvedValue(null);

      const result = await repository.findCompanyByName(companyName);

      expect(companyRepoMock.findOne).toHaveBeenCalledWith({
        where: {
          companyName: ILike(companyName),
        },
      });
      expect(result).toBeNull();
    });

    it("should throw an error if the query fails", async () => {
      const companyName = "Test Company";
      const error = new Error("Database query failed");

      companyRepoMock.findOne.mockRejectedValue(error);

      await expect(repository.findCompanyByName(companyName)).rejects.toThrow(
        "Database query failed"
      );
      expect(companyRepoMock.findOne).toHaveBeenCalledWith({
        where: {
          companyName: ILike(companyName),
        },
      });
    });
  });

  describe("omitFields", () => {
    it("should omit specified fields from the entity", () => {
      const entity = {
        id: 1,
        name: "Test Entity",
        createdAt: "2025-04-28T00:00:00Z",
        updatedAt: "2025-04-28T00:00:00Z",
        deletedAt: null,
        createdBy: 1,
        updatedBy: 2,
      };

      const result = (repository as any).omitFields(entity);

      expect(result).toEqual({
        id: 1,
        name: "Test Entity",
      });
    });

    it("should return an empty object if the entity is null or undefined", () => {
      const resultNull = (repository as any).omitFields(null);
      const resultUndefined = (repository as any).omitFields(undefined);

      expect(resultNull).toEqual({});
      expect(resultUndefined).toEqual({});
    });

    it("should return the entity unchanged if it does not contain the specified fields", () => {
      const entity = {
        id: 1,
        name: "Test Entity",
      };

      const result = (repository as any).omitFields(entity);

      expect(result).toEqual(entity);
    });

    it("should handle an empty object gracefully", () => {
      const entity = {};

      const result = (repository as any).omitFields(entity);

      expect(result).toEqual({});
    });
  });

  describe("getCompanyAnalytics", () => {
    it("should return analytics data for a given company ID", async () => {
      const companyId = 1;
      const mockResult = {
        soCount: "5",
        totalSumInsured: "1000000",
        totalAnnualPremium: "50000",
      };

      opportunityRepoMock
        .createQueryBuilder()
        .getRawOne.mockResolvedValue(mockResult);

      const result = await repository.getCompanyAnalytics(companyId);

      expect(opportunityRepoMock.createQueryBuilder).toHaveBeenCalledWith(
        "opportunity"
      );
      expect(result).toEqual({
        soCount: 5,
        totalSumInsured: 1000000,
        totalAnnualPremium: 50000,
      });
    });
    it("should throw an error if getCompanyAnalytics fails unexpectedly", async () => {
      const companyId = 1;
      const error = new Error("Unexpected error");

      opportunityRepoMock
        .createQueryBuilder()
        .getRawOne.mockRejectedValue(error);

      await expect(repository.getCompanyAnalytics(companyId)).rejects.toThrow(
        "Failed to fetch analytics for company ID 1"
      );
    });
  });

  describe("createCompanyDocMap", () => {
    it("should create and save a company document map", async () => {
      const mockCompanyDocMapData = {
        documentId: 1,
        companyId: 1,
        documentName: "Test Document",
      };

      const mockCompanyDocMap = {
        id: 1,
        ...mockCompanyDocMapData,
      };

      entityManagerMock.create.mockReturnValue(mockCompanyDocMap);
      entityManagerMock.save.mockResolvedValue(mockCompanyDocMap);

      const result = await repository.createCompanyDocMap(
        entityManagerMock,
        mockCompanyDocMapData
      );

      expect(entityManagerMock.create).toHaveBeenCalledWith(
        CompanyDocMap,
        mockCompanyDocMapData
      );
      expect(entityManagerMock.save).toHaveBeenCalledWith(mockCompanyDocMap);
      expect(result).toEqual(mockCompanyDocMap);
    });

    it("should throw an error if company document map creation fails", async () => {
      const mockCompanyDocMapData = {
        documentId: 1,
        companyId: 1,
        documentName: "Test Document",
      };

      const error = new Error("Company document map creation failed");

      entityManagerMock.create.mockReturnValue(mockCompanyDocMapData);
      entityManagerMock.save.mockRejectedValue(error);

      await expect(
        repository.createCompanyDocMap(entityManagerMock, mockCompanyDocMapData)
      ).rejects.toThrow(errorMessages.companyDocCreationFailed);

      expect(entityManagerMock.create).toHaveBeenCalledWith(
        CompanyDocMap,
        mockCompanyDocMapData
      );
      expect(entityManagerMock.save).toHaveBeenCalledWith(
        mockCompanyDocMapData
      );
    });
  });

  describe("updateGstDetail", () => {
    it("should update an existing GST detail and return the updated entity", async () => {
      const gstData = { id: 1, gstNumber: "GST12345" };
      const existingGst = { id: 1, gstNumber: "GST123" };
      const updatedGst = { id: 1, gstNumber: "GST12345" };

      entityManagerMock.findOne.mockResolvedValueOnce(existingGst); // Mock finding the existing GST detail
      entityManagerMock.update.mockResolvedValueOnce(undefined); // Mock the update operation
      entityManagerMock.findOne.mockResolvedValueOnce(updatedGst); // Mock finding the updated GST detail

      const result = await repository.updateGstDetail(
        entityManagerMock,
        gstData
      );

      expect(entityManagerMock.findOne).toHaveBeenCalledWith(StateGstDetail, {
        where: { id: gstData.id },
      });
      expect(entityManagerMock.update).toHaveBeenCalledWith(
        StateGstDetail,
        { id: gstData.id },
        gstData
      );
      expect(entityManagerMock.findOne).toHaveBeenCalledWith(StateGstDetail, {
        where: { id: gstData.id },
      });
      expect(result).toEqual(updatedGst);
    });

    it("should create a new GST detail if it does not exist", async () => {
      const gstData = { gstNumber: "GST12345" };
      const newGst = { id: 1, gstNumber: "GST12345" };

      entityManagerMock.findOne.mockResolvedValueOnce(null); // Mock no existing GST detail
      entityManagerMock.create.mockReturnValueOnce(newGst); // Mock creating a new GST detail
      entityManagerMock.save.mockResolvedValueOnce(newGst); // Mock saving the new GST detail

      const result = await repository.updateGstDetail(
        entityManagerMock,
        gstData
      );

      expect(entityManagerMock.findOne).toHaveBeenCalledWith(StateGstDetail, {
        where: { id: gstData.id },
      });
      expect(entityManagerMock.create).toHaveBeenCalledWith(
        StateGstDetail,
        gstData
      );
      expect(entityManagerMock.save).toHaveBeenCalledWith(newGst);
      expect(result).toEqual(newGst);
    });

    it("should throw a NotFoundException if the updated GST detail is not found", async () => {
      const gstData = { id: 1, gstNumber: "GST12345" };
      const existingGst = { id: 1, gstNumber: "GST123" };

      entityManagerMock.findOne.mockResolvedValueOnce(existingGst); // Mock finding the existing GST detail
      entityManagerMock.update.mockResolvedValueOnce(undefined); // Mock the update operation
      entityManagerMock.findOne.mockResolvedValueOnce(null); // Mock no updated GST detail found

      await expect(
        repository.updateGstDetail(entityManagerMock, gstData)
      ).rejects.toThrow(`GST detail with ID ${gstData.id} not found`);

      expect(entityManagerMock.findOne).toHaveBeenCalledWith(StateGstDetail, {
        where: { id: gstData.id },
      });
      expect(entityManagerMock.update).toHaveBeenCalledWith(
        StateGstDetail,
        { id: gstData.id },
        gstData
      );
      expect(entityManagerMock.findOne).toHaveBeenCalledWith(StateGstDetail, {
        where: { id: gstData.id },
      });
    });

    it("should rethrow any other errors", async () => {
      const gstData = { gstNumber: "GST12345" };
      const error = new Error("Unexpected error");

      entityManagerMock.findOne.mockResolvedValueOnce(null); // Mock no existing GST detail
      entityManagerMock.create.mockReturnValueOnce(gstData); // Mock creating a new GST detail
      entityManagerMock.save.mockRejectedValueOnce(error); // Mock an unexpected error

      await expect(
        repository.updateGstDetail(entityManagerMock, gstData)
      ).rejects.toThrow("Unexpected error");

      expect(entityManagerMock.findOne).toHaveBeenCalledWith(StateGstDetail, {
        where: { id: gstData.id },
      });
      expect(entityManagerMock.create).toHaveBeenCalledWith(
        StateGstDetail,
        gstData
      );
      expect(entityManagerMock.save).toHaveBeenCalledWith(gstData);
    });
  });

  describe("createOrUpdateGroupCompanyMap", () => {
    it("should update an existing group company map if it exists", async () => {
      const groupCompanyMapData = { companyId: 1, groupCompanyId: 2 };
      const existingGroupCompanyMap = {
        id: 1,
        companyId: 1,
        groupCompanyId: 2,
      };
      const updatedGroupCompanyMap = { id: 1, companyId: 1, groupCompanyId: 3 };

      entityManagerMock.findOne
        .mockResolvedValueOnce({ id: 2 }) // Mock groupCompanyExists
        .mockResolvedValueOnce({ id: 1 }) // Mock companyExists
        .mockResolvedValueOnce(existingGroupCompanyMap); // Mock existingGroupCompanyMap
      entityManagerMock.update.mockResolvedValueOnce(undefined); // Mock update operation
      entityManagerMock.findOne.mockResolvedValueOnce(updatedGroupCompanyMap); // Mock updatedGroupCompanyMap

      const result = await repository.createOrUpdateGroupCompanyMap(
        entityManagerMock,
        groupCompanyMapData
      );

      expect(entityManagerMock.findOne).toHaveBeenCalledWith(Company, {
        where: { id: groupCompanyMapData.groupCompanyId },
      });
      expect(entityManagerMock.findOne).toHaveBeenCalledWith(Company, {
        where: { id: groupCompanyMapData.companyId },
      });
      expect(entityManagerMock.findOne).toHaveBeenCalledWith(GroupCompanyMap, {
        where: { companyId: groupCompanyMapData.companyId },
      });
      expect(entityManagerMock.update).toHaveBeenCalledWith(
        GroupCompanyMap,
        { id: existingGroupCompanyMap.id },
        groupCompanyMapData
      );
      expect(result).toEqual(updatedGroupCompanyMap);
    });

    it("should throw a NotFoundException if the group company does not exist", async () => {
      const groupCompanyMapData = { companyId: 1, groupCompanyId: 2 };

      entityManagerMock.findOne
        .mockResolvedValueOnce(null) // Mock groupCompanyExists
        .mockResolvedValueOnce({ id: 1 }); // Mock companyExists

      await expect(
        repository.createOrUpdateGroupCompanyMap(
          entityManagerMock,
          groupCompanyMapData
        )
      ).rejects.toThrow(
        `GroupCompany with ID ${groupCompanyMapData.groupCompanyId} not found`
      );

      expect(entityManagerMock.findOne).toHaveBeenCalledWith(Company, {
        where: { id: groupCompanyMapData.groupCompanyId },
      });
    });

    it("should throw a NotFoundException if the company does not exist", async () => {
      const groupCompanyMapData = { companyId: 1, groupCompanyId: 2 };

      entityManagerMock.findOne
        .mockResolvedValueOnce({ id: 2 }) // Mock groupCompanyExists
        .mockResolvedValueOnce(null); // Mock companyExists

      await expect(
        repository.createOrUpdateGroupCompanyMap(
          entityManagerMock,
          groupCompanyMapData
        )
      ).rejects.toThrow(
        `Company with ID ${groupCompanyMapData.companyId} not found`
      );

      expect(entityManagerMock.findOne).toHaveBeenCalledWith(Company, {
        where: { id: groupCompanyMapData.groupCompanyId },
      });
      expect(entityManagerMock.findOne).toHaveBeenCalledWith(Company, {
        where: { id: groupCompanyMapData.companyId },
      });
    });

    it("should throw an error if an unexpected error occurs", async () => {
      const groupCompanyMapData = { companyId: 1, groupCompanyId: 2 };
      const error = new Error("Unexpected error");

      entityManagerMock.findOne.mockRejectedValueOnce(error); // Mock unexpected error

      await expect(
        repository.createOrUpdateGroupCompanyMap(
          entityManagerMock,
          groupCompanyMapData
        )
      ).rejects.toThrow("Unexpected error");

      expect(entityManagerMock.findOne).toHaveBeenCalledWith(Company, {
        where: { id: groupCompanyMapData.groupCompanyId },
      });
    });
  });

  describe("getCompanyListData", () => {
    const mockFields = ["id", "name"];
    const mockRelations = ["addresses", "contacts"];
    const mockWhereCondition = { isActive: true };
    const mockData = [
      { id: 1, name: "Company A", isActive: true },
      { id: 2, name: "Company B", isActive: true },
    ];

    beforeEach(() => {
      jest
        .spyOn(repository, "transformResponse")
        .mockImplementation((data) => data);
    });

    it("should fetch company list data and transform the response", async () => {
      jest
        .spyOn(entityServiceMock, "getListOfValues")
        .mockResolvedValueOnce(mockData);

      const result = await repository.getCompanyListData(
        mockFields,
        mockRelations,
        mockWhereCondition
      );

      expect(entityServiceMock.getListOfValues).toHaveBeenCalledWith(
        DEFAULT_COMPANY_ENTITY_NAME,
        mockFields,
        mockWhereCondition,
        mockRelations
      );
      expect(repository.transformResponse).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockData);
    });

    it("should return an error if fetching company list data fails", async () => {
      const mockError = new Error("Failed to fetch data");
      jest
        .spyOn(entityServiceMock, "getListOfValues")
        .mockRejectedValueOnce(mockError);

      const result = await repository.getCompanyListData(
        mockFields,
        mockRelations,
        mockWhereCondition
      );

      expect(entityServiceMock.getListOfValues).toHaveBeenCalledWith(
        DEFAULT_COMPANY_ENTITY_NAME,
        mockFields,
        mockWhereCondition,
        mockRelations
      );
      expect(result).toEqual(mockError);
    });
  });

  describe("fetchByCompanyId", () => {
    it("should return a company if it exists", async () => {
      const companyId = 1;
      const mockCompany = { id: 1, name: "Test Company" };

      companyRepoMock.findOne.mockResolvedValue(mockCompany as Company);

      const result = await repository.fetchByCompanyId(companyId);

      expect(companyRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: companyId },
      });
      expect(result).toEqual(mockCompany);
    });

    it("should return null if no company is found", async () => {
      const companyId = 999;

      companyRepoMock.findOne.mockResolvedValue(null);

      const result = await repository.fetchByCompanyId(companyId);

      expect(companyRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: companyId },
      });
      expect(result).toBeNull();
    });

    it("should throw an error if the query fails", async () => {
      const companyId = 1;
      const error = new Error("Database query failed");

      companyRepoMock.findOne.mockRejectedValue(error);

      await expect(repository.fetchByCompanyId(companyId)).rejects.toThrow(
        "Database query failed"
      );
      expect(companyRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: companyId },
      });
    });
  });

  describe("transformCompanyResponse", () => {
    it("should transform company data into the desired format", async () => {
      const mockData = [
        {
          id: 1,
          details: { id: 1, acquisitionHistory: "Positive" },
          companyAddresses: [
            {
              id: 1,
              address: {
                id: 1,
                address1: "123 Street",
                addressType: 1,
              },
            },
          ],
          stateGstDetails: [
            {
              companyId: 1,
              gstNumber: "GST123",
              gstCategory: { id: 1, category: "Standard" },
            },
          ],
          companyDocMaps: [
            {
              companyId: 1,
              documentId: 1,
              documentName: "Doc1",
            },
          ],
          contacts: [
            {
              id: 1,
              firstName: "John",
              lastName: "Doe",
            },
          ],
          priorityLid: 2,
          industrySegmentLid: 3,
          companyTypeLid: 4,
          groupCompanyMaps: [
            {
              groupCompanyId: 1,
              groupCompany: { companyName: "Parent Company" },
            },
          ],
          leadCrmInfo: {
            userId: 1,
            firstName: "Jane",
            lastName: "Smith",
          },
          annualPremium: 10000,
        },
      ];

      const mockAnalytics = {
        soCount: 5,
        totalAnnualPremium: 15000,
        totalSumInsured: 500000,
      };

      jest
        .spyOn(repository, "getCompanyAnalytics")
        .mockResolvedValue(mockAnalytics);

      const result = await repository.transformCompanyResponse(mockData);

      expect(repository.getCompanyAnalytics).toHaveBeenCalledWith(1);
      expect(result).toEqual([
        {
          id: 1,
          details: { id: 1 },
          companyAddresses: [
            {
              id: 1,
              address: {
                id: 1,
                address1: "123 Street",
                addressType: { id: 1 },
              },
            },
          ],
          stateGstDetails: [
            {
              gstNumber: "GST123",
              gstCategory: { id: 1 },
            },
          ],
          companyDocMaps: [
            {
              documentId: 1,
              documentName: "Doc1",
            },
          ],
          contacts: [
            {
              id: 1,
              firstName: "John",
              lastName: "Doe",
            },
          ],
          groupCompanyMap: {
            groupCompanyId: 1,
            groupCompanyName: "Parent Company",
          },
          salesOpportunityCount: 5,
          renewalOpportunityCount: 0,
          policyCount: 0,
          annualPremium: 15000,
          sumInsured: 500000,
          leadCrmInfo: {
            id: 1,
            name: "Jane Smith",
          },
          previousInsurer: "",
          previousTpa: "",
          previousBroker: "",
          salesOpportunityBeyondTheQuarterCount: 0,
          renewalOpportunityBeyondTheQuarterCount: 0,
        },
      ]);
    });

    it("should return an empty array if no data is provided", async () => {
      const result = await repository.transformCompanyResponse([]);

      expect(result).toEqual([]);
    });

    it("should handle errors in getCompanyAnalytics gracefully", async () => {
      const mockData = [
        {
          id: 1,
          details: { id: 1, acquisitionHistory: "Positive" },
          companyAddresses: [],
          stateGstDetails: [],
          companyDocMaps: [],
          contacts: [],
          priorityLid: 2,
          industrySegmentLid: 3,
          companyTypeLid: 4,
          groupCompanyMaps: [],
          leadCrmInfo: {
            userId: 1,
            firstName: "Jane",
            lastName: "Smith",
          },
          annualPremium: 10000,
        },
      ];

      jest
        .spyOn(repository, "getCompanyAnalytics")
        .mockRejectedValue(new Error("Analytics error"));

      const result = await repository.transformCompanyResponse(mockData);

      expect(repository.getCompanyAnalytics).toHaveBeenCalledWith(1);
      expect(result).toEqual([
        {
          id: 1,
          details: { id: 1 },
          companyAddresses: [],
          stateGstDetails: [],
          companyDocMaps: [],
          contacts: [],
          groupCompanyMap: null,
          salesOpportunityCount: 0,
          renewalOpportunityCount: 0,
          policyCount: 0,
          annualPremium: 10000,
          sumInsured: 0,
          leadCrmInfo: {
            id: 1,
            name: "Jane Smith",
          },
          previousInsurer: "",
          previousTpa: "",
          previousBroker: "",
          salesOpportunityBeyondTheQuarterCount: 0,
          renewalOpportunityBeyondTheQuarterCount: 0,
        },
      ]);
    });
  });
  describe("getCompanyKpis", () => {
    let companyRepository: CompanyRepository;
    let lookUpRepository: jest.Mocked<any>;
    let opportunityRepository: jest.Mocked<any>;

    beforeEach(() => {
      lookUpRepository = {
        find: jest.fn(),
      };

      opportunityRepository = {
        createQueryBuilder: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn(),
        })),
      };

      companyRepository = new CompanyRepository(
        null as any, // Mocked dependencies
        lookUpRepository as any,
        opportunityRepository as any,
        null as any,
        null as any,
        null as any,
        null as any,
        null as any
      );
    });

    it("should return KPI counts grouped by stage keys", async () => {
      const userId = 123;
      const searchFilters = [
        { searchBy: "companyName", searchValue: "Test Company" },
      ];

      const mockStageLookUpIds = [
        { lookUpKey: "STAGE_CREATED", id: 1 },
        { lookUpKey: "STAGE_PROSPECT", id: 2 },
      ];

      const mockFilteredCompanies = [{ id: 1 }, { id: 2 }];

      const mockStageCounts = [
        { stageLid: 1, count: "5" },
        { stageLid: 2, count: "3" },
      ];

      lookUpRepository.find.mockResolvedValue(mockStageLookUpIds);

      jest
        .spyOn(
          (companyRepository as any).companyRepository,
          "createQueryBuilder"
        )
        .mockReturnValue({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockFilteredCompanies),
        } as any);

      opportunityRepository
        .createQueryBuilder()
        .getRawMany.mockResolvedValue(mockStageCounts);

      const result = await companyRepository.getCompanyKpis(
        userId,
        searchFilters
      );

      expect(result).toEqual([
        { stageKey: "STAGE_CREATED", count: 5 },
        { stageKey: "STAGE_PROSPECT", count: 3 },
      ]);

      expect(lookUpRepository.find).toHaveBeenCalledWith({
        where: { lookUpKey: In(OPPORTUNITY_STAGES) },
      });

      expect(
        (companyRepository as any).companyRepository.createQueryBuilder
      ).toHaveBeenCalledWith("company");

      expect(opportunityRepository.createQueryBuilder).toHaveBeenCalledWith(
        "opportunity"
      );
      expect(
        opportunityRepository.createQueryBuilder().getRawMany
      ).toHaveBeenCalled();
    });

    it("should return an empty array if no companies match the filters", async () => {
      const userId = 123;
      const searchFilters = [
        { searchBy: "companyName", searchValue: "Nonexistent Company" },
      ];

      lookUpRepository.find.mockResolvedValue([]);

      jest
        .spyOn(companyRepository.companyRepository, "createQueryBuilder")
        .mockReturnValue({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        } as any);

      const result = await companyRepository.getCompanyKpis(
        userId,
        searchFilters
      );

      expect(result).toEqual([]);
      expect(lookUpRepository.find).toHaveBeenCalledWith({
        where: { lookUpKey: In(OPPORTUNITY_STAGES) },
      });
    });

    it("should throw an error if the query fails", async () => {
      const userId = 123;
      const searchFilters = [
        { searchBy: "companyName", searchValue: "Test Company" },
      ];

      lookUpRepository.find.mockRejectedValue(new Error("Lookup query failed"));

      await expect(
        companyRepository.getCompanyKpis(userId, searchFilters)
      ).rejects.toThrow("Lookup query failed");
    });
  });

  describe("CompanyRepository - getCompanies", () => {
    let repository: CompanyRepository;
    let entityServiceMock: jest.Mocked<EntityService>;

    beforeEach(() => {
      entityServiceMock = {
        fetchEntityList: jest.fn(),
      } as unknown as jest.Mocked<EntityService>;

      repository = new CompanyRepository(
        null as any, // Mocked dependencies
        null as any,
        null as any,
        null as any,
        null as any,
        entityServiceMock,
        null as any,
        null as any
      );
    });

    it("should return filtered and paginated company data successfully", async () => {
      const page = 1;
      const limit = 2;
      const search = "test";

      const mockAllData = [
        {
          id: 1,
          companyName: "Test Parent Company",
          groupCompanyMaps: [
            { groupCompany: { id: 2, companyName: "Child Company 1" } },
          ],
        },
        {
          id: 2,
          companyName: "Child Company 1",
          groupCompanyMaps: [],
        },
        {
          id: 3,
          companyName: "Another Parent Company",
          groupCompanyMaps: [],
        },
      ];

      entityServiceMock.fetchEntityList.mockResolvedValue({
        data: mockAllData,
      });

      const result = await repository.getCompanies(page, limit, search);

      expect(entityServiceMock.fetchEntityList).toHaveBeenCalledWith(
        "Company",
        page,
        0,
        [{ field: "companyName", order: "ASC" }],
        ["groupCompanyMaps", "groupCompanyMaps.groupCompany"]
      );
      expect(result).toEqual({
        data: [
          {
            id: 2,
            companyName: "Child Company 1",
            childCompanies: [{ id: 1, companyName: "Test Parent Company" }],
          },
        ],
        count: 1,
      });
    });

    it("should return all companies if no search term is provided", async () => {
      const page = 1;
      const limit = 2;

      const mockAllData = [
        {
          id: 1,
          companyName: "Parent Company",
          groupCompanyMaps: [
            { groupCompany: { id: 2, companyName: "Child Company 1" } },
          ],
        },
        {
          id: 2,
          companyName: "Child Company 1",
          groupCompanyMaps: [],
        },
      ];

      entityServiceMock.fetchEntityList.mockResolvedValue({
        data: mockAllData,
      });

      const result = await repository.getCompanies(page, limit);

      expect(entityServiceMock.fetchEntityList).toHaveBeenCalledWith(
        "Company",
        page,
        0,
        [{ field: "companyName", order: "ASC" }],
        ["groupCompanyMaps", "groupCompanyMaps.groupCompany"]
      );
      expect(result).toEqual({
        data: [
          {
            id: 2,
            companyName: "Child Company 1",
            childCompanies: [{ id: 1, companyName: "Parent Company" }],
          },
        ],
        count: 1,
      });
    });

    it("should handle cases where no companies match the search term", async () => {
      const page = 1;
      const limit = 2;
      const search = "nonexistent";

      const mockAllData = [
        {
          id: 1,
          companyName: "Parent Company",
          groupCompanyMaps: [
            { groupCompany: { id: 2, companyName: "Child Company 1" } },
          ],
        },
        {
          id: 2,
          companyName: "Child Company 1",
          groupCompanyMaps: [],
        },
      ];

      entityServiceMock.fetchEntityList.mockResolvedValue({
        data: mockAllData,
      });

      const result = await repository.getCompanies(page, limit, search);

      expect(result).toEqual({
        data: [],
        count: 0,
      });
    });

    it("should handle errors and throw an exception", async () => {
      entityServiceMock.fetchEntityList.mockRejectedValue(
        new Error("Database error")
      );

      await expect(repository.getCompanies(1, 10)).rejects.toThrow(
        "Failed to fetch company name list"
      );

      expect(entityServiceMock.fetchEntityList).toHaveBeenCalled();
    });
  });
});

describe("findCompaniesByOwnerIds", () => {
  beforeEach(() => {
    companyRepoMock.createQueryBuilder.mockClear();
    companyQueryBuilderMock.select.mockClear();
    companyQueryBuilderMock.where.mockClear();
    companyQueryBuilderMock.orderBy.mockClear();
    companyQueryBuilderMock.addOrderBy.mockClear();
    companyQueryBuilderMock.getRawMany.mockClear();
  });

  it("should return unique companies for given owner ids", async () => {
    companyQueryBuilderMock.getRawMany.mockResolvedValue([
      {
        companyId: 1,
        displayName: "Display A",
        companyName: "Legal A",
      },
      {
        companyId: 2,
        displayName: null,
        companyName: "Legal B",
      },
      {
        companyId: null,
        displayName: "Should skip",
        companyName: "Should skip",
      },
    ]);

    const result = await repository.findCompaniesByOwnerIds([1, 2], 1, 10);

    expect(companyRepoMock.createQueryBuilder).toHaveBeenCalledWith(
      "company"
    );
    expect(companyQueryBuilderMock.select).toHaveBeenCalledWith([
      'company.id AS "companyId"',
      'company.displayName AS "displayName"',
      'company.companyName AS "companyName"',
    ]);
    expect(companyQueryBuilderMock.where).toHaveBeenCalledWith(
      "(company.leadCrm IN (:...userIds) OR (company.leadCrm IS NULL AND company.createdBy IN (:...userIds)))",
      { userIds: [1, 2] }
    );
    expect(companyQueryBuilderMock.orderBy).toHaveBeenCalledWith(
      "COALESCE(company.displayName, company.companyName)",
      "ASC"
    );
    expect(result).toEqual({
      data: [
        {
          companyId: 1,
          companyName: "Display A",
          displayName: "Display A",
        },
        { companyId: 2, companyName: "Legal B", displayName: null },
      ],
      count: 2,
    });
  });

  it("should return empty array when no owner ids provided", async () => {
    const result = await repository.findCompaniesByOwnerIds([], 1, 10);
    expect(result).toEqual({ data: [], count: 0 });
    expect(companyRepoMock.createQueryBuilder).not.toHaveBeenCalled();
  });

  it("should throw internal server error on failure", async () => {
    companyQueryBuilderMock.getRawMany.mockRejectedValue(
      new Error("db error")
    );

    await expect(repository.findCompaniesByOwnerIds([1], 1, 10)).rejects.toThrow(
      InternalServerErrorException
    );
  });
});
