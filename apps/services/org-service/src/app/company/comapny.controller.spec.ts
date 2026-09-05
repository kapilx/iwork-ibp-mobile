import {
  ForbiddenException,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { AuthGuard } from "../../../../../services/auth-service/src/guards/auth.guard";
import { RolesGuard } from "../../../../../services/auth-service/src/guards/role.guard";
import { CreateAddressDto } from "../address/dto/create-address.dto";
import { CompanyService } from "./comapny.service";
import { CompanyController } from "./company.controller";
import { CompanyDetailsDto } from "./dto/company-detail.dto";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { GetCompaniesDto } from "./dto/get-company-list-dto";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";

describe("CompanyController - createCompany", () => {
  let controller: CompanyController;
  let service: CompanyService;

  const mockCompanyService = {
    createCompany: jest.fn(),
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

  const mockRequest = {
    user: { userDetails: { userId: "123" } },
    headers: {
      connection: "keep-alive",
      accept: "application/json",
      referer: "http://localhost",
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<CompanyController>(CompanyController);
    service = module.get<CompanyService>(CompanyService);
  });

  it("should create a company successfully", async () => {
    const res = mockResponse();
    const createCompanyDto: CreateCompanyDto = { name: "Test Company" } as any;
    const addressesDto: CreateAddressDto[] = [];
    const companyDetailsDto: CompanyDetailsDto = {};

    jest.spyOn(service, "createCompany").mockResolvedValue("mockCompanyData");

    await controller.createCompany(
      createCompanyDto,
      addressesDto,
      companyDetailsDto,
      res as any,
      mockRequest as any
    );

    expect(service.createCompany).toHaveBeenCalledWith(
      createCompanyDto,
      addressesDto,
      companyDetailsDto
    );
    expect(createCompanyDto.createdBy).toBe("123");
    expect(createCompanyDto.updatedBy).toBe("123");
    expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.CREATED,
      message: "Company created successfully",
      data: "mockCompanyData",
    });
  });

  it("should handle NotFoundException", async () => {
    const res = mockResponse();
    const createCompanyDto: CreateCompanyDto = { name: "Test Company" } as any;
    const addressesDto: CreateAddressDto[] = [];
    const companyDetailsDto: CompanyDetailsDto = {};

    jest
      .spyOn(service, "createCompany")
      .mockRejectedValue(new NotFoundException("Company not found"));

    await controller.createCompany(
      createCompanyDto,
      addressesDto,
      companyDetailsDto,
      res as any,
      mockRequest as any
    );

    expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.NOT_FOUND,
      message: "Company not found",
    });
  });

  it("should handle ForbiddenException", async () => {
    const res = mockResponse();
    const createCompanyDto: CreateCompanyDto = { name: "Test Company" } as any;
    const addressesDto: CreateAddressDto[] = [];
    const companyDetailsDto: CompanyDetailsDto = {};

    jest
      .spyOn(service, "createCompany")
      .mockRejectedValue(new ForbiddenException("Access denied"));

    await controller.createCompany(
      createCompanyDto,
      addressesDto,
      companyDetailsDto,
      res as any,
      mockRequest as any
    );

    expect(res.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.FORBIDDEN,
      message: "Access denied",
    });
  });

  it("should handle generic errors", async () => {
    const res = mockResponse();
    const createCompanyDto: CreateCompanyDto = { name: "Test Company" } as any;
    const addressesDto: CreateAddressDto[] = [];
    const companyDetailsDto: CompanyDetailsDto = {};

    jest
      .spyOn(service, "createCompany")
      .mockRejectedValue(new Error("Unexpected error"));

    await controller.createCompany(
      createCompanyDto,
      addressesDto,
      companyDetailsDto,
      res as any,
      mockRequest as any
    );

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.BAD_REQUEST,
      message: "Unexpected error",
    });
  });
});

