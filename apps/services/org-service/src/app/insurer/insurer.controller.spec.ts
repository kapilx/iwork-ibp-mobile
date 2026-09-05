import {
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing"; // Import Test from @nestjs/testing
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_SORT_FIELD,
  DEFAULT_SORT_ORDER,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { AuthGuard } from "../../../../../services/auth-service/src/guards/auth.guard";
import { CreateInsurerDto } from "./dto/create-insurer.dto";
import { GetAllInsurersDto } from "./dto/get-all-insurers.dto";
import { InsurerController } from "./insurer.controller";
import { InsurerService } from "./insurer.service";

describe("InsurerController", () => {
  let controller: InsurerController;
  let service: InsurerService;

  beforeEach(async () => {
    const mockAuthGuard = {
      canActivate: jest.fn(() => true), // Mock the AuthGuard to always allow access
    };

    const mockJwtService = {
      verify: jest.fn(),
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InsurerController],
      providers: [
        {
          provide: InsurerService,
          useValue: {
            addInsurer: jest.fn(),
            getAllInsurers: jest.fn(),
            getInsurerById: jest.fn(),
            modifyInsurer: jest.fn(),
            deleteInsurer: jest.fn(),
            getInsurerDetails: jest.fn(),
            getInsurerList: jest.fn(),
            getCompanyInsurers: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: mockJwtService, // Provide a mock JwtService
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard) // Override the AuthGuard with a mock
      .compile();

    controller = module.get<InsurerController>(InsurerController);
    service = module.get<InsurerService>(InsurerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("addInsurer", () => {
    it("should add a new insurer and return the response", async () => {
      const createInsurerDto: CreateInsurerDto = {
        insurerName: "Test Insurer",
        displayName: "Test Display",
        statusLid: 1,
        address: [],
      };
      const mockResponse = { id: 1, ...createInsurerDto };

      jest.spyOn(service, "addInsurer").mockResolvedValue(mockResponse);

      const req = { user: { userDetails: { userId: 1 } } } as Request;
      const res = {
        status: jest.fn().mockReturnThis(), // Ensure chaining works
        json: jest.fn(),
      } as unknown as Response;

      await controller.addInsurer(req, res, createInsurerDto);

      expect(service.addInsurer).toHaveBeenCalledWith(createInsurerDto, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 200,
        message: "Insurer successfully created.",
        data: mockResponse,
      });
    });

    it("should handle InternalServerErrorException", async () => {
      const createInsurerDto: CreateInsurerDto = {
        insurerName: "Test Insurer",
        displayName: "Test Display",
        statusLid: 1,
        address: [],
      };

      jest
        .spyOn(service, "addInsurer")
        .mockRejectedValue(
          new InternalServerErrorException("Failed to add insurer")
        );

      const req = { user: { userDetails: { userId: 1 } } } as Request;
      const res = {
        status: jest.fn().mockReturnThis(), // Ensure chaining works
        json: jest.fn(),
      } as unknown as Response;

      await controller.addInsurer(req, res, createInsurerDto);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 400,
        message: "Failed to add insurer",
      });
    });

    it("should return 400 if required fields are missing", async () => {
      const createInsurerDto = { displayName: "Test Display" }; // Missing required fields
      const req = { user: { userDetails: { userId: 1 } } } as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      jest.spyOn(service, "addInsurer").mockImplementation(() => {
        throw new BadRequestException(
          "Validation failed: insurerName is required."
        );
      });

      await controller.addInsurer(req, res, createInsurerDto as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 400,
        message: "Validation failed: insurerName is required.",
      });
    });
  });

  describe("getAllInsurers", () => {
    it("should handle InternalServerErrorException", async () => {
      const getAllInsurersDto: GetAllInsurersDto = {
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "ASC",
        search: "Test",
      };

      jest
        .spyOn(service, "getAllInsurers")
        .mockRejectedValue(
          new InternalServerErrorException("Failed to fetch insurers")
        );

      const req = { user: { userDetails: { userId: 1 } } } as Request;
      const res = {
        status: jest.fn().mockReturnThis(), // Ensure chaining works
        json: jest.fn(),
      } as unknown as Response;

      await controller.getAllInsurers(getAllInsurersDto, res, req);

      expect(res.status).toHaveBeenCalledWith(400); // Updated to match actual response
      expect(res.json).toHaveBeenCalledWith({
        status: 400,
        message: "Failed to fetch insurers",
      });
    });
  });

  describe("getInsurerById", () => {
    it("should return an insurer by ID", async () => {
      const mockResponse = { id: 1, insurerName: "Test Insurer" };

      jest.spyOn(service, "getInsurerById").mockResolvedValue(mockResponse);

      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.getInsurerById(1, req, res);

      expect(service.getInsurerById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 200,
        message: "Insurer retrieved successfully",
        data: mockResponse,
      });
    });

    it("should handle NotFoundException", async () => {
      jest
        .spyOn(service, "getInsurerById")
        .mockRejectedValue(
          new NotFoundException("Insurer with the specified ID not found")
        );

      const res = {
        status: jest.fn().mockReturnThis(), // Ensure chaining works
        json: jest.fn(),
      } as unknown as Response;

      await controller.getInsurerById(1, {} as Request, res);

      expect(res.status).toHaveBeenCalledWith(404); // Corrected status code
      expect(res.json).toHaveBeenCalledWith({
        status: 404,
        message: "Insurer with the specified ID not found",
        data: undefined,
      });
    });
  });

  describe("deleteInsurer", () => {
    it("should delete an insurer and return the response", async () => {
      jest.spyOn(service, "deleteInsurer").mockResolvedValue({
        message: "Insurer deleted successfully",
      });

      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.deleteInsurer(1, req, res);

      expect(service.deleteInsurer).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 200,
        message: "Insurer deleted successfully",
        data: {
          message: "Insurer deleted successfully",
        },
      });
    });

    it("should handle NotFoundException", async () => {
      jest
        .spyOn(service, "deleteInsurer")
        .mockRejectedValue(
          new NotFoundException("Insurer with the specified ID not found")
        );

      const res = {
        status: jest.fn().mockReturnThis(), // Ensure chaining works
        json: jest.fn(),
      } as unknown as Response;

      await controller.deleteInsurer(1, {} as Request, res);

      expect(res.status).toHaveBeenCalledWith(404); // Corrected status code
      expect(res.json).toHaveBeenCalledWith({
        status: 404,
        message: "Insurer with the specified ID not found",
        data: undefined,
      });
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

      jest.spyOn(service, "getInsurerDetails").mockResolvedValue(mockDetails);

      const req = { user: { userDetails: { userId: 1 } } } as Request;
      const res = {
        status: jest.fn().mockReturnThis(), // Ensure chaining works
        json: jest.fn(),
      } as unknown as Response;

      await controller.getInsurerDetails(1, req, res);

      expect(service.getInsurerDetails).toHaveBeenCalledWith(1, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 200,
        message: "Insurer details retrieved successfully",
        data: mockDetails,
      });
    });

    it("should handle NotFoundException", async () => {
      jest
        .spyOn(service, "getInsurerById")
        .mockRejectedValue(new NotFoundException("Insurer not found"));

      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.getInsurerById(1, req, res);

      expect(service.getInsurerById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 404,
        message: "Insurer not found",
      });
    });
  });

  describe("getInsurerList", () => {
    it("should return a paginated list of insurers (success case)", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        search: "Test",
        sortBy: "insurerName",
        sortOrder: "ASC",
      };

      const mockServiceResponse = {
        data: [
          { id: 1, insurerName: "Test Insurer 1", displayName: "Display 1" },
          { id: 2, insurerName: "Test Insurer 2", displayName: "Display 2" },
        ],
        total: 2,
      };

      jest
        .spyOn(service, "getInsurerList")
        .mockResolvedValue(mockServiceResponse);

      const req = { user: { userDetails: { userId: 1 } } } as Request;
      const res = {
        status: jest.fn().mockReturnThis(), // Ensure chaining works
        json: jest.fn(),
      } as unknown as Response;

      await controller.getInsurerList(mockQuery, res, req);

      expect(service.getInsurerList).toHaveBeenCalledWith(
        1, // page
        10, // limit
        "Test", // search
        "insurerName", // sortBy
        "ASC", // sortOrder
        1 // userId
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 200,
        message: "Insurer list retrieved successfully",
        data: mockServiceResponse,
      });
    });

    it("should handle InternalServerErrorException", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        search: "Test",
        sortBy: "insurerName",
        sortOrder: "ASC",
      };

      jest
        .spyOn(service, "getInsurerList")
        .mockRejectedValue(new Error("Failed to fetch insurers"));

      const req = { user: { userDetails: { userId: 1 } } } as Request;
      const res = {
        status: jest.fn().mockReturnThis(), // Ensure chaining works
        json: jest.fn(),
      } as unknown as Response;

      await controller.getInsurerList(mockQuery, res, req);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 400,
        message: "Failed to fetch insurers",
      });
    });

    it("should handle missing query parameters gracefully", async () => {
      const mockQuery = {}; // No query parameters
      const mockServiceResponse = {
        data: [],
        total: 0,
      };

      jest
        .spyOn(service, "getInsurerList")
        .mockResolvedValue(mockServiceResponse);

      const req = { user: { userDetails: { userId: 1 } } } as Request;
      const res = {
        status: jest.fn().mockReturnThis(), // Ensure chaining works
        json: jest.fn(),
      } as unknown as Response;

      await controller.getInsurerList(mockQuery, res, req);

      expect(service.getInsurerList).toHaveBeenCalledWith(
        DEFAULT_PAGE,
        DEFAULT_LIMIT,
        "",
        DEFAULT_SORT_FIELD,
        DEFAULT_SORT_ORDER,
        1
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 200,
        message: "Insurer list retrieved successfully",
        data: mockServiceResponse,
      });
    });

    it("should handle unexpected errors gracefully", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        search: "Test",
        sortBy: "insurerName",
        sortOrder: "ASC",
      };

      jest
        .spyOn(service, "getInsurerList")
        .mockRejectedValue(new Error("Unexpected error"));

      const req = { user: { userDetails: { userId: 1 } } } as Request;
      const res = {
        status: jest.fn().mockReturnThis(), // Ensure chaining works
        json: jest.fn(),
      } as unknown as Response;

      await controller.getInsurerList(mockQuery, res, req);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 400,
        message: "Unexpected error",
      });
    });
  });
});

  describe("getCompanyInsurers", () => {
    const reqMock = {
      headers: { userid: "9" },
    } as unknown as Request;
    const createResponseMock = () => {
      const res: Partial<Response> = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res as Response;
    };

    it("should return insurers for a company", async () => {
      const res = createResponseMock();
      const insurers = { data: [{ insurerId: 1, insurerName: "ABC" }], count: 1 };
      (service.getCompanyInsurers as jest.Mock).mockResolvedValue(insurers);

      await controller.getCompanyInsurers(
        { companyId: "12" } as any,
        { page: 2, limit: 5, search: "ab" } as any,
        res,
        reqMock
      );

      expect(service.getCompanyInsurers).toHaveBeenCalledWith(12, 2, 5, "ab");
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: successMessage.insurerListRetrieved,
        data: insurers,
      });
    });

    it("should handle errors while fetching company insurers", async () => {
      const res = createResponseMock();
      (service.getCompanyInsurers as jest.Mock).mockRejectedValue(
        new Error("failure")
      );

      await controller.getCompanyInsurers(
        { companyId: "12" } as any,
        { page: 1, limit: 10, search: "" } as any,
        res,
        reqMock
      );

      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        status: HttpStatus.BAD_REQUEST,
        message: "failure",
      });
    });

    it("should return bad request for invalid company id", async () => {
      const res = createResponseMock();

      await controller.getCompanyInsurers(
        { companyId: "abc" } as any,
        { page: 1, limit: 10, search: "" } as any,
        res,
        reqMock
      );

      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });
  });
});
