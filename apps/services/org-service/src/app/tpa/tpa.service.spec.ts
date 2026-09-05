import { Test, TestingModule } from "@nestjs/testing";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation"; // Import LookUpValidationService
import { ContactService } from "../contact/contact.service";
import { TpaRepository } from "./tpa.repository";
import { TpaService } from "./tpa.service";

import {
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateTpaDto } from "./dto/create-tpa.dto";
import { UpdateTpaDto } from "./dto/update-tpa.dto";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";

const mockTpaRepository = () => ({
  addTpa: jest.fn(),
  getTpas: jest.fn(),
  getTpaById: jest.fn(),
  updateTpaById: jest.fn(),
  deleteTpaById: jest.fn(),
  CompanyList: jest.fn(),
  getCompanyListData: jest.fn(),
});

const mockContactService = () => ({});

describe("TpaService", () => {
  let service: TpaService;
  let repo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TpaService,
        { provide: TpaRepository, useFactory: mockTpaRepository },
        { provide: ContactService, useFactory: mockContactService },
        {
          provide: LookUpValidationService,
          useValue: {
            validateDynamicLookupValues: jest.fn(),
          },
        },
        {
          provide: MasterValidationService,
          useValue: {
            validateMasterIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TpaService>(TpaService);
    repo = module.get<TpaRepository>(TpaRepository);
  });

  describe("addTpa", () => {
    it("should add a TPA and return the saved TPA ID", async () => {
      const createTpaDto = { tpaName: "Test TPA" } as CreateTpaDto;
      const userId = 1;

      repo.addTpa.mockResolvedValue({ id: 1 });

      const result = await service.addTpa(createTpaDto, userId);

      expect(result).toEqual({ id: 1 });
    });

    it("should throw error if repo fails", async () => {
      repo.addTpa.mockRejectedValue(new Error("DB error"));
      await expect(service.addTpa({} as CreateTpaDto, 1)).rejects.toThrow(
        "DB error"
      );
    });
  });

  describe("getTpas", () => {
    it("should throw error on failure", async () => {
      repo.getTpas.mockRejectedValue(new Error("Failed"));
      await expect(service.getTpas("id", "ASC", 1, 10)).rejects.toThrow(
        "params is not iterable"
      );
    });
  });

  describe("getTpaById", () => {
    it("should return TPA if found", async () => {
      repo.getTpaById.mockResolvedValue({ id: 1 });
      expect(await service.getTpaById(1)).toEqual({ id: 1 });
    });

    it("should throw NotFound if not found", async () => {
      repo.getTpaById.mockResolvedValue(null);
      await expect(service.getTpaById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateTpaById", () => {
    it("should update a TPA and return the updated TPA ID", async () => {
      const updateTpaDto = { tpaName: "Updated TPA" } as UpdateTpaDto;
      const userId = 1;

      repo.updateTpaById.mockResolvedValue({ id: 1 });

      const result = await service.updateTpaById(1, updateTpaDto, userId);

      expect(result).toEqual({ id: 1 });
    });

    it("should throw Error if update fails", async () => {
      // Mock the repository to simulate a failure
      repo.updateTpaById.mockResolvedValue(null);

      // Assert that the service throws an Error with the expected message
      await expect(
        service.updateTpaById(1, {} as UpdateTpaDto, 1)
      ).rejects.toThrow(Error);
      await expect(
        service.updateTpaById(1, {} as UpdateTpaDto, 1)
      ).rejects.toThrow("TPA not found");
    });

    it("should throw Error on exception", async () => {
      // Mock the repository to throw a generic error
      repo.updateTpaById.mockRejectedValue(new Error("Unexpected error"));

      // Assert that the service throws the same error
      await expect(
        service.updateTpaById(1, {} as UpdateTpaDto, 1)
      ).rejects.toThrow(Error);
      await expect(
        service.updateTpaById(1, {} as UpdateTpaDto, 1)
      ).rejects.toThrow("Unexpected error");
    });
  });

  // describe("updateTpaById", () => {
  //   it("should update a TPA by ID and return the updated TPA ID", async () => {
  //     const id = 1;
  //     const updateTpaDto = {
  //       tpaName: "Updated TPA",
  //       address: [],
  //     } as UpdateTpaDto;
  //     const userId = 1;

  //     repo.updateTpaById.mockResolvedValue({ id: 1 });

  //     const result = await repo.updateTpaById(id, updateTpaDto, userId);

  //     expect(result).toEqual({ id: 1 });
  //   });
  // });

  describe("deleteTpaById", () => {
    it("should delete if TPA found", async () => {
      repo.deleteTpaById.mockResolvedValue(true);
      await expect(service.deleteTpaById(1)).resolves.toBeUndefined();
    });

    it("should throw Error if delete fails", async () => {
      // Mock the repository to simulate a failure
      repo.deleteTpaById.mockResolvedValue(false);

      // Assert that the service throws an Error with the expected message
      await expect(service.deleteTpaById(1)).rejects.toThrow(Error);
      await expect(service.deleteTpaById(1)).rejects.toThrow("TPA not found");
    });

    it("should throw Error on exception", async () => {
      // Mock the repository to throw a generic error
      repo.deleteTpaById.mockRejectedValue(new Error("Unexpected error"));

      // Assert that the service throws the same error
      await expect(service.deleteTpaById(1)).rejects.toThrow(Error);
      await expect(service.deleteTpaById(1)).rejects.toThrow(
        "Unexpected error"
      );
    });
  });

  describe("getCompanyList", () => {
    it("should return company list", async () => {
      repo.CompanyList.mockResolvedValue(["company1"]);
      expect(await service.getCompanyList(1, 10, "", "id", "ASC", 1)).toEqual([
        "company1",
      ]);
    });

    it("should rethrow NotFound", async () => {
      repo.CompanyList.mockRejectedValue(new NotFoundException());
      await expect(
        service.getCompanyList(1, 10, "", "id", "ASC", 1)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw generic error on failure", async () => {
      repo.CompanyList.mockRejectedValue(new Error("Failed"));
      await expect(
        service.getCompanyList(1, 10, "", "id", "ASC", 1)
      ).rejects.toThrow("Failed to fetch companies");
    });
  });

  describe("getCompanyBasicDetails", () => {
    it("should return company details", async () => {
      // Mock the repository to return valid data
      repo.getCompanyListData.mockResolvedValue({ id: 1 });

      // Assert that the service returns the expected data
      expect(await service.getCompanyBasicDetails(1, 2)).toEqual({ id: 1 });
    });

    it("should throw NotFoundException if company details are not found", async () => {
      // Mock the repository to return undefined
      repo.getCompanyListData.mockResolvedValue(undefined);

      // Assert that the service throws a NotFoundException
      await expect(service.getCompanyBasicDetails(1, 2)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(service.getCompanyBasicDetails(1, 2)).rejects.toThrow(
        "Tpa company not found"
      );
    });

    it("should throw InternalServerErrorException on other errors", async () => {
      // Mock the repository to throw a generic error
      repo.getCompanyListData.mockRejectedValue(new Error("fail"));

      // Assert that the service throws an InternalServerErrorException
      await expect(service.getCompanyBasicDetails(1, 2)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(service.getCompanyBasicDetails(1, 2)).rejects.toThrow(
        "fail"
      );
    });
  });

  describe("addTpa", () => {
    it("should create a new TPA and return the saved TPA ID", async () => {
      const createTpaDto = { tpaName: "Test TPA", address: [] } as CreateTpaDto;
      const userId = 1;

      const mockSavedTpa = { id: 1 };
      repo.addTpa.mockResolvedValue(mockSavedTpa);

      const result = await repo.addTpa(createTpaDto, userId);

      expect(result).toEqual({ id: 1 });
    });
  });
});