describe("CompanyController - getCompanyList", () => {
  let controller: CompanyController;
  let service: CompanyService;

  const mockCompanyService = {
    getCompanyList: jest.fn(),
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

  const mockRequest = {
    user: { userDetails: { userId: "123" } },
    headers: {
      connection: "keep-alive",
      accept: "application/json",
      referer: "http://localhost",
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<CompanyController>(CompanyController);
    service = module.get<CompanyService>(CompanyService);
  });

  it("should return a list of companies successfully", async () => {
    const res = mockResponse();
    const query: GetCompaniesDto = {
      page: 1,
      limit: 10,
      search: "",
      sortBy: "name",
      sort: "asc",
      entityList: [2],
    } as any;
    const mockCompanyList = [
      { id: 1, name: "Company A" },
      { id: 2, name: "Company B" },
    ];

    jest.spyOn(service, "getCompanyList").mockResolvedValue(mockCompanyList);

    await controller.getCompanyList(query, res as any, mockRequest as any);

    expect(service.getCompanyList).toHaveBeenCalledWith(
      1,
      10,
      "",
      "123",
      [2]
    );
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.OK,
      message: "Company list retrieved successfully",
      data: mockCompanyList,
    });
  });

  it("should handle errors and return BAD_REQUEST", async () => {
    const res = mockResponse();
    const query: GetCompaniesDto = {
      page: 1,
      limit: 10,
      search: "",
      sortBy: "name",
      sort: "asc",
      entityList: [2],
    } as any;

    jest
      .spyOn(service, "getCompanyList")
      .mockRejectedValue(new Error("Unexpected error"));

    await controller.getCompanyList(query, res as any, mockRequest as any);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.BAD_REQUEST,
      message: "Unexpected error",
    });
  });
});

describe("CompanyController - getCompanyById", () => {
  let controller: CompanyController;
  let service: CompanyService;

  const mockCompanyService = {
    getCompanyById: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRequest = {
    headers: {
      connection: "keep-alive",
      accept: "application/json",
      referer: "http://localhost",
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<CompanyController>(CompanyController);
    service = module.get<CompanyService>(CompanyService);
  });

  it("should return a company by ID successfully", async () => {
    const mockCompanyData = { id: "1", name: "Test Company" };
    jest.spyOn(service, "getCompanyById").mockResolvedValue(mockCompanyData);

    const result = await controller.getCompanyById("1", mockRequest as any);

    expect(service.getCompanyById).toHaveBeenCalledWith("1");
    expect(result).toEqual({
      status: HttpStatus.OK,
      message: successMessage.companyDetails,
      data: mockCompanyData,
    });
  });

  it("should handle NotFoundException when company is not found", async () => {
    jest
      .spyOn(service, "getCompanyById")
      .mockRejectedValue(new NotFoundException("Company not found"));

    const result = await controller.getCompanyById("1", mockRequest as any);

    expect(service.getCompanyById).toHaveBeenCalledWith("1");
    expect(result).toEqual({
      status: HttpStatus.NOT_FOUND,
      message: "Company not found",
    });
  });

  it("should handle generic errors", async () => {
    jest
      .spyOn(service, "getCompanyById")
      .mockRejectedValue(new Error("Unexpected error"));

    const result = await controller.getCompanyById("1", mockRequest as any);

    expect(service.getCompanyById).toHaveBeenCalledWith("1");
    expect(result).toEqual({
      status: HttpStatus.NOT_FOUND,
      message: "Unexpected error",
    });
  });
});

describe("CompanyController - getCompanies", () => {
  let controller: CompanyController;
  let service: CompanyService;

  const mockCompanyService = {
    listCompanies: jest.fn(),
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

  const mockRequest = {
    user: { userDetails: { userId: "123" } },
    headers: {
      connection: "keep-alive",
      accept: "application/json",
      referer: "http://localhost",
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<CompanyController>(CompanyController);
    service = module.get<CompanyService>(CompanyService);
  });

  it("should return a list of companies successfully", async () => {
    const res = mockResponse();
    const query: GetCompaniesDto = {
      page: 1,
      limit: 10,
      search: "",
      sort: "name:asc",
      searchBy: "",
    };
    const mockCompanies = [
      { id: 1, name: "Company A" },
      { id: 2, name: "Company B" },
    ];

    jest.spyOn(service, "listCompanies").mockResolvedValue(mockCompanies);

    await controller.getCompanies(query, res as any, mockRequest as any);

    expect(service.listCompanies).toHaveBeenCalledWith(
      1,
      10,
      "",
      "name:asc",
      123,
      "",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.OK,
      message: successMessage.companyListRetrieved,
      data: mockCompanies,
    });
  });

  it("should handle NotFoundException when no companies are found", async () => {
    const res = mockResponse();
    const query: GetCompaniesDto = {
      page: 1,
      limit: 10,
      search: "",
      sort: "name:asc",
      searchBy: "",
    };

    jest
      .spyOn(service, "listCompanies")
      .mockRejectedValue(new NotFoundException("No companies found"));

    await controller.getCompanies(query, res as any, mockRequest as any);

    expect(service.listCompanies).toHaveBeenCalledWith(
      1,
      10,
      "",
      "name:asc",
      123,
      "",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
    expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.NOT_FOUND,
      message: "No companies found",
    });
  });

  it("should handle Internal Server Error", async () => {
    const res = mockResponse();
    const query: GetCompaniesDto = {
      page: 1,
      limit: 10,
      search: "",
      sort: "name:asc",
      searchBy: "",
    };

    jest
      .spyOn(service, "listCompanies")
      .mockRejectedValue(new Error("Unexpected error"));

    await controller.getCompanies(query, res as any, mockRequest as any);

    expect(service.listCompanies).toHaveBeenCalledWith(
      1,
      10,
      "",
      "name:asc",
      123,
      "",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.BAD_REQUEST,
      message: "Unexpected error",
    });
  });
});

