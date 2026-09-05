import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { successMessage } from "../../../../../../libs/service-lib/src/lib/messages";
import {
  createErrorResponse,
  createResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard";
import { GetCompaniesDto } from "../company/dto/get-company-list-dto";
import { CreateTpaDto } from "./dto/create-tpa.dto";
import { GetTpasDto } from "./dto/get-tpas-query.dto";
import { TpaController } from "./tpa.controller";
import { TpaService } from "./tpa.service";

const mockTpaService = {
  addTpa: jest.fn(),
  getTpas: jest.fn(),
  getCompanyList: jest.fn(),
  getCompanyBasicDetails: jest.fn(),
  getTpaById: jest.fn(),
  updateTpaById: jest.fn(),
  getListOfCompanies: jest.fn(),
  getCompanyListData: jest.fn(),
  deleteTpaById: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn(() => true), // Always allow access in tests
};

describe("TpaController", () => {
  let controller: TpaController;
  let service: TpaService;

  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response; // Explicitly cast to Response
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TpaController],
      providers: [{ provide: TpaService, useValue: mockTpaService }],
    })
      .overrideGuard(AuthGuard) // Override the AuthGuard with a mock
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<TpaController>(TpaController);
    service = module.get<TpaService>(TpaService);
  });

  const reqMock = {
    user: { userDetails: { userId: 1 } },
    headers: {},
  } as unknown as Response;

  it("should create a TPA", async () => {
    const dto = {} as CreateTpaDto;
    const res = mockResponse();
    const mockTpa = { id: 1 };
    mockTpaService.addTpa.mockResolvedValue(mockTpa);

    await controller.addTpa(dto, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      createResponse(201, successMessage.tpaCreated, mockTpa)
    );
  });

  it("should handle NotFoundException in addTpa", async () => {
    const res = mockResponse();
    mockTpaService.addTpa.mockRejectedValue(new NotFoundException());

    await controller.addTpa({} as CreateTpaDto, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should handle ForbiddenException in addTpa", async () => {
    const res = mockResponse();
    mockTpaService.addTpa.mockRejectedValue(new ForbiddenException());

    await controller.addTpa({} as CreateTpaDto, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should retrieve all TPAs", async () => {
    const res = mockResponse();
    const dto = {} as GetTpasDto;
    const data = [{ id: 1 }];
    mockTpaService.getTpas.mockResolvedValue(data);

    await controller.getTpas(dto, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      createResponse(201, successMessage.tpasRetrieved, data)
    );
  });

  it("should retrieve company list", async () => {
    const res = mockResponse();
    const dto = {} as GetCompaniesDto;
    const data = [{ id: 1 }];
    mockTpaService.getCompanyList.mockResolvedValue(data);

    await controller.getCompanyList(dto, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      createResponse(200, successMessage.tpaCompanyListRetrieved, data)
    );
  });

  it("should handle error in getCompanyList", async () => {
    const res = mockResponse();
    mockTpaService.getCompanyList.mockRejectedValue(new Error("error"));

    await controller.getCompanyList({} as GetCompaniesDto, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return company details", async () => {
    const data = { id: 1 };
    mockTpaService.getCompanyBasicDetails.mockResolvedValue(data);

    const result = await controller.getCompanyBasicDetails("1", reqMock);

    expect(result).toEqual(
      createResponse(200, successMessage.tpaDetailsRetrieved, data)
    );
  });

  it("should handle error in getCompanyBasicDetails", async () => {
    mockTpaService.getCompanyBasicDetails.mockRejectedValue(new Error("error"));

    const result = await controller.getCompanyBasicDetails("1", reqMock);

    expect(result).toEqual(createErrorResponse(404, "error"));
  });

  it("should get TPA by id", async () => {
    const res = mockResponse();
    const data = { id: 1 };
    mockTpaService.getTpaById.mockResolvedValue(data);

    await controller.getTpaById(1, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      createResponse(200, successMessage.tpaRetrieved, data)
    );
  });

  it("should handle NotFoundException in getTpaById", async () => {
    const res = mockResponse();
    mockTpaService.getTpaById.mockRejectedValue(new NotFoundException());

    await controller.getTpaById(1, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should handle ForbiddenException in getTpaById", async () => {
    const res = mockResponse();
    mockTpaService.getTpaById.mockRejectedValue(new ForbiddenException());

    await controller.getTpaById(1, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should handle unknown error in getTpaById", async () => {
    const res = mockResponse();
    mockTpaService.getTpaById.mockRejectedValue(new Error("Unknown"));

    await controller.getTpaById(1, res, reqMock);

    expect(res.status).toHaveBeenCalledWith(400);
  });
  describe("updateTpaById", () => {
    it("should update a TPA by ID", async () => {
      const res = mockResponse();
      const dto = { tpaName: "Updated TPA" };
      const data = { id: 1, tpaName: "Updated TPA" };
      mockTpaService.updateTpaById.mockResolvedValue(data);

      await controller.updateTpaById(1, dto, res, reqMock);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        createResponse(200, successMessage.tpaUpdated, data)
      );
    });

    it("should handle NotFoundException in updateTpaById", async () => {
      const res = mockResponse();
      mockTpaService.updateTpaById.mockRejectedValue(new NotFoundException());

      await controller.updateTpaById(
        1,
        {} as Record<string, unknown>,
        res,
        reqMock
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle ForbiddenException in updateTpaById", async () => {
      const res = mockResponse();
      mockTpaService.updateTpaById.mockRejectedValue(new ForbiddenException());

      await controller.updateTpaById(
        1,
        {} as Record<string, unknown>,
        res,
        reqMock
      );

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should handle unknown error in updateTpaById", async () => {
      const res = mockResponse();
      mockTpaService.updateTpaById.mockRejectedValue(new Error("Unknown"));

      await controller.updateTpaById(
        1,
        {} as Record<string, unknown>,
        res,
        reqMock
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
  describe("deleteTpaById", () => {
    it("should delete a TPA by ID", async () => {
      const res = mockResponse();
      mockTpaService.deleteTpaById.mockResolvedValue(undefined);

      await controller.deleteTpaById(1, res, reqMock);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        createResponse(200, successMessage.tpaDeleted)
      );
    });

    it("should handle NotFoundException in deleteTpaById", async () => {
      const res = mockResponse();
      mockTpaService.deleteTpaById.mockRejectedValue(new NotFoundException());

      await controller.deleteTpaById(1, res, reqMock);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle ForbiddenException in deleteTpaById", async () => {
      const res = mockResponse();
      mockTpaService.deleteTpaById.mockRejectedValue(new ForbiddenException());

      await controller.deleteTpaById(1, res, reqMock);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should handle unknown error in deleteTpaById", async () => {
      const res = mockResponse();
      mockTpaService.deleteTpaById.mockRejectedValue(new Error("Unknown"));

      await controller.deleteTpaById(1, res, reqMock);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
