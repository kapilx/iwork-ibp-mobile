import { Test, TestingModule } from "@nestjs/testing";
import { AddressController } from "./address.controller";
import { AddressService } from "./address.service";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";
import { Response } from "express";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard";
import { RolesGuard } from "../../../../auth-service/src/guards/role.guard";

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe("AddressController", () => {
  let controller: AddressController;
  let service: AddressService;
  let res: Response;

  const mockAddressService = {
    addAddress: jest.fn(),
    getAddressList: jest.fn(),
    getAddressById: jest.fn(),
    updateAddressById: jest.fn(),
    deleteAddressById: jest.fn(),
    getAllRegions: jest.fn(),
    getAllCountries: jest.fn(),
    getCountries: jest.fn(),
    getCompanyList: jest.fn(),
    getStates: jest.fn(),
    getCities: jest.fn(),
    getRegions: jest.fn(),
  };

  beforeEach(async () => {
    const mockAuthGuard = {
      canActivate: jest.fn(() => true), // Mock the AuthGuard to always allow access
    };

    const mockRolesGuard = {
      canActivate: jest.fn(() => true), // Mock the RolesGuard to always allow access
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressController],
      providers: [
        { provide: AddressService, useValue: mockAddressService },
        { provide: JwtService, useValue: { sign: jest.fn() } }, // Mock JwtService
      ],
    })
      .overrideGuard(AuthGuard) // Override the AuthGuard with a mock
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard) // Override the RolesGuard with a mock
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<AddressController>(AddressController);
    service = module.get<AddressService>(AddressService);
    res = mockResponse();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("addAddress", () => {
    it("should create an address", async () => {
      const dto: CreateAddressDto = { street: "123", city: "Test" } as any;
      const req = { user: { userDetails: { userId: 1 } } } as any;
      const result = { id: 1, ...dto };
      mockAddressService.addAddress.mockResolvedValue(result);

      await controller.addAddress(dto, res, req);

      expect(mockAddressService.addAddress).toHaveBeenCalledWith(dto, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("getAddressList", () => {
    it("should return list of addresses", async () => {
      const result = { data: [], count: 0 };
      mockAddressService.getAddressList.mockResolvedValue(result);
      const req = { headers: {} } as any;

      await controller.getAddressList(res, req, 1, 10);

      expect(mockAddressService.getAddressList).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getAddressById", () => {
    it("should return address by id", async () => {
      const result = { id: 1 };
      mockAddressService.getAddressById.mockResolvedValue(result);
      const req = { headers: {} } as any;

      await controller.getAddressById(1, res, req);

      expect(mockAddressService.getAddressById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateAddressById", () => {
    it("should update an address", async () => {
      const dto: UpdateAddressDto = { city: "Updated" } as any;
      const result = { id: 1, ...dto };
      const req = { user: { userDetails: { userId: 1 } }, headers: {} } as any;
      mockAddressService.updateAddressById.mockResolvedValue(result);

      await controller.updateAddressById(1, dto, res, req);

      expect(mockAddressService.updateAddressById).toHaveBeenCalledWith(
        1,
        dto,
        1
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteAddressById", () => {
    it("should delete address by id", async () => {
      const req = { headers: {} } as any;
      mockAddressService.deleteAddressById.mockResolvedValue(undefined);

      await controller.deleteAddressById(1, res, req);

      expect(mockAddressService.deleteAddressById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getAllRegions", () => {
    it("should return list of regions", async () => {
      const result = [{ name: "North" }];
      const req = { headers: {} } as any;
      mockAddressService.getAllRegions.mockResolvedValue(result);

      await controller.getAllRegions(res, req);

      expect(mockAddressService.getAllRegions).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getAllCountries", () => {
    it("should return list of countries", async () => {
      const result = [{ name: "India" }];
      const req = { headers: {} } as any;
      mockAddressService.getAllCountries.mockResolvedValue(result);

      await controller.getAllCountries(res, req);

      expect(mockAddressService.getAllCountries).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
  describe("getCountries", () => {
    it("should return list of countries for a given region ID", async () => {
      const result = [{ name: "India" }];
      const req = { headers: {} } as any;
      mockAddressService.getCountries.mockResolvedValue(result);

      await controller.getCountries(res, req, 1);

      expect(mockAddressService.getCountries).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 200,
        message: "Country list fetched successfully",
        data: result,
      });
    });

    it("should handle errors when fetching countries", async () => {
      const req = { headers: {} } as any;
      mockAddressService.getCountries.mockRejectedValue(
        new Error("Fetch failed")
      );

      await controller.getCountries(res, req, 1);

      expect(mockAddressService.getCountries).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 500,
        message: "Fetch failed",
        data: undefined,
      });
    });
  });
  describe("getStates", () => {
    it("should return list of states for a given country ID", async () => {
      const result = [{ name: "California" }];
      const req = { headers: {} } as any;
      mockAddressService.getStates.mockResolvedValue(result);

      await controller.getStates(res, req, 1);

      expect(mockAddressService.getStates).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 200,
        message: "State list fetched successfully",
        data: result,
      });
    });

    it("should handle errors when fetching states", async () => {
      const req = { headers: {} } as any;
      mockAddressService.getStates.mockRejectedValue(new Error("Fetch failed"));

      await controller.getStates(res, req, 1);

      expect(mockAddressService.getStates).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 500,
        message: "Fetch failed",
        data: undefined,
      });
    });
  });

  describe("getAddressById", () => {
    it("should handle errors when address is not found", async () => {
      const req = { headers: {} } as any;
      mockAddressService.getAddressById.mockRejectedValue(
        new Error("Address not found")
      );

      await controller.getAddressById(1, res, req);

      expect(mockAddressService.getAddressById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 404,
        message: "Address not found",
        data: undefined,
      });
    });
  });
  describe("updateAddressById", () => {
    it("should handle errors when updating address fails", async () => {
      const dto: UpdateAddressDto = { city: "Updated" } as any;
      const req = { user: { userDetails: { userId: 1 } }, headers: {} } as any;
      mockAddressService.updateAddressById.mockRejectedValue(
        new Error("Update failed")
      );

      await controller.updateAddressById(1, dto, res, req);

      expect(mockAddressService.updateAddressById).toHaveBeenCalledWith(
        1,
        dto,
        1
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 500,
        message: "Update failed",
        data: undefined,
      });
    });
  });
});