describe("CompanyController - updateCompany", () => {
  let controller: CompanyController;
  let service: CompanyService;

  const mockCompanyService = {
    updateCompany: jest.fn(),
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

  const mockRequest = {
    user: { userDetails: { userId: "123" } },
    headers: {
      connection: "keep-alive",
      accept: "application/json",
      referer: "http://localhost",
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<CompanyController>(CompanyController);
    service = module.get<CompanyService>(CompanyService);
  });

  it("should update a company successfully", async () => {
    const res = mockResponse();
    const companyId = "1";
    const companyDto: UpdateCompanyDto = { name: "Updated Company" } as any;
    const addressesDto: UpdateAddressDto[] = [];
    const companyDetailsDto: CompanyDetailsDto = {};
    const mockUpdatedCompany = { id: "1", name: "Updated Company" };

    jest.spyOn(service, "updateCompany").mockResolvedValue(mockUpdatedCompany);

    await controller.updateCompany(
      companyId,
      companyDto,
      addressesDto,
      companyDetailsDto,
      res as any,
      mockRequest as any
    );

    expect(service.updateCompany).toHaveBeenCalledWith(
      companyId,
      companyDto,
      addressesDto,
      companyDetailsDto
    );
    expect(companyDto.updatedBy).toBe("123");
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.OK,
      message: successMessage.companyUpdated,
      data: mockUpdatedCompany,
    });
  });

  it("should handle NotFoundException when company is not found", async () => {
    const res = mockResponse();
    const companyId = "1";
    const companyDto: UpdateCompanyDto = { name: "Updated Company" } as any;
    const addressesDto: UpdateAddressDto[] = [];
    const companyDetailsDto: CompanyDetailsDto = {};

    jest.spyOn(service, "updateCompany").mockResolvedValue(null); // Simulate no company found

    await controller.updateCompany(
      companyId,
      companyDto,
      addressesDto,
      companyDetailsDto,
      res as any,
      mockRequest as any
    );

    expect(service.updateCompany).toHaveBeenCalledWith(
      companyId,
      companyDto,
      addressesDto,
      companyDetailsDto
    );
    expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.NOT_FOUND,
      message: errorMessages.companyNotFound,
    });
  });

  it("should handle ForbiddenException", async () => {
    const res = mockResponse();
    const companyId = "1";
    const companyDto: UpdateCompanyDto = { name: "Updated Company" } as any;
    const addressesDto: UpdateAddressDto[] = [];
    const companyDetailsDto: CompanyDetailsDto = {};

    jest
      .spyOn(service, "updateCompany")
      .mockRejectedValue(new ForbiddenException("Access denied"));

    await controller.updateCompany(
      companyId,
      companyDto,
      addressesDto,
      companyDetailsDto,
      res as any,
      mockRequest as any
    );

    expect(service.updateCompany).toHaveBeenCalledWith(
      companyId,
      companyDto,
      addressesDto,
      companyDetailsDto
    );
    expect(res.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.FORBIDDEN,
      message: "Access denied",
    });
  });

  it("should handle generic errors", async () => {
    const res = mockResponse();
    const companyId = "1";
    const companyDto: UpdateCompanyDto = { name: "Updated Company" } as any;
    const addressesDto: UpdateAddressDto[] = [];
    const companyDetailsDto: CompanyDetailsDto = {};

    jest
      .spyOn(service, "updateCompany")
      .mockRejectedValue(new Error("Unexpected error"));

    await controller.updateCompany(
      companyId,
      companyDto,
      addressesDto,
      companyDetailsDto,
      res as any,
      mockRequest as any
    );

    expect(service.updateCompany).toHaveBeenCalledWith(
      companyId,
      companyDto,
      addressesDto,
      companyDetailsDto
    );
    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.BAD_REQUEST,
      message: "Unexpected error",
    });
  });
});

