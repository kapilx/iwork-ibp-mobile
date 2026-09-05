import { Test, TestingModule } from "@nestjs/testing";
import { LookUpController } from "./look-up.controller";
import { LookUpService } from "./look-up.service";
import { CreateLookUpDto } from "./dto/create-look-up.dto";
import { UpdateLookUpDto } from "./dto/update-look-up.dto";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { LookUpDto } from "./dto/look-up.dto";

describe("LookUpController", () => {
  let controller: LookUpController;
  let service: LookUpService;
  let response: Response;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LookUpController],
      providers: [
        {
          provide: LookUpService,
          useValue: {
            getAllLookUps: jest.fn(),
            createLookUp: jest.fn(),
            getLookUpById: jest.fn(),
            updateLookUpById: jest.fn(),
            deleteLookUpById: jest.fn(),
            getLookUpsByKey: jest.fn(),
            getLookUpsByName: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LookUpController>(LookUpController);
    service = module.get<LookUpService>(LookUpService);
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
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
      jest.spyOn(service, "getAllLookUps").mockResolvedValue(result);

      await controller.getAllLookUps(response);

      expect(service.getAllLookUps).toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "LookUps retrieved successfully",
        data: result,
      });
    });
    it("should handle errors", async () => {
      jest
        .spyOn(service, "getAllLookUps")
        .mockRejectedValue(new Error("Error"));

      await controller.getAllLookUps(response);

      expect(service.getAllLookUps).toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "An error occurred while retrieving LookUps",
      });
    });
  });

  describe("create", () => {
    it("should create a new LookUp", async () => {
      const createLookUpDto: CreateLookUpDto = {
        lookUpKey: "testKey",
        lookUpName: "testName",
        lookUpValueKey: "testValueKey",
        lookUpValue: "testValue",
        description: "testDescription",
      };
      const result: LookUpDto = {
        id: 1,
        ...createLookUpDto,
      };
      jest.spyOn(service, "createLookUp").mockResolvedValue(result);

      await controller.createLookUp(createLookUpDto, response);

      expect(service.createLookUp).toHaveBeenCalledWith(createLookUpDto);
      expect(response.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.CREATED,
        message: "LookUp created successfully",
        data: result,
      });
    });
    it("should handle errors", async () => {
      const createLookUpDto: CreateLookUpDto = {
        lookUpKey: "testKey",
        lookUpName: "testName",
        lookUpValueKey: "testValueKey",
        lookUpValue: "testValue",
        description: "testDescription",
      };
      jest.spyOn(service, "createLookUp").mockRejectedValue(new Error("Error"));

      await controller.createLookUp(createLookUpDto, response);

      expect(service.createLookUp).toHaveBeenCalledWith(createLookUpDto);
      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Error",
      });
    });
  });

  describe("getLookUpById", () => {
    it("should return a single LookUp", async () => {
      const result: LookUpDto = {
        id: 1,
        lookUpKey: "testKey",
        lookUpName: "testName",
        lookUpValueKey: "testValueKey",
        lookUpValue: "testValue",
        description: "testDescription",
      };
      jest.spyOn(service, "getLookUpById").mockResolvedValue(result);

      await controller.getLookUpById(response, "1");

      expect(service.getLookUpById).toHaveBeenCalledWith(1);
      expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "LookUp retrieved successfully",
        data: result,
      });
    });

    it("should handle errors", async () => {
      jest
        .spyOn(service, "getLookUpById")
        .mockRejectedValue(new Error("Error"));

      await controller.getLookUpById(response, "1");

      expect(service.getLookUpById).toHaveBeenCalledWith(1);
      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Error",
      });
    });
  });

  describe("updateLookUp", () => {
    it("should updateLookUpById a LookUp", async () => {
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
        .spyOn(service, "updateLookUpById")
        .mockResolvedValue(result as LookUp);

      await controller.updateLookUpById(response, "1", updateLookUpDto);

      expect(service.updateLookUpById).toHaveBeenCalledWith(1, updateLookUpDto);
      expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "LookUp updated successfully",
        data: result,
      });
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
        .spyOn(service, "updateLookUpById")
        .mockRejectedValue(new Error("Error"));

      await controller.updateLookUpById(response, "1", updateLookUpDto);

      expect(service.updateLookUpById).toHaveBeenCalledWith(1, updateLookUpDto);
      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Error",
      });
    });
  });

  describe("removeLookUp", () => {
    it("should delete a LookUp", async () => {
      jest.spyOn(service, "deleteLookUpById").mockResolvedValue(undefined);

      await controller.deleteLookUpById(response, "1");

      expect(service.deleteLookUpById).toHaveBeenCalledWith(1);
      expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "LookUp deleted successfully",
      });
    });
  });

  it("should handle errors", async () => {
    jest
      .spyOn(service, "deleteLookUpById")
      .mockRejectedValue(new Error("Error"));

    await controller.deleteLookUpById(response, "1");

    expect(service.deleteLookUpById).toHaveBeenCalledWith(1);
    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR
    );
    expect(response.json).toHaveBeenCalledWith({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Error",
    });
  });

  describe("getLookUpsByName", () => {
    it("should return BAD_REQUEST if lookUpName is not provided", async () => {
      await controller.getLookUpsByName(undefined, response);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.BAD_REQUEST,
        message: "lookUpName is required",
      });
    });

    it("should return an array of LookUps by name", async () => {
      const result = [
        { id: 1, lookUpValue: "value1" },
        { id: 2, lookUpValue: "value2" },
      ];
      jest.spyOn(service, "getLookUpsByName").mockResolvedValue(result);

      await controller.getLookUpsByName("testName", response);

      expect(service.getLookUpsByName).toHaveBeenCalledWith("TESTNAME");
      expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "LookUps retrieved successfully",
        data: result,
      });
    });

    it("should handle errors", async () => {
      jest
        .spyOn(service, "getLookUpsByName")
        .mockRejectedValue(new Error("Error"));

      await controller.getLookUpsByName("testName", response);

      expect(service.getLookUpsByName).toHaveBeenCalledWith("TESTNAME");
      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Error",
        data: undefined,
      });
    });
  });

  describe("getLookUpsByKey", () => {
    it("should return BAD_REQUEST if lookUpKey is not provided", async () => {
      await controller.getLookUpsByKey(undefined, response);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.BAD_REQUEST,
        message: "lookUpKey is required",
      });
    });

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
      jest.spyOn(service, "getLookUpsByKey").mockResolvedValue(result);

      await controller.getLookUpsByKey("testKey", response);

      expect(service.getLookUpsByKey).toHaveBeenCalledWith("TESTKEY");
      expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "LookUps retrieved successfully",
        data: result,
      });
    });

    it("should handle errors", async () => {
      jest
        .spyOn(service, "getLookUpsByKey")
        .mockRejectedValue(new Error("Error"));

      await controller.getLookUpsByKey("testKey", response);

      expect(service.getLookUpsByKey).toHaveBeenCalledWith("TESTKEY");
      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(response.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Error",
        data: undefined,
      });
    });
  });
});
