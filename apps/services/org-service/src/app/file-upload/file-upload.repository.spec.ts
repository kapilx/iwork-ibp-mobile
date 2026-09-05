import { Test, TestingModule } from "@nestjs/testing";
import { FileUploadRepository } from "./file-upload.repository";
import { Repository } from "typeorm";
import { FileUpload } from "../../../../service-lib/src/lib/entities/file-upload.entity";
import { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import {
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import * as fs from "fs";
import { join } from "path";

jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  promises: {
    writeFile: jest.fn(),
  },
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  renameSync: jest.fn(),
}));

describe("FileUploadRepository", () => {
  let repository: FileUploadRepository;
  let mockFileUploadRepository: jest.Mocked<Repository<FileUpload>>;
  let mockCompanyRepository: jest.Mocked<Repository<Company>>;

  const mockFile = {
    originalname: "test-file.txt",
    buffer: Buffer.from("test content"),
    size: 1024,
  } as Express.Multer.File;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  } as any;

  beforeEach(async () => {
    mockFileUploadRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    mockCompanyRepository = {
      findOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadRepository,
        {
          provide: "FileUploadRepository",
          useValue: mockFileUploadRepository,
        },
        {
          provide: "CompanyRepository",
          useValue: mockCompanyRepository,
        },
      ],
    }).compile();

    repository = module.get<FileUploadRepository>(FileUploadRepository);

    // Mock console.error
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getCompanyNameById", () => {
    it("should return the company name if the company exists", async () => {
      const mockCompany = { id: 1, displayName: "Test Company" };
      mockCompanyRepository.findOne.mockResolvedValue(mockCompany);

      const result = await repository.getCompanyNameById(1);

      expect(mockCompanyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBe("Test Company");
    });

    it("should throw a NotFoundException if the company does not exist", async () => {
      mockCompanyRepository.findOne.mockResolvedValue(null);

      await expect(repository.getCompanyNameById(1)).rejects.toThrow(
        new NotFoundException("Company not found")
      );
    });
  });

  describe("uploadToServer", () => {
    it("should upload a file to the local server successfully", async () => {
      const mockCompanyName = "test-company";
      const mockCompanyType = "insurance";
      const mockDocumentType = "policy";

      jest
        .spyOn(repository, "getCompanyNameById")
        .mockResolvedValue(mockCompanyName);
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      mockFileUploadRepository.create.mockReturnValue({ id: 1 } as any);
      mockFileUploadRepository.save.mockResolvedValue({ id: 1 });

      await repository.uploadToServer(
        mockFile,
        mockCompanyType,
        1,
        mockDocumentType,
        123,
        mockResponse
      );

      expect(fs.promises.writeFile).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: "File uploaded successfully",
        })
      );
    });
  });

  describe("deleteFile", () => {
    it("should delete a file and move it to the deleted folder", async () => {
      const mockFileUpload = {
        id: 1,
        companyType: "insurance",
        companyId: 123,
        documentType: "policy",
        fileUrl: "uploads/insurance/uploads/example.pdf",
      };

      jest
        .spyOn(repository.fileUploadRepository, "findOne")
        .mockResolvedValue(mockFileUpload);

      jest
        .spyOn(repository, "getCompanyNameById")
        .mockResolvedValue("test-company");
      jest.spyOn(fs, "existsSync").mockReturnValue(true);
      jest.spyOn(fs, "renameSync").mockImplementation();
      jest.spyOn(fs, "mkdirSync").mockImplementation();
      jest
        .spyOn(repository.fileUploadRepository, "softDelete")
        .mockResolvedValue({
          affected: 1,
        });

      await repository.deleteFile(1, mockResponse);

      const uploadsFolder = process.env.UPLOADS_FOLDER || "uploads";
      const deletedFolder = process.env.DELETED_FOLDER || "deleted";

      const expectedCurrentFilePath = join(
        __dirname,
        "../",
        uploadsFolder,
        "test-company",
        "insurance",
        "policy",
        "uploads",
        "example.pdf"
      );

      const expectedDeletedFilePath = join(
        __dirname,
        "../",
        uploadsFolder,
        "test-company",
        "insurance",
        "policy",
        deletedFolder,
        "example.pdf"
      );

      expect(fs.existsSync).toHaveBeenCalledWith(expectedCurrentFilePath);
      expect(fs.renameSync).toHaveBeenCalledWith(
        expectedCurrentFilePath,
        expectedDeletedFilePath
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: "File deleted successfully",
          data: undefined
        })
      );
    });

    it("should throw a NotFoundException if the file is not found on disk", async () => {
      const mockFileUpload = {
        id: 1,
        companyType: "insurance",
        companyId: 123,
        documentType: "policy",
        fileUrl: "uploads/insurance/uploads/example.pdf",
      };

      jest
        .spyOn(repository.fileUploadRepository, "findOne")
        .mockResolvedValue(mockFileUpload);

      jest
        .spyOn(repository, "getCompanyNameById")
        .mockResolvedValue("test-company");
      jest.spyOn(fs, "existsSync").mockReturnValue(false);

      await expect(repository.deleteFile(1, mockResponse)).rejects.toThrow(
        new NotFoundException("File not found on disk")
      );
    });

    it("should throw a NotFoundException if the file is not found in the database", async () => {
      jest
        .spyOn(repository.fileUploadRepository, "findOne")
        .mockResolvedValue(null);

      await expect(repository.deleteFile(1, mockResponse)).rejects.toThrow(
        new NotFoundException("File not found")
      );
    });
  });

  describe("replaceFileFromServer", () => {
    it("should replace a file successfully", async () => {
      const mockFileUpload = {
        id: 1,
        companyType: "insurance",
        companyId: 1,
        fileUrl: "uploads/insurance/uploads/example.pdf",
        documentType: "policy",
      };

      jest
        .spyOn(repository.fileUploadRepository, "findOne")
        .mockResolvedValue(mockFileUpload);

      jest
        .spyOn(repository, "getCompanyNameById")
        .mockResolvedValue("test-company");
      jest.spyOn(fs, "existsSync").mockReturnValue(true);
      jest.spyOn(fs, "renameSync").mockImplementation();
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      mockFileUploadRepository.save.mockResolvedValue({
        id: 1,
        fileUrl: "uploads/insurance/uploads/new_example.pdf",
      } as any);

      await repository.replaceFileFromServer(1, mockFile, 123, mockResponse);

      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: "File replaced successfully",
          data: expect.objectContaining({
            fileName: expect.any(String),
            fileBuffer: expect.any(String),
            fileUrl: expect.any(String),
            id: 1,
          }),
        })
      );
    });

    it("should throw a NotFoundException if the file is not found in the database", async () => {
      jest
        .spyOn(repository.fileUploadRepository, "findOne")
        .mockResolvedValue(null);

      await expect(
        repository.replaceFileFromServer(1, mockFile, 123, mockResponse)
      ).rejects.toThrow(new NotFoundException("File not found"));
    });

    it("should handle errors during file replacement", async () => {
      const mockFileUpload = {
        id: 1,
        companyType: "insurance",
        companyId: 1,
        fileUrl: "uploads/insurance/uploads/example.pdf",
        documentType: "policy",
      };

      jest
        .spyOn(repository.fileUploadRepository, "findOne")
        .mockResolvedValue(mockFileUpload);

      jest
        .spyOn(repository, "getCompanyNameById")
        .mockResolvedValue("test-company");
      (fs.promises.writeFile as jest.Mock).mockRejectedValue(
        new Error("Error")
      );

      await expect(
        repository.replaceFileFromServer(1, mockFile, 123, mockResponse)
      ).rejects.toThrow(new Error("Error"));

      expect(console.error).toHaveBeenCalledWith(
        "Error replacing file:",
        expect.any(Error)
      );
    });
  });
});
