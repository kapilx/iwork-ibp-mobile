import { Test, TestingModule } from "@nestjs/testing";
import { FileUploadService } from "./file-upload.service";
import { FileUploadRepository } from "./file-upload.repository";
import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";

describe("FileUploadService", () => {
  let service: FileUploadService;
  let repository: FileUploadRepository;

  const mockRepository = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    replaceFileFromServer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        {
          provide: FileUploadRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
    repository = module.get<FileUploadRepository>(FileUploadRepository);
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("uploadFile", () => {
    it("should upload a file successfully", async () => {
      const mockFile = {
        originalname: "test.pdf",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const mockUploadResult = {
        statusCode: 200,
        message: "File uploaded successfully",
        data: {
          id: 1,
          fileName: "test.pdf",
          fileUrl: "uploads/test.pdf",
        },
      };

      const mockCompanyType = "insurance";
      const mockCompanyId = 1;
      const mockDocumentType = "policy";
      const mockUserId = 123;

      mockRepository.uploadFile.mockResolvedValue(mockUploadResult);

      const result = await service.uploadFile(
        mockFile,
        mockCompanyType,
        mockCompanyId,
        mockDocumentType,
        mockUserId,
        mockResponse
      );

      expect(repository.uploadFile).toHaveBeenCalledWith(
        mockFile,
        mockCompanyType,
        mockCompanyId,
        mockDocumentType,
        mockUserId,
        mockResponse
      );
      expect(result).toEqual(mockUploadResult);
    });

    it("should return an error if no file is provided", async () => {
      const mockResponse = { status: jest.fn(), json: jest.fn() } as any;

      await expect(
        service.uploadFile(null, "insurance", 1, "policy", 123, mockResponse)
      ).rejects.toThrow(new BadRequestException("File is required"));
    });

    it("should return an error for invalid file types", async () => {
      const mockFile = {
        originalname: "test.exe",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const mockResponse = { status: jest.fn(), json: jest.fn() } as any;

      await expect(
        service.uploadFile(
          mockFile,
          "insurance",
          1,
          "policy",
          123,
          mockResponse
        )
      ).rejects.toThrow(
        new BadRequestException(
          "Invalid file type. Allowed types are: pdf, xlsx, jpg, png, jpeg, docs"
        )
      );
    });

    it("should handle errors thrown by the repository", async () => {
      const mockFile = {
        originalname: "test.pdf",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const mockResponse = { status: jest.fn(), json: jest.fn() } as any;

      mockRepository.uploadFile.mockRejectedValue(
        new Error("Repository error")
      );

      await expect(
        service.uploadFile(
          mockFile,
          "insurance",
          1,
          "policy",
          123,
          mockResponse
        )
      ).rejects.toThrow(new Error("Repository error"));
    });
  });

  describe("deleteFile", () => {
    it("should delete a file successfully", async () => {
      mockRepository.deleteFile.mockResolvedValue("File deleted successfully");

      const mockResponse = { status: jest.fn(), json: jest.fn() } as any;

      const result = await service.deleteFile(1, mockResponse);

      expect(repository.deleteFile).toHaveBeenCalledWith(1, mockResponse);
      expect(result).toBe("File deleted successfully");
    });

    it("should handle errors thrown by the repository", async () => {
      mockRepository.deleteFile.mockRejectedValue(
        new Error("Repository error")
      );

      const mockResponse = { status: jest.fn(), json: jest.fn() } as any;

      await expect(service.deleteFile(1, mockResponse)).rejects.toThrow(
        new Error("Repository error")
      );
    });
  });

  describe("replaceFileFromServer", () => {
    it("should replace a file successfully", async () => {
      const mockFile = {
        originalname: "test.pdf",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const mockResponse = { status: jest.fn(), json: jest.fn() } as any;

      mockRepository.replaceFileFromServer.mockResolvedValue(
        "File replaced successfully"
      );

      const result = await service.replaceFileFromServer(
        1,
        mockFile,
        123,
        mockResponse
      );

      expect(repository.replaceFileFromServer).toHaveBeenCalledWith(
        1,
        mockFile,
        123,
        mockResponse
      );
      expect(result).toBe("File replaced successfully");
    });

    it("should return an error if no ID is provided", async () => {
      const mockFile = {
        originalname: "test.pdf",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const mockResponse = { status: jest.fn(), json: jest.fn() } as any;

      await expect(
        service.replaceFileFromServer(null, mockFile, 123, mockResponse)
      ).rejects.toThrow(new BadRequestException("File ID is required"));
    });

    it("should return an error for invalid file types", async () => {
      const mockFile = {
        originalname: "test.exe",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const mockResponse = { status: jest.fn(), json: jest.fn() } as any;

      await expect(
        service.replaceFileFromServer(1, mockFile, 123, mockResponse)
      ).rejects.toThrow(
        new BadRequestException(
          "Invalid file type. Allowed types are: pdf, xlsx, jpg, png, jpeg, docs"
        )
      );
    });

    it("should handle errors thrown by the repository", async () => {
      const mockFile = {
        originalname: "test.pdf",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const mockResponse = { status: jest.fn(), json: jest.fn() } as any;

      mockRepository.replaceFileFromServer.mockRejectedValue(
        new Error("Repository error")
      );

      await expect(
        service.replaceFileFromServer(1, mockFile, 123, mockResponse)
      ).rejects.toThrow(new Error("Repository error"));
    });
  });
});
