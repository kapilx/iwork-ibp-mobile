import { Test, TestingModule } from "@nestjs/testing";
import { MasterRepository } from "./master.repository";
import { DataSource, Repository } from "typeorm";
import { InternalServerErrorException } from "@nestjs/common";
import { DEFAULT_VALUES } from "../../../../service-lib/src/lib/constants";
import { getSelectableColumns } from "../../../../service-lib/src/lib/utils/entity-selection.utils";

jest.mock(
  "../../../../service-lib/src/lib/utils/entity-selection.utils",
  () => ({
    getSelectableColumns: jest.fn(),
  })
);

describe("MasterRepository", () => {
  let repository: MasterRepository;
  let mockDataSource: DataSource;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    metadata: {
      columns: [{ propertyName: "id" }, { propertyName: "name" }],
    },
  };

  const mockDataSourceFactory = {
    getRepository: jest.fn().mockReturnValue(mockRepository),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MasterRepository,
        {
          provide: DataSource,
          useValue: mockDataSourceFactory,
        },
      ],
    }).compile();

    repository = module.get<MasterRepository>(MasterRepository);
    mockDataSource = module.get<DataSource>(DataSource);

    // Mock getSelectableColumns to return column names
    (getSelectableColumns as jest.Mock).mockReturnValue(["id", "name"]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllRecords", () => {
    it("should retrieve all records with pagination", async () => {
      const mockEntityClass = "TestEntity";
      const mockRecords = [
        { id: 1, name: "Record1" },
        { id: 2, name: "Record2" },
      ];
      mockRepository.find.mockResolvedValue(mockRecords);

      const result = await repository.getAllRecords(
        mockEntityClass,
        "search",
        "name",
        "id",
        "ASC",
        1,
        10
      );

      expect(mockDataSource.getRepository).toHaveBeenCalledWith(
        mockEntityClass
      );
      expect(mockRepository.find).toHaveBeenCalledWith({
        select: ["id", "name"],
        where: { name: expect.any(Object) },
        order: { id: "ASC" },
      });
      expect(result).toEqual({ data: mockRecords });
    });

    it("should throw an error if the entity is invalid", async () => {
      mockDataSource.getRepository.mockReturnValue(null);

      await expect(repository.getAllRecords("InvalidEntity")).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("getRecordById", () => {
    it("should retrieve a record by ID", async () => {
      const mockEntityClass = "TestEntity";
      const mockRecord = { id: 1, name: "Record1" };

      // Ensure getRepository returns the mockRepository
      mockDataSource.getRepository.mockReturnValue(mockRepository);
      mockRepository.findOne.mockResolvedValue(mockRecord);

      const result = await repository.getRecordById(mockEntityClass, "1");

      expect(mockDataSource.getRepository).toHaveBeenCalledWith(
        mockEntityClass
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        select: ["id", "name"], // Ensure columns are mocked properly
        where: { id: "1" },
      });
      expect(result).toEqual({ data: mockRecord });
    });

    it("should throw an error if the record is not found", async () => {
      const mockEntityClass = "TestEntity";

      // Ensure getRepository returns the mockRepository
      mockDataSource.getRepository.mockReturnValue(mockRepository);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        repository.getRecordById(mockEntityClass, "1")
      ).rejects.toThrow(InternalServerErrorException);

      expect(mockDataSource.getRepository).toHaveBeenCalledWith(
        mockEntityClass
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        select: ["id", "name"], // Ensure columns are mocked properly
        where: { id: "1" },
      });
    });
  });

  describe("createRecord", () => {
    it("should create a new record", async () => {
      const mockEntityClass = "TestEntity";
      const mockData = { name: "New Record" };
      const mockSavedRecord = { id: 1, ...mockData };
      mockRepository.save.mockResolvedValue(mockSavedRecord);

      const result = await repository.createRecord(mockEntityClass, mockData);

      expect(mockDataSource.getRepository).toHaveBeenCalledWith(
        mockEntityClass
      );
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockData,
        createdBy: DEFAULT_VALUES.CREATED_BY,
        updatedBy: DEFAULT_VALUES.UPDATED_BY,
      });
      expect(result).toEqual(mockSavedRecord);
    });

    it("should throw an error if the entity is invalid", async () => {
      mockDataSource.getRepository.mockReturnValue(null);

      await expect(
        repository.createRecord("InvalidEntity", {})
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("updateRecordById", () => {
    it("should update a record by ID", async () => {
      const mockEntityClass = "TestEntity";
      const mockData = { name: "Updated Record" };
      const mockExistingRecord = { id: 1, name: "Old Record" };
      const mockUpdatedRecord = { id: 1, ...mockData };

      // Ensure getRepository returns the mockRepository
      mockDataSource.getRepository.mockReturnValue(mockRepository);

      // Mock findOne to simulate the existing record
      mockRepository.findOne.mockResolvedValueOnce(mockExistingRecord);

      // Mock findOne again to simulate the updated record
      mockRepository.findOne.mockResolvedValueOnce(mockUpdatedRecord);

      const result = await repository.updateRecordById(
        mockEntityClass,
        "1",
        mockData
      );

      expect(mockDataSource.getRepository).toHaveBeenCalledWith(
        mockEntityClass
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "1" },
      });
      expect(mockRepository.update).toHaveBeenCalledWith("1", {
        ...mockData,
        updatedBy: DEFAULT_VALUES.UPDATED_BY,
      });
      expect(result).toEqual(mockUpdatedRecord);
    });

    it("should throw an error if the record is not found", async () => {
      const mockEntityClass = "TestEntity";

      // Ensure getRepository returns the mockRepository
      mockDataSource.getRepository.mockReturnValue(mockRepository);

      // Mock findOne to simulate no record found
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        repository.updateRecordById(mockEntityClass, "1", {})
      ).rejects.toThrow(InternalServerErrorException);

      expect(mockDataSource.getRepository).toHaveBeenCalledWith(
        mockEntityClass
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });
  });

  describe("deleteRecordById", () => {
    it("should delete a record by ID", async () => {
      const mockEntityClass = "TestEntity";
      const mockRecord = { id: 1, name: "Record1" };
      mockRepository.findOne.mockResolvedValue(mockRecord);

      await repository.deleteRecordById(mockEntityClass, "1");

      expect(mockDataSource.getRepository).toHaveBeenCalledWith(
        mockEntityClass
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "1" },
      });
      expect(mockRepository.delete).toHaveBeenCalledWith("1");
    });

    it("should throw an error if the record is not found", async () => {
      const mockEntityClass = "TestEntity";
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        repository.deleteRecordById(mockEntityClass, "1")
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
