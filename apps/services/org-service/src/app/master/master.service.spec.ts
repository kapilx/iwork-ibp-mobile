import { Test, TestingModule } from "@nestjs/testing";
import { MasterService } from "./master.service";
import { MasterRepository } from "./master.repository";
import { InternalServerErrorException } from "@nestjs/common";

describe("MasterService", () => {
  let service: MasterService;
  let repository: MasterRepository;

  beforeEach(async () => {
    const mockMasterRepository = {
      getAllRecords: jest.fn(),
      getRecordById: jest.fn(),
      createRecord: jest.fn(),
      updateRecordById: jest.fn(),
      deleteRecordById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MasterService,
        {
          provide: MasterRepository,
          useValue: mockMasterRepository,
        },
      ],
    }).compile();

    service = module.get<MasterService>(MasterService);
    repository = module.get<MasterRepository>(MasterRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getAllRecords", () => {
    it("should return all records for a valid entity", async () => {
      const mockEntityClass = "lookup";
      const mockSearch = "test";
      const mockSortBy = "id";
      const mockSearchBy = "name";
      const mockSortOrder: "ASC" | "DESC" = "ASC";
      const mockPage = 1;
      const mockLimit = 10;
      const mockRecords = [{ id: 1, name: "Test Record" }];
      jest.spyOn(repository, "getAllRecords").mockResolvedValue(mockRecords);

      const result = await service.getAllRecords(
        mockEntityClass,
        mockSearch,
        mockSortBy,
        mockSearchBy,
        mockSortOrder,
        mockPage,
        mockLimit
      );

      expect(repository.getAllRecords).toHaveBeenCalledWith(
        mockEntityClass,
        mockSearch,
        mockSortBy,
        mockSearchBy,
        mockSortOrder,
        mockPage,
        mockLimit
      );
      expect(result).toEqual(mockRecords);
    });

    it("should throw an InternalServerErrorException if the repository throws an error", async () => {
      const mockEntityClass = "lookup";
      jest
        .spyOn(repository, "getAllRecords")
        .mockRejectedValue(new Error("Repository error"));

      await expect(service.getAllRecords(mockEntityClass)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("getRecordById", () => {
    it("should return a record for a valid entity and ID", async () => {
      const mockEntityClass = "lookup";
      const mockId = "1";
      const mockRecord = { id: 1, name: "Test Record" };
      jest.spyOn(repository, "getRecordById").mockResolvedValue(mockRecord);

      const result = await service.getRecordById(mockEntityClass, mockId);

      expect(repository.getRecordById).toHaveBeenCalledWith(
        mockEntityClass,
        mockId
      );
      expect(result).toEqual(mockRecord);
    });

    it("should throw an InternalServerErrorException if the repository throws an error", async () => {
      const mockEntityClass = "lookup";
      const mockId = "1";
      jest
        .spyOn(repository, "getRecordById")
        .mockRejectedValue(new Error("Repository error"));

      await expect(
        service.getRecordById(mockEntityClass, mockId)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("createRecord", () => {
    it("should create a new record for a valid entity", async () => {
      const mockEntityClass = "lookup";
      const mockData = { name: "New Record" };
      const mockCreatedRecord = { id: 1, ...mockData };
      jest
        .spyOn(repository, "createRecord")
        .mockResolvedValue(mockCreatedRecord);

      const result = await service.createRecord(mockEntityClass, mockData);

      expect(repository.createRecord).toHaveBeenCalledWith(
        mockEntityClass,
        mockData
      );
      expect(result).toEqual(mockCreatedRecord);
    });

    it("should throw an InternalServerErrorException if the repository throws an error", async () => {
      const mockEntityClass = "lookup";
      const mockData = { name: "New Record" };
      jest
        .spyOn(repository, "createRecord")
        .mockRejectedValue(new Error("Repository error"));

      await expect(
        service.createRecord(mockEntityClass, mockData)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("updateRecordById", () => {
    it("should update a record for a valid entity and ID", async () => {
      const mockEntityClass = "lookup";
      const mockId = "1";
      const mockData = { name: "Updated Record" };
      const mockUpdatedRecord = { id: 1, ...mockData };
      jest
        .spyOn(repository, "updateRecordById")
        .mockResolvedValue(mockUpdatedRecord);

      const result = await service.updateRecordById(
        mockEntityClass,
        mockId,
        mockData
      );

      expect(repository.updateRecordById).toHaveBeenCalledWith(
        mockEntityClass,
        mockId,
        mockData
      );
      expect(result).toEqual(mockUpdatedRecord);
    });

    it("should throw an InternalServerErrorException if the repository throws an error", async () => {
      const mockEntityClass = "lookup";
      const mockId = "1";
      const mockData = { name: "Updated Record" };
      jest
        .spyOn(repository, "updateRecordById")
        .mockRejectedValue(new Error("Repository error"));

      await expect(
        service.updateRecordById(mockEntityClass, mockId, mockData)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("deleteRecordById", () => {
    it("should delete a record for a valid entity and ID", async () => {
      const mockEntityClass = "lookup";
      const mockId = "1";
      jest.spyOn(repository, "deleteRecordById").mockResolvedValue();

      await service.deleteRecordById(mockEntityClass, mockId);

      expect(repository.deleteRecordById).toHaveBeenCalledWith(
        mockEntityClass,
        mockId
      );
    });

    it("should throw an InternalServerErrorException if the repository throws an error", async () => {
      const mockEntityClass = "lookup";
      const mockId = "1";
      jest
        .spyOn(repository, "deleteRecordById")
        .mockRejectedValue(new Error("Repository error"));

      await expect(
        service.deleteRecordById(mockEntityClass, mockId)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
