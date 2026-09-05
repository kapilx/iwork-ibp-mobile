import { Test, TestingModule } from "@nestjs/testing";
import { AddressService } from "./address.service";
import { AddressRepository } from "./address.repository";
import {
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";

const mockAddressRepository = () => ({
  createAddress: jest.fn(),
  fetchAllAddressDetails: jest.fn(),
  getAddressDetails: jest.fn(),
  updateAddressDetails: jest.fn(),
  removeAddressDetails: jest.fn(),
  findAllRegions: jest.fn(),
  fetchAllCountries: jest.fn(),
  findCountries: jest.fn(),
  findStates: jest.fn(),
  findCities: jest.fn(),
});

describe("AddressService", () => {
  let service: AddressService;
  let repository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressService,
        { provide: AddressRepository, useFactory: mockAddressRepository },
      ],
    }).compile();

    service = module.get<AddressService>(AddressService);
    repository = module.get<AddressRepository>(AddressRepository);
  });

  describe("addAddress", () => {
    it("should create a new address and return response", async () => {
      const dto: CreateAddressDto = {} as any;
      repository.createAddress.mockResolvedValue(dto);
      const result = await service.addAddress(dto, 1);
      expect(repository.createAddress).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 1 })
      );
      expect(result).toBeDefined();
    });

    it("should throw InternalServerErrorException on failure", async () => {
      repository.createAddress.mockRejectedValue(new Error());
      await expect(service.addAddress({} as any, 1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("getAddressList", () => {
    it("should return address list and count", async () => {
      const mockData = { data: [], count: 0 };
      repository.fetchAllAddressDetails.mockResolvedValue(mockData);
      expect(await service.getAddressList(1, 10)).toEqual(mockData);
    });

    it("should throw InternalServerErrorException on failure", async () => {
      repository.fetchAllAddressDetails.mockRejectedValue(new Error());
      await expect(service.getAddressList(1, 10)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("getAddressById", () => {
    it("should return an address", async () => {
      repository.getAddressDetails.mockResolvedValue({});
      expect(await service.getAddressById(1)).toEqual({});
    });

    it("should rethrow NotFoundException", async () => {
      repository.getAddressDetails.mockRejectedValue(new NotFoundException());
      await expect(service.getAddressById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw InternalServerErrorException on other errors", async () => {
      repository.getAddressDetails.mockRejectedValue(new Error());
      await expect(service.getAddressById(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("updateAddressById", () => {
    it("should update and return address", async () => {
      const dto: UpdateAddressDto = {} as any;
      repository.updateAddressDetails.mockResolvedValue({});
      expect(await service.updateAddressById(1, dto, 2)).toEqual({});
    });

    it("should rethrow NotFoundException", async () => {
      repository.updateAddressDetails.mockRejectedValue(
        new NotFoundException()
      );
      await expect(service.updateAddressById(1, {} as any, 1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw InternalServerErrorException on other errors", async () => {
      repository.updateAddressDetails.mockRejectedValue(new Error());
      await expect(service.updateAddressById(1, {} as any, 1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("deleteAddressById", () => {
    it("should delete address", async () => {
      repository.getAddressDetails.mockResolvedValue({});
      repository.removeAddressDetails.mockResolvedValue(undefined);
      await expect(service.deleteAddressById(1)).resolves.not.toThrow();
    });

    it("should rethrow NotFoundException", async () => {
      service.getAddressById = jest
        .fn()
        .mockRejectedValue(new NotFoundException());
      await expect(service.deleteAddressById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw InternalServerErrorException on other errors", async () => {
      service.getAddressById = jest.fn().mockRejectedValue(new Error());
      await expect(service.deleteAddressById(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("getAllRegions", () => {
    it("should return all regions", async () => {
      repository.findAllRegions.mockResolvedValue(["region1"]);
      expect(await service.getAllRegions()).toEqual(["region1"]);
    });

    it("should throw InternalServerErrorException", async () => {
      repository.findAllRegions.mockRejectedValue(new Error());
      await expect(service.getAllRegions()).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("getAllCountries", () => {
    it("should return all countries", async () => {
      repository.fetchAllCountries.mockResolvedValue(["country1"]);
      expect(await service.getAllCountries()).toEqual(["country1"]);
    });

    it("should throw InternalServerErrorException", async () => {
      repository.fetchAllCountries.mockRejectedValue(new Error());
      await expect(service.getAllCountries()).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("getCountries", () => {
    it("should return countries by regionId", async () => {
      repository.findCountries.mockResolvedValue(["country1"]);
      expect(await service.getCountries(1)).toEqual(["country1"]);
    });

    it("should throw InternalServerErrorException", async () => {
      repository.findCountries.mockRejectedValue(new Error());
      await expect(service.getCountries(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("getStates", () => {
    it("should return states by countryId", async () => {
      repository.findStates.mockResolvedValue(["state1"]);
      expect(await service.getStates(1)).toEqual(["state1"]);
    });

    it("should throw InternalServerErrorException", async () => {
      repository.findStates.mockRejectedValue(new Error());
      await expect(service.getStates(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("getCities", () => {
    it("should return cities by stateId", async () => {
      repository.findCities.mockResolvedValue(["city1"]);
      expect(await service.getCities(1)).toEqual(["city1"]);
    });

    it("should throw InternalServerErrorException", async () => {
      repository.findCities.mockRejectedValue(new Error());
      await expect(service.getCities(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });
});
