import { Test, TestingModule } from "@nestjs/testing";
import { MasterController } from "./master.controller";
import { MasterService } from "./master.service";
import { getEntityByName } from "../../../../service-lib/src/lib/utils/get-entity.utils";
import {
  createResponse,
  createErrorResponse,
} from "../../../../service-lib/src/lib/utils/response.utils";
import { HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { GetLookUpsQueryDto } from "../look-up/dto/look-up-query-param.dto";
import { mock } from "node:test";

jest.mock("../../../../service-lib/src/lib/utils/get-entity.utils", () => ({
  getEntityByName: jest.fn(),
}));

describe("MasterController", () => {
  let controller: MasterController;
  let service: MasterService;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    const mockMasterService = {
      getAllRecords: jest.fn(),
      getRecordById: jest.fn(),
      createRecord: jest.fn(),
      updateRecordById: jest.fn(),
      deleteRecordById: jest.fn(),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MasterController],
      providers: [
        {
          provide: MasterService,
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<MasterController>(MasterController);
    service = module.get<MasterService>(MasterService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getAllRecords", () => {
    it("should return all records for a valid entity", async () => {
      const mockEntity = "lookup";
      const mockQuery: GetLookUpsQueryDto = {
        search: "test",
        searchBy: "name",
        sortBy: "id",
        sortOrder: "ASC",
        page: 1,
        limit: 10,
      };
      const mockEntityClass = { name: "LookupEntity" }; // Mocked entity class
      const mockRecords = [{ id: 1, name: "Test Record" }];
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Mock `getEntityByName` to return the mocked entity class
      (getEntityByName as jest.Mock).mockReturnValue(mockEntityClass);

      // Mock `masterService.getAllRecords` to return the mocked records
      jest.spyOn(service, "getAllRecords").mockResolvedValue(mockRecords);

      // Call the controller method
      await controller.getAllRecords(mockEntity, mockResponse, mockQuery);

      // Assertions
      expect(getEntityByName).toHaveBeenCalledWith(mockEntity);
      expect(service.getAllRecords).toHaveBeenCalledWith(
        mockEntityClass,
        mockQuery.search,
        mockQuery.searchBy,
        mockQuery.sortBy,
        mockQuery.sortOrder,
        mockQuery.page,
        mockQuery.limit
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "Records retrieved successfully",
        data: mockRecords,
      });
    });

    it("should handle errors when retrieving records", async () => {
      const mockEntity = "invalidEntity";
      (getEntityByName as jest.Mock).mockImplementation(() => {
        throw new Error("Entity not found");
      });

      await controller.getAllRecords(mockEntity, mockResponse as Response);

      expect(getEntityByName).toHaveBeenCalledWith(mockEntity);
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Entity not found",
        data: undefined,
      });
    });
  });

  describe("getRecordById", () => {
    it("should return a record for a valid entity and ID", async () => {
      const mockEntity = "lookup";
      const mockId = "1";
      const mockRecord = { id: 1, name: "Test Record" };
      (getEntityByName as jest.Mock).mockReturnValue(mockEntity);
      jest.spyOn(service, "getRecordById").mockResolvedValue(mockRecord);

      await controller.getRecordById(
        mockEntity,
        mockId,
        mockResponse as Response
      );

      expect(getEntityByName).toHaveBeenCalledWith(mockEntity);
      expect(service.getRecordById).toHaveBeenCalledWith(mockEntity, mockId);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "Record retrieved successfully",
        data: mockRecord,
      });
    });

    it("should handle errors when retrieving a record by ID", async () => {
      const mockEntity = "lookup";
      const mockId = "1";
      (getEntityByName as jest.Mock).mockReturnValue(mockEntity);
      jest
        .spyOn(service, "getRecordById")
        .mockRejectedValue(new Error("Failed to retrieve record"));

      await controller.getRecordById(
        mockEntity,
        mockId,
        mockResponse as Response
      );

      expect(getEntityByName).toHaveBeenCalledWith(mockEntity);
      expect(service.getRecordById).toHaveBeenCalledWith(mockEntity, mockId);
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Failed to retrieve record",
        data: undefined,
      });
    });
  });

  describe("createRecord", () => {
    it("should create a new record for a valid entity", async () => {
      const mockEntity = "lookup";
      const mockData = { name: "New Record" };
      const mockCreatedRecord = { id: 1, ...mockData };
      (getEntityByName as jest.Mock).mockReturnValue(mockEntity);
      jest.spyOn(service, "createRecord").mockResolvedValue(mockCreatedRecord);

      await controller.createRecord(
        mockEntity,
        mockData,
        mockResponse as Response
      );

      expect(getEntityByName).toHaveBeenCalledWith(mockEntity);
      expect(service.createRecord).toHaveBeenCalledWith(mockEntity, mockData);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.CREATED,
        message: "Record created successfully",
        data: mockCreatedRecord,
      });
    });

    it("should handle errors when creating a record", async () => {
      const mockEntity = "lookup";
      const mockData = { name: "New Record" };
      (getEntityByName as jest.Mock).mockReturnValue(mockEntity);
      jest
        .spyOn(service, "createRecord")
        .mockRejectedValue(new Error("Failed to create record"));

      await controller.createRecord(
        mockEntity,
        mockData,
        mockResponse as Response
      );

      expect(getEntityByName).toHaveBeenCalledWith(mockEntity);
      expect(service.createRecord).toHaveBeenCalledWith(mockEntity, mockData);
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Failed to create record",
        data: undefined,
      });
    });
  });

  describe("updateRecordById", () => {
    it("should update a record for a valid entity and ID", async () => {
      const mockEntity = "lookup";
      const mockId = "1";
      const mockData = { name: "Updated Record" };
      const mockUpdatedRecord = { id: 1, ...mockData };
      (getEntityByName as jest.Mock).mockReturnValue(mockEntity);
      jest
        .spyOn(service, "updateRecordById")
        .mockResolvedValue(mockUpdatedRecord);

      await controller.updateRecordById(
        mockEntity,
        mockId,
        mockData,
        mockResponse as Response
      );

      expect(getEntityByName).toHaveBeenCalledWith(mockEntity);
      expect(service.updateRecordById).toHaveBeenCalledWith(
        mockEntity,
        mockId,
        mockData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "Record updated successfully",
        data: mockUpdatedRecord,
      });
    });

    it("should handle errors when updating a record", async () => {
      const mockEntity = "lookup";
      const mockId = "1";
      const mockData = { name: "Updated Record" };
      (getEntityByName as jest.Mock).mockReturnValue(mockEntity);
      jest
        .spyOn(service, "updateRecordById")
        .mockRejectedValue(new Error("Failed to update record"));

      await controller.updateRecordById(
        mockEntity,
        mockId,
        mockData,
        mockResponse as Response
      );

      expect(getEntityByName).toHaveBeenCalledWith(mockEntity);
      expect(service.updateRecordById).toHaveBeenCalledWith(
        mockEntity,
        mockId,
        mockData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Failed to update record",
        data: undefined,
      });
    });
  });

  describe("deleteRecordById", () => {
    it("should delete a record for a valid entity and ID", async () => {
      const mockEntity = "lookup";
      const mockId = "1";
      (getEntityByName as jest.Mock).mockReturnValue(mockEntity);
      jest.spyOn(service, "deleteRecordById").mockResolvedValue();

      await controller.deleteRecordById(
        mockEntity,
        mockId,
        mockResponse as Response
      );

      expect(getEntityByName).toHaveBeenCalledWith(mockEntity);
      expect(service.deleteRecordById).toHaveBeenCalledWith(mockEntity, mockId);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: "Record deleted successfully",
        data: undefined,
      });
    });

    it("should handle errors when deleting a record", async () => {
      const mockEntity = "lookup";
      const mockId = "1";
      (getEntityByName as jest.Mock).mockReturnValue(mockEntity);
      jest
        .spyOn(service, "deleteRecordById")
        .mockRejectedValue(new Error("Failed to delete record"));

      await controller.deleteRecordById(
        mockEntity,
        mockId,
        mockResponse as Response
      );

      expect(getEntityByName).toHaveBeenCalledWith(mockEntity);
      expect(service.deleteRecordById).toHaveBeenCalledWith(mockEntity, mockId);
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Failed to delete record",
        data: undefined,
      });
    });
  });
});
