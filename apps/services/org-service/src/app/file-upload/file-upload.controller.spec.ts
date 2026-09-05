import { Test, TestingModule } from "@nestjs/testing";
import { FileUploadController } from "./file-upload.controller";
import { FileUploadService } from "./file-upload.service";
import { BadRequestException, HttpStatus } from "@nestjs/common";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard";
import { RolesGuard } from "../../../../auth-service/src/guards/role.guard";
import {
  createErrorResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import type { Response } from "express";

jest.mock(
  "../../../../../../libs/service-lib/src/lib/utils/response.utils",
  () => ({
    createErrorResponse: jest.fn(),
    handleErrorResponse: jest.fn(),
  })
);

describe("FileUploadController", () => {
  let controller: FileUploadController;
  let fileUploadService: FileUploadService;

  const mockFileUploadService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    replaceFileFromServer: jest.fn(),
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileUploadController],
      providers: [
        {
          provide: FileUploadService,
          useValue: mockFileUploadService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<FileUploadController>(FileUploadController);
    fileUploadService = module.get<FileUploadService>(FileUploadService);
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("uploadFile", () => {
    it("should call uploadFile service with the correct parameters", async () => {
      const mockFile = {
        originalname: "test.jpg",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const mockQuery = {
        companyType: "insurer",
        companyId: 1,
        documentType: "policy",
      };

      const mockRequest = {
        user: { userDetails: { userId: 123 } },
      } as any;

      await controller.uploadFile(
        mockFile,
        mockQuery.companyType,
        mockQuery.companyId,
        mockQuery.documentType,
        mockResponse,
        mockRequest
      );

      expect(fileUploadService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        "insurer",
        1,
        "policy",
        123,
        mockResponse
      );
    });

    it("should return an error if no file is provided", async () => {
      const mockQuery = {
        companyType: "insurer",
        companyId: 1,
        documentType: "policy",
      };

      const mockRequest = {
        user: { userDetails: { userId: 123 } },
      } as any;

      await controller.uploadFile(
        null,
        mockQuery.companyType,
        mockQuery.companyId,
        mockQuery.documentType,
        mockResponse,
        mockRequest
      );

      expect(handleErrorResponse).toHaveBeenCalledWith(
        new BadRequestException("File is required"),
        mockResponse,
        "File not found",
        "File deletion forbidden",
        "Error at Uploading File"
      );
    });

    it("should handle errors thrown by the service", async () => {
      const mockFile = {
        originalname: "test.jpg",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const mockQuery = {
        companyType: "insurer",
        companyId: 1,
        documentType: "policy",
      };

      const mockRequest = {
        user: { userDetails: { userId: 123 } },
      } as any;

      jest
        .spyOn(fileUploadService, "uploadFile")
        .mockRejectedValue(new Error("Service error"));

      await controller.uploadFile(
        mockFile,
        mockQuery.companyType,
        mockQuery.companyId,
        mockQuery.documentType,
        mockResponse,
        mockRequest
      );

      expect(handleErrorResponse).toHaveBeenCalledWith(
        new Error("Service error"),
        mockResponse,
        "File not found",
        "File deletion forbidden",
        "Error at Uploading File"
      );
    });
  });

  describe("deleteFile", () => {
    it("should call deleteFile service with the correct ID", async () => {
      const mockId = 1;

      await controller.deleteFile(mockId, mockResponse);

      expect(fileUploadService.deleteFile).toHaveBeenCalledWith(
        mockId,
        mockResponse
      );
    });
    it("should return an error if no ID is provided", async () => {
      await controller.deleteFile(null, mockResponse);

      expect(handleErrorResponse).toHaveBeenCalledWith(
        new BadRequestException("File ID is required"),
        mockResponse,
        "File not found",
        "File deletion forbidden",
        "Error at deleting file"
      );
    });
  });

  describe("replaceFileFromServer", () => {
    it("should call replaceFileFromServer service with the correct parameters", async () => {
      const mockId = 1;
      const mockFile = {
        originalname: "test.jpg",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const mockRequest = {
        user: { userDetails: { userId: 123 } },
      } as any;

      await controller.replaceFileFromServer(
        mockId,
        mockFile,
        mockResponse,
        mockRequest
      );

      expect(fileUploadService.replaceFileFromServer).toHaveBeenCalledWith(
        mockId,
        mockFile,
        123,
        mockResponse
      );
    });

    it("should return an error if no ID is provided", async () => {
      const mockFile = {
        originalname: "test.jpg",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const mockRequest = {
        user: { userDetails: { userId: 123 } },
      } as any;

      await controller.replaceFileFromServer(
        null,
        mockFile,
        mockResponse,
        mockRequest
      );

      expect(handleErrorResponse).toHaveBeenCalledWith(
        new BadRequestException("File ID is required"),
        mockResponse,
        "File not found",
        "File deletion forbidden",
        "Error at replacing file"
      );
    });

    it("should return an error if no file is provided", async () => {
      const mockId = 1;

      const mockRequest = {
        user: { userDetails: { userId: 123 } },
      } as any;

      await controller.replaceFileFromServer(
        mockId,
        null,
        mockResponse,
        mockRequest
      );

      expect(handleErrorResponse).toHaveBeenCalledWith(
        new BadRequestException("File is required"),
        mockResponse,
        "File not found",
        "File deletion forbidden",
        "Error at replacing file"
      );
    });
  });
});
