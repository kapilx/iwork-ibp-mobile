import { Test, TestingModule } from "@nestjs/testing";
import { LookUpService } from "./look-up.service";
import { LookUpRepository } from "./look-up.repository";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { CreateLookUpDto } from "./dto/create-look-up.dto";
import { UpdateLookUpDto } from "./dto/update-look-up.dto";
import { HttpStatus, InternalServerErrorException } from "@nestjs/common";
import { createErrorResponse } from "../../../../service-lib/src/lib/utils/response.utils";
import { LookUpDto } from "./dto/look-up.dto";

describe("LookUpService", () => {
  let service: LookUpService;
  let repository: LookUpRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LookUpService,
        {
          provide: LookUpRepository,
          useValue: {
            getAllLookUps: jest.fn(),
            createLookUp: jest.fn(),
            getLookUpById: jest.fn(),
            updateLookUpById: jest.fn(),
            deleteLookUpById: jest.fn(),
            findByLookUpKey: jest.fn(),
            findByLookUpName: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LookUpService>(LookUpService);
    repository = module.get<LookUpRepository>(LookUpRepository);
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getAllLookUps", () => {
    it("should return an array of LookUps", async () => {
      const result: LookUpDto[] = [
        {
          id: 1,
          lookUpKey: "testKey1",
          lookUpName: "testName1",
          lookUpValueKey: "testValueKey1",
          lookUpValue: "testValue1",
          description: "testDescription1",
        },
      ];
      jest.spyOn(repository, "getAllLookUps").mockResolvedValue(result);

      expect(await service.getAllLookUps()).toEqual(result);
    });

    it("should handle errors", async () => {
      jest
        .spyOn(repository, "getAllLookUps")
        .mockRejectedValue(new Error("Error"));

      const result = await service.getAllLookUps();

      expect(result).toEqual({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Error",
        data: undefined,
      });
    });
  });

  describe("createLookUp", () => {
    it("should create a new LookUp", async () => {
      const createLookUpDto = {
        lookUpKey: "testKey",
        lookUpName: "testName",
        lookUpValueKey: "testValueKey",
        lookUpValue: "testValue",
        description: "testDescription",
      };
      const result = {
        id: 1,
        ...createLookUpDto,
      };
      jest.spyOn(repository, "createLookUp").mockResolvedValue(result);

      expect(await service.createLookUp(createLookUpDto)).toEqual(result);
    });

    it("should handle errors", async () => {
      const createLookUpDto = {
        lookUpKey: "testKey",
        lookUpName: "testName",
        lookUpValueKey: "testValueKey",
        lookUpValue: "testValue",
        description: "testDescription",
      };
      jest
        .spyOn(repository, "createLookUp")
        .mockRejectedValue(new InternalServerErrorException("Error"));

      await expect(service.createLookUp(createLookUpDto)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("getLookUpById", () => {
    it("should return a single LookUp by ID", async () => {
      const result = {
        id: 1,
        lookUpKey: "testKey",
        lookUpName: "testName",
        lookUpValueKey: "testValueKey",
        lookUpValue: "testValue",
        description: "testDescription",
      };

      jest
        .spyOn(repository, "getLookUpById")
        .mockResolvedValue({ data: result });

      const response = await service.getLookUpById(1);

      expect(response).toEqual({ data: result });
    });

    it("should handle errors", async () => {
      jest
        .spyOn(repository, "getLookUpById")
        .mockRejectedValue(new InternalServerErrorException("Error"));

      await expect(service.getLookUpById(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("updateLookUpById", () => {
    it("should updateLookUpById a LookUp by ID", async () => {
      const updateLookUpDto: UpdateLookUpDto = {
        lookUpKey: "updatedKey",
        lookUpName: "updatedName",
        lookUpValueKey: "updatedValueKey",
        lookUpValue: "updatedValue",
        description: "updatedDescription",
      };
      const result = {
        id: 1,
        ...updateLookUpDto,
      };
      jest
        .spyOn(repository, "updateLookUpById")
        .mockResolvedValue(result as LookUp);

      expect(await service.updateLookUpById(1, updateLookUpDto)).toEqual(
        result
      );
    });

    it("should handle errors", async () => {
      const updateLookUpDto: UpdateLookUpDto = {
        lookUpKey: "updatedKey",
        lookUpName: "updatedName",
        lookUpValueKey: "updatedValueKey",
        lookUpValue: "updatedValue",
        description: "updatedDescription",
      };
      jest
        .spyOn(repository, "updateLookUpById")
        .mockRejectedValue(
          new InternalServerErrorException(
            createErrorResponse(
              HttpStatus.INTERNAL_SERVER_ERROR,
              "Failed to updateLookUpById LookUp"
            )
          )
        );

      await expect(
        service.updateLookUpById(1, updateLookUpDto)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("deleteLookUpById", () => {
    it("should delete a LookUp by ID", async () => {
      jest.spyOn(repository, "deleteLookUpById").mockResolvedValue(undefined);

      expect(await service.deleteLookUpById(1)).toBeUndefined();
    });

    it("should handle errors", async () => {
      jest
        .spyOn(repository, "deleteLookUpById")
        .mockRejectedValue(
          new InternalServerErrorException(
            createErrorResponse(
              HttpStatus.INTERNAL_SERVER_ERROR,
              "Failed to deleteLookUpById LookUp"
            )
          )
        );

      await expect(service.deleteLookUpById(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("getLookUpsByName", () => {
    it("should return an array of LookUps by name", async () => {
      const result = [
        { id: 1, lookUpValue: "value1" },
        { id: 2, lookUpValue: "value2" },
      ];
      jest.spyOn(repository, "findByLookUpName").mockResolvedValue(result);

      const response = await service.getLookUpsByName("testName");

      expect(repository.findByLookUpName).toHaveBeenCalledWith("testName");
      expect(response).toEqual(result);
    });

    it("should handle errors", async () => {
      jest
        .spyOn(repository, "findByLookUpName")
        .mockRejectedValue(new Error("Error"));

      await expect(service.getLookUpsByName("testName")).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("getLookUpsByKey", () => {
    it("should return an array of LookUps by key", async () => {
      const result = [
        {
          id: 1,
          lookUpValue: "value1",
          lookUpKey: "key1",
          lookUpName: "name1",
        },
        {
          id: 2,
          lookUpValue: "value2",
          lookUpKey: "key2",
          lookUpName: "name2",
        },
      ];
      jest.spyOn(repository, "findByLookUpKey").mockResolvedValue(result);

      const response = await service.getLookUpsByKey("testKey");

      expect(repository.findByLookUpKey).toHaveBeenCalledWith("testKey");
      expect(response).toEqual(result);
    });

    it("should handle errors", async () => {
      jest
        .spyOn(repository, "findByLookUpKey")
        .mockRejectedValue(new Error("Error"));

      await expect(service.getLookUpsByKey("testKey")).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });
});