describe("CompanyController - getCompanyBasicDetails", () => {
  let controller: CompanyController;
  let service: CompanyService;

  const mockCompanyService = {
    getCompanyBasicDetails: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRequest = {
    user: { userDetails: { userId: "123" } },
    headers: {
      connection: "keep-alive",
      accept: "application/json",
      referer: "http://localhost",
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<CompanyController>(CompanyController);
    service = module.get<CompanyService>(CompanyService);
  });

  it("should return basic details of a company successfully", async () => {
    const mockCompanyData = { id: 1, name: "Test Company" };
    jest
      .spyOn(service, "getCompanyBasicDetails")
      .mockResolvedValue(mockCompanyData);

    const result = await controller.getCompanyBasicDetails(
      "1",
      mockRequest as any
    );

    expect(service.getCompanyBasicDetails).toHaveBeenCalledWith(1, "123");
    expect(result).toEqual({
      status: HttpStatus.OK,
      message: successMessage.companyDetails,
      data: mockCompanyData,
    });
  });

  it("should handle NotFoundException when company is not found", async () => {
    jest
      .spyOn(service, "getCompanyBasicDetails")
      .mockRejectedValue(new NotFoundException("Company not found"));

    const result = await controller.getCompanyBasicDetails(
      "1",
      mockRequest as any
    );

    expect(service.getCompanyBasicDetails).toHaveBeenCalledWith(1, "123");
    expect(result).toEqual({
      status: HttpStatus.NOT_FOUND,
      message: "Company not found",
    });
  });

  it("should handle generic errors", async () => {
    jest
      .spyOn(service, "getCompanyBasicDetails")
      .mockRejectedValue(new Error("Unexpected error"));

    const result = await controller.getCompanyBasicDetails(
      "1",
      mockRequest as any
    );

    expect(service.getCompanyBasicDetails).toHaveBeenCalledWith(1, "123");
    expect(result).toEqual({
      status: HttpStatus.NOT_FOUND,
      message: "Unexpected error",
    });
  });
});

describe("CompanyController - getCompaniesData", () => {
  let controller: CompanyController;
  let service: CompanyService;

  const mockCompanyService = {
    getCompanies: jest.fn(),
    getCompaniesByHierarchy: jest.fn(),
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
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<CompanyController>(CompanyController);
    service = module.get<CompanyService>(CompanyService);
  });

  it("should return a list of companies successfully", async () => {
    const res = mockResponse();
    const query = { page: 1, limit: 10, search: "test" };
    const mockCompanyData = [
      { id: 1, name: "Company A" },
      { id: 2, name: "Company B" },
    ];

    jest.spyOn(service, "getCompanies").mockResolvedValue(mockCompanyData);

    await controller.getCompaniesData(query as any, res as any);

    expect(service.getCompanies).toHaveBeenCalledWith(1, 10, "test");
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.OK,
      message: successMessage.companyListRetrieved,
      data: mockCompanyData,
    });
  });

  it("should handle errors and return BAD_REQUEST", async () => {
    const res = mockResponse();
    const query = { page: 1, limit: 10, search: "test" };

    jest
      .spyOn(service, "getCompanies")
      .mockRejectedValue(new Error("Unexpected error"));

    await controller.getCompaniesData(query as any, res as any);

    expect(service.getCompanies).toHaveBeenCalledWith(1, 10, "test");
    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.BAD_REQUEST,
      message: "Unexpected error",
    });
  });
});

describe("CompanyController - getHierarchyCompanies", () => {
  let controller: CompanyController;
  let service: CompanyService;

  const mockCompanyService = {
    getCompaniesByHierarchy: jest.fn(),
  };

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  const mockRequest = {
    headers: { userid: "10" },
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
        {
          provide: ScopeService,
          useValue: { validateResourceScope: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<CompanyController>(CompanyController);
    service = module.get<CompanyService>(CompanyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return hierarchy companies", async () => {
    const res = mockResponse();
    const query = { ownerId: 5, viewBy: "team", page: 2, limit: 5, search: "ab" } as any;
    const companies = {
      data: [{ companyId: 1, companyName: "ABC", displayName: "ABC" }],
      count: 1,
    };
    mockCompanyService.getCompaniesByHierarchy.mockResolvedValue(companies);

    await controller.getHierarchyCompanies(query, res as any, mockRequest);

    expect(service.getCompaniesByHierarchy).toHaveBeenCalledWith(
      10,
      5,
      "team",
      2,
      5,
      "ab"
    );
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.OK,
      message: successMessage.companyListRetrieved,
      data: companies,
    });
  });

  it("should handle errors when fetching hierarchy companies fails", async () => {
    const res = mockResponse();
    const query = { ownerId: 5, viewBy: "team", page: 1, limit: 10, search: "" } as any;
    mockCompanyService.getCompaniesByHierarchy.mockRejectedValue(
      new Error("failed")
    );

    await controller.getHierarchyCompanies(query, res as any, mockRequest);

    expect(service.getCompaniesByHierarchy).toHaveBeenCalledWith(
      10,
      5,
      "team",
      1,
      10,
      ""
    );
    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.BAD_REQUEST,
      message: "failed",
    });
  });
});
