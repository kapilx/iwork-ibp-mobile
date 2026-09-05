import { Test, TestingModule } from "@nestjs/testing";
import { OpportunityService } from "./opportunity.service";
import { OpportunityRepository } from "./opportunity.repository";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { OpportunityDto } from "./dto/opportunity.dto";
import { DataSource } from "typeorm";
import { AddressService } from "../address/address.service"; // Import AddressService

describe.skip("OpportunityService", () => {
  let service: OpportunityService;
  let repository: OpportunityRepository;

  const mockOpportunityRepository = {
    getOpportunityById: jest.fn(),
    getAllOpportunities: jest.fn(),
    createOpportunity: jest.fn(), // Add this mock method
    createRiskLocation: jest.fn(), // Add this mock method
    createClaimExperience: jest.fn(), // Add this mock method
    createOppDocument: jest.fn(), // Add this mock method
    createCompetitor: jest.fn(), // Add this mock method
    createChallenge: jest.fn(), // Add this mock method
    updateOpportunity: jest.fn(), // Add this mock method
    getRiskLocationByAddressIdAndOpportunityId: jest.fn(),
    createPlacementSlip: jest.fn(),
    updatePlacementSlip: jest.fn(),
    getPlacementSlip: jest.fn(),
    getPlacementSlipData: jest.fn(),
    softDeletePlacementSlip: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((callback) => callback({})),
  };

  const mockAddressService = {
    addAddress: jest.fn().mockResolvedValue({ id: 1 }), // Return a mock object with an id
    updateAddressById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunityService,
        {
          provide: OpportunityRepository,
          useValue: mockOpportunityRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: AddressService,
          useValue: mockAddressService, // Mock AddressService
        },
      ],
    }).compile();

    service = module.get<OpportunityService>(OpportunityService);
    repository = module.get<OpportunityRepository>(OpportunityRepository);
  });

  describe("getAllOpportunityList", () => {
    const mockOpportunities = {
      data: [
        {
          opportunityId: 1,
          companyId: 1,
          contactId: 1,
          estimatedBrokerage: 1000,
          policyTypeLid: 101,
          policyStatusLid: 201,
          serviceLevelLid: 301,
          expiryDate: new Date("2023-12-31"),
          sumInsured: 1000000,
          premiumPaid: 50000,
          stageLid: 401,
          referredBy: "John Doe",
          sharingPercentage: 10,
          estimatedFee: 5000,
          prevInsurerId: 501,
          prevInsurerLocationId: 601,
          prevInsurerBranchId: 701,
          prevTpaId: 801,
          prevTpaLocationId: 901,
          prevTpaBranchId: 1001,
          remarks: "Remarks about the opportunity",
        },
      ],
      count: 1,
      opportunityLeads: 0,
      opportunityProspects: 0,
      opportunityQcr: 0,
      opportunityClients: 0,
    };

    it("should return a list of opportunities", async () => {
      const page = 1;
      const limit = 10;
      const search = "Tech Solutions";
      const sortBy: keyof OpportunityDto = "createdAt";
      const sortOrder: "ASC" | "DESC" = "ASC";
      const userId = 1;

      mockOpportunityRepository.getAllOpportunities.mockResolvedValue(
        mockOpportunities
      );

      const result = await service.getAllOpportunityList(
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        userId
      );

      expect(repository.getAllOpportunities).toHaveBeenCalledWith(
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        userId
      );
      expect(result).toEqual(mockOpportunities);
    });

    it("should throw NotFoundException if no opportunities are found", async () => {
      const page = 1;
      const limit = 10;
      const search = "Nonexistent";
      const sortBy: keyof OpportunityDto = "createdAt";
      const sortOrder: "ASC" | "DESC" = "ASC";
      const userId = 1;

      mockOpportunityRepository.getAllOpportunities.mockRejectedValue(
        new NotFoundException("No opportunities found")
      );

      await expect(
        service.getAllOpportunityList(
          page,
          limit,
          search,
          sortBy,
          sortOrder,
          userId
        )
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if an error occurs", async () => {
      const page = 1;
      const limit = 10;
      const search = "Error";
      const sortBy: keyof OpportunityDto = "createdAt";
      const sortOrder: "ASC" | "DESC" = "ASC";
      const userId = 1;

      mockOpportunityRepository.getAllOpportunities.mockRejectedValue(
        new Error()
      );

      await expect(
        service.getAllOpportunityList(
          page,
          limit,
          search,
          sortBy,
          sortOrder,
          userId
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getOpportunityById", () => {
    it("should return an opportunity by ID", async () => {
      const mockOpportunity: OpportunityDto = {
        opportunityId: 28,
        companyId: 247,
        contactId: 166,
        estimatedBrokerage: 1000,
      } as OpportunityDto;

      mockOpportunityRepository.getOpportunityById.mockResolvedValue(
        mockOpportunity
      );

      const result = await service.getOpportunityById(28);

      expect(repository.getOpportunityById).toHaveBeenCalledWith(28);
      expect(result).toEqual(mockOpportunity);
    });

    it("should throw NotFoundException if the opportunity is not found", async () => {
      mockOpportunityRepository.getOpportunityById.mockResolvedValue(null);

      await expect(service.getOpportunityById(28)).rejects.toThrow(
        new NotFoundException("Opportunity ID not found")
      );
    });

    it("should throw BadRequestException if an error occurs", async () => {
      mockOpportunityRepository.getOpportunityById.mockRejectedValue(
        new Error("Database error")
      );

      await expect(service.getOpportunityById(28)).rejects.toThrow(
        new BadRequestException("Database error")
      );
    });
  });

  it("should create an opportunity with related entities", async () => {
    const mockOpportunity = {
      opportunityId: 30,
      companyId: 247,
      policyTypeLid: 9,
      policyStatusLid: 9,
      serviceLevelLid: 9,
      expiryDate: new Date(),
      sumInsured: 1000,
      premiumPaid: 1000,
      stageLid: 5,
    };
    const mockRiskLocation = { addressId: 1 };
    const mockClaimExperience = { id: 1 };
    const mockDocument = { documentId: 87 };
    const mockCompetitor = { opportunityCompetitorId: 1 };
    const mockChallenge = { oppChallengeId: 1 };

    jest
      .spyOn(repository, "createOpportunity")
      .mockResolvedValue(mockOpportunity as any);
    jest
      .spyOn(repository, "createRiskLocation")
      .mockResolvedValue(mockRiskLocation as any);
    jest
      .spyOn(repository, "createClaimExperience")
      .mockResolvedValue(mockClaimExperience as any);
    jest
      .spyOn(repository, "createOppDocument")
      .mockResolvedValue(mockDocument as any);
    jest
      .spyOn(repository, "createCompetitor")
      .mockResolvedValue(mockCompetitor as any);
    jest
      .spyOn(repository, "createChallenge")
      .mockResolvedValue(mockChallenge as any);

    const createOpportunityDto = {
      companyId: 247,
      contactId: 166,
      policyTypeLid: 9,
      policyStatusLid: 9,
      serviceLevelLid: 9,
      expiryDate: "2025-12-31",
      sumInsured: 1000,
      premiumPaid: 1000,
      stageLid: 5,
      referredBy: "John Doe",
      sharingPercentage: 10,
      estimatedBrokerage: 1000,
      estimatedFee: 5000,
      prevInsurerId: 501,
      prevInsurerLocationId: 601,
      prevInsurerBranchId: 701,
      prevTpaId: 801,
      prevTpaLocationId: 901,
      prevTpaBranchId: 1001,
      remarks: "Remarks about the opportunity",
    };
    const riskLocations = [
      {
        addressTypeLid: 1,
        address1: "123 Main St",
        countryId: 1,
        stateId: 1,
        cityId: 1,
        pinCode: "10001",
        phoneNumber: "1234567890",
      },
    ];
    const claimExperiences = [
      {
        id: 1,
        opportunityId: 30,
        policyFrom: new Date(),
        policyTo: new Date(),
        natureOfLoss: "opportunity claimExperiences",
        premium: 1000,
        claimAmount: 1000,
        claimPercentage: 5,
      },
    ];
    const documents = [
      { opportunityDocumentId: 1, opportunityId: 30, documentId: 87 },
    ];
    const competitors = [
      {
        competitor: "TPA",
        opportunityCompetitorId: 1,
        opportunityId: 30,
        competitorId: 11,
        competitorBranchId: 101,
      },
    ];
    const challenges = [
      {
        oppChallengeId: 1,
        opportunityId: 30,
        description: "opportunity challenges",
        mitigationTypeLid: 1,
        mitigationDescription: "opportunity challenges",
      },
    ];

    const result = await service.createOpportunity(
      createOpportunityDto,
      riskLocations,
      claimExperiences,
      documents,
      competitors,
      challenges
    );

    expect(repository.createOpportunity).toHaveBeenCalledWith(
      expect.any(Object),
      createOpportunityDto
    );
    expect(repository.createRiskLocation).toHaveBeenCalledTimes(
      riskLocations.length
    );
    expect(repository.createClaimExperience).toHaveBeenCalledTimes(
      claimExperiences.length
    );
    expect(repository.createOppDocument).toHaveBeenCalledTimes(
      documents.length
    );
    expect(repository.createCompetitor).toHaveBeenCalledTimes(
      competitors.length
    );
    expect(repository.createChallenge).toHaveBeenCalledTimes(challenges.length);
    expect(result).toEqual(mockOpportunity);
  });

  it("should update an opportunity successfully", async () => {
    const mockDto = {
      opportunity: { companyId: 247, contactId: 166 },
      riskLocations: [
        {
          id: 480,
          address1: "123 Main St",
          addressTypeLid: 1,
          pinCode: "10001",
          phoneNumber: "1234567890",
          countryId: 1,
          stateId: 1,
          cityId: 1,
        },
      ],
      claimExperiences: [{ id: 20 }],
    };
    const mockResult = { opportunityId: 28, companyId: 247 };

    mockDataSource.transaction.mockImplementation(async (callback) =>
      callback({
        update: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
      })
    );
    mockOpportunityRepository.updateOpportunity.mockResolvedValue(mockResult);
    mockOpportunityRepository.getRiskLocationByAddressIdAndOpportunityId.mockResolvedValue(
      null // Simulate no existing risk location
    );

    const result = await service.updateOpportunityById(
      28,
      mockDto.opportunity,
      mockDto.riskLocations,
      mockDto.claimExperiences,
      [],
      [],
      [],
      1
    );

    expect(result).toEqual(mockResult);
    expect(repository.updateOpportunity).toHaveBeenCalledWith(
      expect.any(Object),
      28,
      mockDto.opportunity
    );
    expect(
      mockOpportunityRepository.getRiskLocationByAddressIdAndOpportunityId
    ).toHaveBeenCalledWith(480, 28); // Ensure the method is called with correct arguments
  });

  it("should throw an error if update fails", async () => {
    mockDataSource.transaction.mockImplementation(async (callback) =>
      callback({
        update: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
      })
    );

    mockOpportunityRepository.updateOpportunity.mockRejectedValue(
      new Error("Update failed")
    );

    await expect(
      service.updateOpportunityById(28, {}, [], [], [], [], [], 1)
    ).rejects.toThrow("Update failed");
  });
});

describe("Placement Slip functions", () => {
  it("should create placement slip via repository", async () => {
    const dto: any = { name: "pslip" };
    mockOpportunityRepository.createPlacementSlip.mockResolvedValue(dto);
    const result = await service.createPlacementSlip(dto);
    expect(repository.createPlacementSlip).toHaveBeenCalledWith(dto);
    expect(result).toBe(dto);
  });

  it("should update placement slip via repository", async () => {
    const dto: any = { name: "pslip" };
    mockOpportunityRepository.updatePlacementSlip.mockResolvedValue(dto);
    const result = await service.updatePlacementSlip(1, dto);
    expect(repository.updatePlacementSlip).toHaveBeenCalledWith(1, dto);
    expect(result).toBe(dto);
  });

  it("should return placement slip via repository", async () => {
    const data: any = { id: 1 };
    mockOpportunityRepository.getPlacementSlip.mockResolvedValue(data);
    const result = await service.getPlacementSlip(1);
    expect(repository.getPlacementSlip).toHaveBeenCalledWith(1);
    expect(result).toBe(data);
  });

  it("should soft delete placement slip via repository", async () => {
    mockOpportunityRepository.softDeletePlacementSlip.mockResolvedValue(
      undefined
    );
    await service.softDeletePlacementSlip(1);
    expect(repository.softDeletePlacementSlip).toHaveBeenCalledWith(1);
  });

  it("should update placement slip by activity id", async () => {
    const dto: any = { policyDetails: { sumInsured: 5000 } };
    const placement = { id: 1, opportunityActivityId: 10 } as any;
    const formatted = { id: 1 } as any;
    mockOpportunityRepository.getPlacementSlipData.mockResolvedValue(placement);
    const updateSpy = jest
      .spyOn(service, "updatePlacementSlip")
      .mockResolvedValue(placement);
    const getSpy = jest
      .spyOn(service, "getPlacementSlipActivity")
      .mockResolvedValue(formatted);
    const result = await service.updatePlacementSlipByActivityId(10, dto, 1);
    expect(updateSpy).toHaveBeenCalledWith(placement.id, {
      policyDetails: { sumInsured: 5000 },
      updatedBy: 1,
    });
    expect(getSpy).toHaveBeenCalledWith(10);
    expect(result).toBe(formatted);
  });
});
