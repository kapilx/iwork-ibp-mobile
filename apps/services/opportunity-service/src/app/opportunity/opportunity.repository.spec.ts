import { Test, TestingModule } from "@nestjs/testing";
import { OpportunityRepository } from "./opportunity.repository";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Opportunity } from "../../../../service-lib/src/lib/entities/opportunity.entity";
import { NotFoundException } from "@nestjs/common";
import { OpportunityClaimExperiences } from "../../../../service-lib/src/lib/entities/opportunity-claim-experience.entity";
import { EntityManager } from "typeorm";
import { FileUpload } from "../file-upload/entities/file-upload.entity";
import { OpportunityDocuments } from "./entities/opportunity-document.entity";

describe.skip("OpportunityRepository", () => {
  let repository: OpportunityRepository;
  let entityService: EntityService;

  const mockEntityService = {
    getData: jest.fn(),
    findOne: jest.fn(),
  };

  const mockOpportunityRepository = {
    find: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunityRepository,
        {
          provide: EntityService,
          useValue: mockEntityService,
        },
        {
          provide: getRepositoryToken(Opportunity),
          useValue: mockOpportunityRepository,
        },
      ],
    }).compile();

    repository = module.get<OpportunityRepository>(OpportunityRepository);
    entityService = module.get<EntityService>(EntityService);
  });

  describe("getAllOpportunities", () => {
    it("should return a list of opportunities with metadata", async () => {
      const mockOpportunities = [
        {
          opportunityId: 1,
          companyId: 1,
          contactId: 1,
          estimatedBrokerage: 1000,
        },
      ];
      const mockResponse = {
        data: mockOpportunities,
        count: 1,
      };

      mockEntityService.getData.mockResolvedValue(mockResponse);

      const result = await repository.getAllOpportunities(
        1,
        10,
        [],
        [],
        "",
        1,
        "",
        undefined,
        undefined,
        "",
        undefined,
        undefined,
        "SO"
      );

      expect(entityService.getData).toHaveBeenCalledWith(
        "Opportunity",
        1,
        10,
        "search",
        "createdAt",
        "ASC",
        {
          opportunityChallenges: true,
          opportunityClaimExperiences: true,
          opportunityCompetitors: true,
          opportunityDocuments: true,
          opportunityRiskLocations: true,
        },
        { createdBy: 1 }
      );
      expect(result).toEqual({
        data: mockOpportunities,
        count: 1,
        opportunityLeads: 0,
        opportunityProspects: 0,
        opportunityQcr: 0,
        opportunityClients: 0,
      });
    });
  });

  describe("getOpportunityById", () => {
    let entityManager: EntityManager;

    beforeEach(() => {
      entityManager = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
      } as unknown as EntityManager;
    });
    it("should return an opportunity by ID", async () => {
      const mockOpportunity = {
        opportunityId: 28,
        companyId: 247,
        contactId: 166,
        estimatedBrokerage: 1000,
      };

      mockOpportunityRepository.findOne.mockResolvedValue(mockOpportunity);

      const result = await repository.getOpportunityById(28);

      expect(mockOpportunityRepository.findOne).toHaveBeenCalledWith({
        where: { opportunityId: 28 },
        relations: [
          "opportunityChallenges",
          "opportunityClaimExperiences",
          "opportunityCompetitors",
          "opportunityDocuments",
          "opportunityRiskLocations",
        ],
      });
      expect(result).toEqual(mockOpportunity);
    });

    it("should throw NotFoundException if the opportunity is not found", async () => {
      mockOpportunityRepository.findOne.mockResolvedValue(null);

      await expect(repository.getOpportunityById(28)).rejects.toThrow(
        new NotFoundException("Opportunity with ID 28 not found")
      );
    });

    it("should throw an error if the database query fails", async () => {
      mockOpportunityRepository.findOne.mockRejectedValue(
        new Error("Database error")
      );

      await expect(repository.getOpportunityById(28)).rejects.toThrow(
        new Error("Database error")
      );
    });

    it("should create a claim experience", async () => {
      const mockClaimExperience = {
        id: 1,
        opportunityId: 30,
        policyFrom: new Date(),
        policyTo: new Date(),
        natureOfLoss: "opportunity claimExperiences",
        premium: 1000,
        claimAmount: 1000,
        claimPercentage: 5,
      };
      jest
        .spyOn(entityManager, "create")
        .mockReturnValue(mockClaimExperience as any);
      jest
        .spyOn(entityManager, "save")
        .mockResolvedValue(mockClaimExperience as any);

      const claimExperienceData = {
        opportunityId: 30,
        policyFrom: new Date(),
        policyTo: new Date(),
        natureOfLoss: "opportunity claimExperiences",
        premium: 1000,
        claimAmount: 1000,
        claimPercentage: 5,
      };
      const result = await repository.createClaimExperience(
        entityManager,
        claimExperienceData
      );

      expect(entityManager.create).toHaveBeenCalledWith(
        OpportunityClaimExperiences,
        claimExperienceData
      );
      expect(entityManager.save).toHaveBeenCalledWith(mockClaimExperience);
      expect(result).toEqual(mockClaimExperience);
    });

    it("should create an opportunity document", async () => {
      const mockDocument = { documentId: 87, opportunityId: 30 };
      const mockFileUpload = { id: 87 };

      jest
        .spyOn(entityManager, "findOne")
        .mockResolvedValue(mockFileUpload as any);
      jest.spyOn(entityManager, "create").mockReturnValue(mockDocument as any);
      jest.spyOn(entityManager, "save").mockResolvedValue(mockDocument as any);

      const oppDocumentData = { documentId: 87, opportunityId: 30 };
      const result = await repository.createOppDocument(
        entityManager,
        oppDocumentData
      );

      expect(entityManager.findOne).toHaveBeenCalledWith(expect.anything(), {
        where: { id: 87 },
      });
      expect(entityManager.create).toHaveBeenCalledWith(expect.anything(), {
        ...oppDocumentData,
        document: mockFileUpload,
      });
      expect(entityManager.save).toHaveBeenCalledWith(mockDocument);
      expect(result).toEqual(mockDocument);
    });

    it("should create a competitor", async () => {
      const mockCompetitor = { opportunityCompetitorId: 1, opportunityId: 30 };

      jest
        .spyOn(entityManager, "create")
        .mockReturnValue(mockCompetitor as any);
      jest
        .spyOn(entityManager, "save")
        .mockResolvedValue(mockCompetitor as any);

      const competitorData = { opportunityId: 30, competitor: "TPA" };
      const result = await repository.createCompetitor(
        entityManager,
        competitorData
      );

      expect(entityManager.create).toHaveBeenCalledWith(
        expect.anything(),
        competitorData
      );
      expect(entityManager.save).toHaveBeenCalledWith(mockCompetitor);
      expect(result).toEqual(mockCompetitor);
    });

    it("should create a challenge", async () => {
      const mockChallenge = { oppChallengeId: 1, opportunityId: 30 };

      jest.spyOn(entityManager, "create").mockReturnValue(mockChallenge as any);
      jest.spyOn(entityManager, "save").mockResolvedValue(mockChallenge as any);

      const challengeData = {
        opportunityId: 30,
        description: "Challenge description",
      };
      const result = await repository.createChallenge(
        entityManager,
        challengeData
      );

      expect(entityManager.create).toHaveBeenCalledWith(
        expect.anything(),
        challengeData
      );
      expect(entityManager.save).toHaveBeenCalledWith(mockChallenge);
      expect(result).toEqual(mockChallenge);
    });
  });

  it("should create an opportunity document", async () => {
    const entityManager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as EntityManager;

    const mockDocument = { documentId: 87, opportunityId: 30 };
    const mockFileUpload = { id: 87 }; // Mocked document from the FileUpload table

    jest
      .spyOn(entityManager, "findOne")
      .mockResolvedValue(mockFileUpload as any); // Mock the findOne method to return a valid document
    jest.spyOn(entityManager, "create").mockReturnValue(mockDocument as any);
    jest.spyOn(entityManager, "save").mockResolvedValue(mockDocument as any);

    const oppDocumentData = { documentId: 87, opportunityId: 30 };
    const result = await repository.createOppDocument(
      entityManager,
      oppDocumentData
    );

    expect(entityManager.findOne).toHaveBeenCalledWith(FileUpload, {
      where: { id: 87 },
    });
    expect(entityManager.create).toHaveBeenCalledWith(OpportunityDocuments, {
      ...oppDocumentData,
      document: mockFileUpload,
    });
    expect(entityManager.save).toHaveBeenCalledWith(mockDocument);
    expect(result).toEqual(mockDocument);
  });
  it("should throw an error if opportunity is not found", async () => {
    const entityManager = {
      findOne: jest.fn(),
      update: jest.fn(),
    } as unknown as EntityManager;
    jest.spyOn(entityManager, "findOne").mockResolvedValue(null);

    await expect(
      repository.updateOpportunity(entityManager, 28, {})
    ).rejects.toThrow("Opportunity with id 28 not found");
  });
});

describe('placement slip repository methods', () => {
  it('should create placement slip', async () => {
    const repo = new OpportunityRepository(
      mockOpportunityRepository as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      {} as any
    );
    (repo as any).placementRepo = { create: jest.fn().mockReturnValue({}), save: jest.fn().mockResolvedValue({ id: 1 }) } as any;
    (repo as any).tpaRepo = { save: jest.fn() } as any;
    (repo as any).insurerRepo = { save: jest.fn() } as any;
    (repo as any).sharingRepo = { save: jest.fn() } as any;
    (repo as any).cdRepo = { save: jest.fn() } as any;
    (repo as any).coverRepo = { save: jest.fn() } as any;

    const result = await repo.createPlacementSlip({});
    expect(result).toEqual({ id: 1 });
  });
});
