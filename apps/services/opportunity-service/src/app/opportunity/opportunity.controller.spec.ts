import { Test, TestingModule } from "@nestjs/testing";
import { OpportunityController } from "./opportunity.controller";
import { OpportunityService } from "./opportunity.service";
import { AuthGuard } from "../../../../../services/auth-service/src/guards/auth.guard";
import { RolesGuard } from "../../../../../services/auth-service/src/guards/role.guard";
import { GetOpportunityQueryDto } from "./dto/opportunity-query-param.dto";
import { OpportunityDto } from "./dto/opportunity.dto";
import { Response } from "express";
import { HttpStatus, NotFoundException } from "@nestjs/common";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
import { OpportunityClaimExperienceDto } from "./dto/opportunity-claim-experience.dto";
import { OpportunityDocumentDto } from "./dto/opportunity-document.dto";
import { OpportunityCompetitorDto } from "./dto/opportunity-competitor.dto";
import { OpportunityChallengeDto } from "./dto/opportunity-challenges.dto";
import { CreateAddressDto } from "../../../../org-service/src/app/address/dto/create-address.dto";
import { UpdateAddressDto } from "../../../../org-service/src/app/address/dto/update-address.dto";

describe("OpportunityController", () => {
  let controller: OpportunityController;
  let service: OpportunityService;

  const mockOpportunityService = {
    getAllOpportunityList: jest.fn(),
    getOpportunityById: jest.fn(),
    createOpportunity: jest.fn(),
    updateOpportunityById: jest.fn(),
    getQuoteByBrokingSlipAndActivity: jest.fn(),
    createPlacementSlip: jest.fn(),
    updatePlacementSlip: jest.fn(),
    softDeletePlacementSlip: jest.fn(),
    getPlacementSlip: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpportunityController],
      providers: [
        {
          provide: OpportunityService,
          useValue: mockOpportunityService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<OpportunityController>(OpportunityController);
    service = module.get<OpportunityService>(OpportunityService);
  });

  describe("getAllOpportunityList", () => {
    it("should return a list of opportunities", async () => {
      const mockQuery: GetOpportunityQueryDto = {
        page: 1,
        limit: 10,
        search: "Tech Solutions",
        sort: "createdAt:ASC",
      };
      const mockReq: { user: { userDetails: { userId: number } } } = {
        user: { userDetails: { userId: 1 } },
      };
      const mockRes = mockResponse();
      const mockOpportunities: OpportunityDto[] = [
        {
          opportunityId: 1,
          companyId: 1,
          contactId: 1,
          estimatedBrokerage: 1000,
        } as OpportunityDto,
      ];

      mockOpportunityService.getAllOpportunityList.mockResolvedValue({
        data: mockOpportunities,
        count: 1,
        opportunityLeads: 0,
        opportunityProspects: 0,
        opportunityQcr: 0,
        opportunityClients: 0,
      });

      await controller.getAllOpportunityList(mockQuery, mockRes, mockReq);

      expect(mockOpportunityService.getAllOpportunityList).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        statusCode: 200,
        message: "Opportunities retrieved successfully",
        data: {
          data: mockOpportunities,
          count: 1,
          opportunityLeads: 0,
          opportunityProspects: 0,
          opportunityQcr: 0,
          opportunityClients: 0,
        },
      });
    });
  });

  describe("getOpportunityById", () => {
    it("should return an opportunity by ID", async () => {
      const mockOpportunity: OpportunityDto = {
        opportunityId: 28,
        companyId: 247,
        contactId: 166,
        estimatedBrokerage: 1000,
        policyTypeLid: 9,
        policyStatusLid: 9,
        serviceLevelLid: 9,
        expiryDate: new Date("2025-10-31"),
        sumInsured: 1000,
        premiumPaid: 1000,
        stageLid: 5,
        referredBy: "John Doe",
        sharingPercentage: 10,
        remarks: "Test remarks",
        opportunityChallenges: [],
        opportunityClaimExperiences: [],
        opportunityCompetitors: [],
        opportunityDocuments: [],
        opportunityRiskLocations: [],
      };

      mockOpportunityService.getOpportunityById.mockResolvedValue(
        mockOpportunity
      );

      const result = await controller.getOpportunityById(28, {
        user: { userDetails: { userId: 1 } },
      } as any);

      expect(service.getOpportunityById).toHaveBeenCalledWith(28);
      expect(result).toEqual({
        statusCode: 200,
        message: "Opportunity details retrieved successfully",
        data: mockOpportunity,
      });
    });

    it("should return a 404 error if the opportunity is not found", async () => {
      mockOpportunityService.getOpportunityById.mockRejectedValue(
        new NotFoundException("Opportunity not found")
      );

      const result = await controller.getOpportunityById(28, {
        user: { userDetails: { userId: 1 } },
      } as any);

      expect(service.getOpportunityById).toHaveBeenCalledWith(28);
      expect(result).toEqual({
        statusCode: 404,
        message: "Opportunity not found",
        data: {}, // Include an empty data object if this is the expected behavior
      });
    });
  });

  it("should create an opportunity and return success response", async () => {
    const mockRequest = {
      user: { userDetails: { userId: 1 } },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockOpportunity = {
      opportunityId: 30,
      companyId: 247,
      contactId: 166,
      estimatedBrokerage: 1000,
      policyTypeLid: 9,
      policyStatusLid: 9,
      serviceLevelLid: 9,
      expiryDate: "2025-12-31",
      sumInsured: 1000,
      premiumPaid: 1000,
      stageLid: 5,
    };

    jest.spyOn(service, "createOpportunity").mockResolvedValue(mockOpportunity);

    const createOpportunityDto = new CreateOpportunityDto();
    createOpportunityDto.companyId = 247;
    createOpportunityDto.contactId = 166;
    createOpportunityDto.estimatedBrokerage = 1000;
    createOpportunityDto.policyTypeLid = 9;
    createOpportunityDto.policyStatusLid = 9;
    createOpportunityDto.serviceLevelLid = 9;
    createOpportunityDto.expiryDate = "2025-12-31";
    createOpportunityDto.sumInsured = 1000;
    createOpportunityDto.premiumPaid = 1000;
    createOpportunityDto.stageLid = 5;
    createOpportunityDto.referredBy = "John Doe";
    createOpportunityDto.sharingPercentage = 10;
    createOpportunityDto.remarks = "Test remarks";
    createOpportunityDto.prevInsurerId = 1;
    createOpportunityDto.prevInsurerLocationId = 1;
    createOpportunityDto.prevInsurerBranchId = 1;
    createOpportunityDto.prevTpaId = 1;
    createOpportunityDto.prevTpaLocationId = 1;
    createOpportunityDto.prevTpaBranchId = 1;
    createOpportunityDto.estimatedFee = 5000;

    const riskLocations: CreateAddressDto[] = [
      {
        addressTypeLid: 1,
        address1: "123 Main St",
        countryId: 1,
        stateId: 1,
        cityId: 1,
        pinCode: "12345",
        phoneNumber: "1234567890",
      },
    ];

    const claimExperiences: OpportunityClaimExperienceDto[] = [
      {
        policyFrom: new Date("2023-01-01"),
        policyTo: new Date("2023-12-31"),
        natureOfLoss: "Fire",
        premium: 1000,
        claimAmount: 5000,
        claimPercentage: 20,
      },
    ];

    const documents: OpportunityDocumentDto[] = [{ documentId: 102 }];

    const competitors: OpportunityCompetitorDto[] = [
      {
        competitor: "Competitor A",
        competitorId: 201,
        competitorBranchId: 301,
      },
    ];

    const challenges: OpportunityChallengeDto[] = [
      {
        challengeTypeLid: 270,
        description: "This is a sample challenge description.",
        mitigationTypeLid: 272,
        mitigationDescription: "This is a sample mitigation description.",
      },
    ];

    await controller.createOpportunity(
      createOpportunityDto,
      riskLocations,
      claimExperiences,
      documents,
      competitors,
      challenges,
      mockRequest as { user: { userDetails: { userId: number } } }
    );

    expect(service.createOpportunity).toHaveBeenCalledWith(
      createOpportunityDto,
      riskLocations,
      claimExperiences,
      documents,
      competitors,
      challenges
    );
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CREATED,
      message: "Opportunity created successfully",
      data: mockOpportunity,
    });
  });

  it("should return an error response if service throws an error", async () => {
    const mockRequest = {
      user: { userDetails: { userId: 1 } },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const createOpportunityDto = new CreateOpportunityDto();
    createOpportunityDto.companyId = 247;
    createOpportunityDto.contactId = 166;
    createOpportunityDto.estimatedBrokerage = 1000;
    createOpportunityDto.policyTypeLid = 9;
    createOpportunityDto.policyStatusLid = 9;
    createOpportunityDto.serviceLevelLid = 9;
    createOpportunityDto.expiryDate = "2025-12-31";
    createOpportunityDto.sumInsured = 1000;
    createOpportunityDto.premiumPaid = 1000;
    createOpportunityDto.stageLid = 5;

    const riskLocations: CreateAddressDto[] = [];
    const claimExperiences: OpportunityClaimExperienceDto[] = [];
    const documents: OpportunityDocumentDto[] = [];
    const competitors: OpportunityCompetitorDto[] = [];
    const challenges: OpportunityChallengeDto[] = [];

    // Simulate an error thrown by the service
    jest
      .spyOn(service, "createOpportunity")
      .mockRejectedValue(new Error("Service error"));

    await controller.createOpportunity(
      createOpportunityDto,
      riskLocations,
      claimExperiences,
      documents,
      competitors,
      challenges,
      mockRequest as { user: { userDetails: { userId: number } } }
    );

    // Verify that the error response is returned
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: "Service error",
      data: {}, // Include an empty data object if this is the expected behavior
    });
  });
  it("should update an opportunity and return success response", async () => {
    const mockRequest = { user: { userDetails: { userId: 1 } } } as any;
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockOpportunity = { opportunityId: 1 };

    const updateOpportunityDto = {
      opportunity: {
        companyId: 247,
        contactId: 166,
        estimatedBrokerage: 1000,
        policyTypeLid: 9,
        policyStatusLid: 9,
        serviceLevelLid: 9,
        expiryDate: "2025-10-31",
        sumInsured: 1000,
        premiumPaid: 1000,
        stageLid: 5,
      },
      riskLocations: [
        {
          id: 480,
          addressTypeLid: 1,
          address1: "123 Main St 2",
          area: "Downtown updated",
          stateId: 1,
          countryId: 1,
          cityId: 1,
          pinCode: "10001",
          email: "headoffice@example.com",
          phoneNumber: "1234567890",
        },
      ],
      claimExperiences: [
        {
          id: 20,
          policyFrom: "2025-12-21",
          policyTo: "2025-12-31",
          natureOfLoss: "opportunity claimExperiences updated",
          premium: 1000,
          claimAmount: 1000,
          claimPercentage: 5,
        },
      ],
      documents: [
        {
          documentId: 89,
        },
      ],
      competitors: [
        {
          opportunityCompetitorId: 10,
          competitor: "TPA",
          competitorId: 25,
          competitorBranchId: 101,
        },
      ],
      challenges: [
        {
          id: 10,
          challengeTypeLid: 10,
          description: "opportunity challenges updated",
          mitigationTypeLid: 10,
          mitigationDescription: "opportunity challenges",
        },
      ],
    };

    mockOpportunityService.updateOpportunityById.mockResolvedValue(
      mockOpportunity
    );

    await controller.updateOpportunityById(
      mockResponse,
      1,
      updateOpportunityDto.opportunity,
      updateOpportunityDto.riskLocations,
      updateOpportunityDto.claimExperiences,
      updateOpportunityDto.documents,
      updateOpportunityDto.competitors,
      updateOpportunityDto.challenges,
      mockRequest
    );

    expect(service.updateOpportunityById).toHaveBeenCalledWith(
      1,
      updateOpportunityDto.opportunity,
      updateOpportunityDto.riskLocations,
      updateOpportunityDto.claimExperiences,
      updateOpportunityDto.documents,
      updateOpportunityDto.competitors,
      updateOpportunityDto.challenges,
      1
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 200,
      message: "Opportunity updated successfully",
      data: mockOpportunity,
    });
  });

  it("should return an error response if service throws an error", async () => {
    const mockReq = { user: { userDetails: { userId: 1 } } } as any;
    const mockRes = mockResponse();
    const mockDto = {
      opportunity: { companyId: 247, contactId: 166 },
    };

    mockOpportunityService.updateOpportunityById.mockRejectedValue(
      new Error("Update failed")
    );

    await controller.updateOpportunityById(
      mockRes,
      28,
      mockDto.opportunity,
      [],
      [],
      [],
      [],
      [],
      mockReq
    );

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: "Update failed",
      data: {}, // Ensure an empty data object is included in the response
    });
  });

  it("should return a 400 error response if invalid data is provided", async () => {
    const mockReq = { user: { userDetails: { userId: 1 } } } as any;
    const mockRes = mockResponse();
    const mockDto = {
      opportunity: null, // Invalid data
    };

    mockOpportunityService.updateOpportunityById.mockRejectedValue(
      new Error("Invalid data provided")
    );

    await controller.updateOpportunityById(
      mockRes,
      28,
      mockDto.opportunity,
      [],
      [],
      [],
      [],
      [],
      mockReq
    );

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: "Invalid data provided",
      data: {}, // Include an empty data object
    });
  });

  describe("updateQuote", () => {
    it("should update a quote and return success response", async () => {
      const mockRequest = { user: { userDetails: { userId: 1 } } } as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockQuote = { quoteId: 1, insurerId: 101, netPremium: 5000 };

      const updateQuoteDto = {
        opportunityId: 247,
        brokingSlipId: 123,
        insurerId: 101,
        quoteReceivedOn: "2025-10-31",
        basicPremium: 4000,
        terrorismCover: 500,
        tax: 18,
        taxValue: 900,
        netPremium: 5000,
        brokeragePercent: 10,
        insurerRemarks: "Updated remarks",
        attachmentUrl: "http://example.com/updated-quote.pdf",
        statusId: 2,
        documents: [{ documentId: 201 }],
      };

      jest.spyOn(service, "updateQuote").mockResolvedValue(mockQuote);

      await controller.updateQuote(
        1, // quoteId
        updateQuoteDto,
        mockRequest,
        mockResponse
      );

      expect(service.updateQuote).toHaveBeenCalledWith(
        1, // quoteId
        updateQuoteDto,
        1 // userId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.OK,
        message: "Quote updated successfully.",
        data: mockQuote,
      });
    });

    it("should return a 404 error if the quote is not found", async () => {
      const mockRequest = { user: { userDetails: { userId: 1 } } } as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const updateQuoteDto = {
        opportunityId: 247,
        brokingSlipId: 123,
        insurerId: 101,
        quoteReceivedOn: "2025-10-31",
        basicPremium: 4000,
        terrorismCover: 500,
        tax: 18,
        taxValue: 900,
        netPremium: 5000,
        brokeragePercent: 10,
        insurerRemarks: "Updated remarks",
        attachmentUrl: "http://example.com/updated-quote.pdf",
        statusId: 2,
        documents: [{ documentId: 201 }],
      };

      jest
        .spyOn(service, "updateQuote")
        .mockRejectedValue(new NotFoundException("Quote not found"));

      await controller.updateQuote(
        1, // quoteId
        updateQuoteDto,
        mockRequest,
        mockResponse
      );

      expect(service.updateQuote).toHaveBeenCalledWith(
        1, // quoteId
        updateQuoteDto,
        1 // userId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Quote not found",
      });
    });

    it("should return a 400 error if invalid data is provided", async () => {
      const mockRequest = { user: { userDetails: { userId: 1 } } } as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const updateQuoteDto = {
        opportunityId: null, // Invalid data
      };

      jest
        .spyOn(service, "updateQuote")
        .mockRejectedValue(new Error("Invalid data provided"));

      await controller.updateQuote(
        1, // quoteId
        updateQuoteDto,
        mockRequest,
        mockResponse
      );

      expect(service.updateQuote).toHaveBeenCalledWith(
        1, // quoteId
        updateQuoteDto,
        1 // userId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Invalid data provided",
      });
    });
  });

  describe("updateOpportunityQuoteByActivityId", () => {
    it("should update opportunity quote by activity id", async () => {
      const mockRequest = { headers: { userid: "1" } } as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const updateDto = { opportunityId: 1 } as any;
      jest
        .spyOn(service, "updateOpportunityQuoteByActivityId")
        .mockResolvedValue(1 as any);

      await controller.updateOpportunityQuoteByActivityId(
        1,
        updateDto,
        mockRequest,
        mockResponse
      );

      expect(service.updateOpportunityQuoteByActivityId).toHaveBeenCalledWith(
        1,
        updateDto,
        1
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
    });
  });

  describe("placement slip endpoints", () => {
    it("should create placement slip", async () => {
      const mockReq = { headers: { userid: "1" } } as any;
      const mockDto = { name: "pslip" } as any;
      mockOpportunityService.createPlacementSlip.mockResolvedValue(mockDto);

      await controller.createPlacementSlip(mockDto, mockReq);

      expect(service.createPlacementSlip).toHaveBeenCalledWith(mockDto);
    });

    it("should update placement slip", async () => {
      const mockReq = { headers: { userid: "1" } } as any;
      const mockDto = { name: "pslip" } as any;
      mockOpportunityService.updatePlacementSlip.mockResolvedValue(mockDto);

      await controller.updatePlacementSlip(1, mockDto, mockReq);

      expect(service.updatePlacementSlip).toHaveBeenCalledWith(1, mockDto);
    });

    it("should get placement slip", async () => {
      const data = { id: 1 } as any;
      mockOpportunityService.getPlacementSlip.mockResolvedValue(data);

      await controller.getPlacementSlip(1);

      expect(service.getPlacementSlip).toHaveBeenCalledWith(1);
    });

    it("should soft delete placement slip", async () => {
      mockOpportunityService.softDeletePlacementSlip.mockResolvedValue(
        undefined
      );

      await controller.softDeletePlacementSlip(1);

      expect(service.softDeletePlacementSlip).toHaveBeenCalledWith(1);
    });
  });
});
