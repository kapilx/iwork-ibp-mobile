import { Test, TestingModule } from "@nestjs/testing";
import { LookUpRepository } from "./look-up.repository";
import { Repository } from "typeorm";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { CreateLookUpDto } from "./dto/create-look-up.dto";
import { UpdateLookUpDto } from "./dto/update-look-up.dto";
import { DEFAULT_VALUES } from "../../../../service-lib/src/lib/constants";

describe("LookUpRepository", () => {
  let repository: LookUpRepository;
  let mockRepository: Repository<LookUp>;

  const mockLookUpRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LookUpRepository,
        {
          provide: getRepositoryToken(LookUp),
          useValue: mockLookUpRepository,
        },
      ],
    }).compile();

    repository = module.get<LookUpRepository>(LookUpRepository);
    mockRepository = module.get<Repository<LookUp>>(getRepositoryToken(LookUp));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllLookUps", () => {
    it("should retrieve all LookUps with pagination", async () => {
      const mockLookUps = [
        {
          id: 1,
          lookUpName: "Test1",
          lookUpKey: "Key1",
          lookUpValue: "Value1",
        },
        {
          id: 2,
          lookUpName: "Test2",
          lookUpKey: "Key2",
          lookUpValue: "Value2",
        },
      ];
      mockLookUpRepository.find.mockResolvedValue(mockLookUps);

      const result = await repository.getAllLookUps("Test", "id", "ASC", 1, 10);

      expect(mockLookUpRepository.find).toHaveBeenCalledWith({
        select: expect.any(Object),
        where: { lookUpName: expect.any(Object) },
        order: { id: "ASC" },
      });
      expect(result).toEqual({ data: mockLookUps });
    });
  });

  describe("createLookUp", () => {
    it("should create a new LookUp", async () => {
      const mockCreateDto: CreateLookUpDto = {
        lookUpName: "Test",
        lookUpKey: "Key",
        lookUpValueKey: "ValueKey",
        lookUpValue: "Value",
        description: "Description",
      };
      const mockSavedLookUp = { id: 1, ...mockCreateDto };
      mockLookUpRepository.save.mockResolvedValue(mockSavedLookUp);

      const result = await repository.createLookUp(mockCreateDto);

      expect(mockLookUpRepository.save).toHaveBeenCalledWith({
        ...mockCreateDto,
        createdBy: DEFAULT_VALUES.CREATED_BY,
        updatedBy: DEFAULT_VALUES.UPDATED_BY,
      });
      expect(result).toEqual(mockSavedLookUp);
    });
  });

  describe("getLookUpById", () => {
    it("should retrieve a LookUp by ID", async () => {
      const mockLookUp = { id: 1, lookUpName: "Test" };
      mockLookUpRepository.findOne.mockResolvedValue(mockLookUp);

      const result = await repository.getLookUpById(1);

      expect(mockLookUpRepository.findOne).toHaveBeenCalledWith({
        select: expect.any(Object),
        where: { id: 1 },
      });
      expect(result).toEqual({ data: mockLookUp });
    });

    it("should throw an error if LookUp is not found", async () => {
      mockLookUpRepository.findOne.mockResolvedValue(null);

      await expect(repository.getLookUpById(1)).rejects.toThrow(
        "LookUp with ID 1 not found"
      );
    });
  });

  describe("updateLookUpById", () => {
    it("should update a LookUp by ID", async () => {
      const mockUpdateDto: UpdateLookUpDto = { lookUpName: "Updated Name" };
      const mockLookUp = { id: 1, lookUpName: "Test" };
      jest
        .spyOn(repository, "getLookUpById")
        .mockResolvedValue({ data: mockLookUp });

      const result = await repository.updateLookUpById(1, mockUpdateDto);

      expect(mockLookUpRepository.update).toHaveBeenCalledWith(1, {
        ...mockUpdateDto,
        updatedBy: DEFAULT_VALUES.UPDATED_BY,
      });
      expect(result).toEqual({ data: mockLookUp });
    });

    it("should throw an error if LookUp is not found", async () => {
      jest
        .spyOn(repository, "getLookUpById")
        .mockRejectedValue(new Error("Not found"));

      await expect(repository.updateLookUpById(1, {})).rejects.toThrow(
        "Not found"
      );
    });
  });

  describe("deleteLookUpById", () => {
    it("should delete a LookUp by ID", async () => {
      const mockLookUp = { id: 1, lookUpName: "Test" };
      jest
        .spyOn(repository, "getLookUpById")
        .mockResolvedValue({ data: mockLookUp });

      await repository.deleteLookUpById(1);

      expect(mockLookUpRepository.delete).toHaveBeenCalledWith(1);
    });

    it("should throw an error if LookUp is not found", async () => {
      jest
        .spyOn(repository, "getLookUpById")
        .mockRejectedValue(new Error("Not found"));

      await expect(repository.deleteLookUpById(1)).rejects.toThrow("Not found");
    });
  });

  describe("findByLookUpName", () => {
    it("should fetch LookUps by name", async () => {
      const mockLookUps = [{ id: 1, lookUpName: "Test", lookUpValue: "Value" }];
      mockLookUpRepository.find.mockResolvedValue(mockLookUps);

      const result = await repository.findByLookUpName("Test");

      expect(mockLookUpRepository.find).toHaveBeenCalledWith({
        where: { lookUpName: "Test" },
      });
      expect(result).toEqual([
        { id: 1, lookUpName: "Test", lookUpValue: "Value" },
      ]);
    });
  });

  describe("findByLookUpKey", () => {
    it("should fetch LookUps by key", async () => {
      const mockLookUps = [
        { id: 1, lookUpKey: "Key", lookUpValue: "Value", lookUpName: "Test" },
      ];
      mockLookUpRepository.find.mockResolvedValue(mockLookUps);

      const result = await repository.findByLookUpKey("Key");

      expect(mockLookUpRepository.find).toHaveBeenCalledWith({
        where: { lookUpKey: "Key" },
      });
      expect(result).toEqual([
        { id: 1, lookUpKey: "Key", lookUpValue: "Value", lookUpName: "Test" },
      ]);
    });
  });
});
