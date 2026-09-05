import { Test, TestingModule } from "@nestjs/testing";
import { SimpleAuthController } from "./simple-auth.controller";
import { SimpleAuthService } from "./simple-auth.service";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { CreateSimpleAuthDto } from "../../../../service-lib/src/lib/dto/create-simple-auth.dto";
import { RefreshTokenDto } from "../simple-auth/dto/refresh-token.dto";
import { Request, Response } from "express";
import { JwtService } from "@nestjs/jwt";

describe("SimpleAuthController", () => {
  let controller: SimpleAuthController;
  let service: SimpleAuthService;

  const mockSimpleAuthService = {
    validateUser: jest.fn(),
    getUserDetails: jest.fn(),
    validateRefreshTokenAndGenerateAccessToken: jest.fn(),
    logoutSession: jest.fn(),
  };
  const mockJwtService = {
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimpleAuthController],
      providers: [
        {
          provide: SimpleAuthService,
          useValue: mockSimpleAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<SimpleAuthController>(SimpleAuthController);
    service = module.get<SimpleAuthService>(SimpleAuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("login", () => {
    it("should return user and tokens if credentials are valid", async () => {
      const mockLoginDto: CreateSimpleAuthDto = {
        userName: "testUser",
        password: "password",
      };
      const mockRequest = {
        headers: {},
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const mockTokens = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };

      mockSimpleAuthService.validateUser.mockResolvedValue({
        user: { userId: 1 },
        accessToken: mockTokens,
      });

      await controller.login(mockLoginDto, mockRequest, mockResponse);

      expect(service.validateUser).toHaveBeenCalledWith(
        mockLoginDto.userName,
        mockLoginDto.password,
        undefined
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 200,
        message: "User logged in successfully",
        data: { user: { userId: 1 }, accessToken: mockTokens },
      });
    });

    it("should return 403 if credentials are invalid", async () => {
      const mockLoginDto: CreateSimpleAuthDto = {
        userName: "testUser",
        password: "wrongPassword",
      };
      const mockRequest = {
        headers: {},
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      mockSimpleAuthService.validateUser.mockRejectedValue(
        new ForbiddenException("Invalid credentials.")
      );

      await controller.login(mockLoginDto, mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 403,
        message: "Invalid credentials.",
      });
    });
  });

  describe("getUserDetails", () => {
    it("should return user details if user exists", async () => {
      const mockUserId = 1;
      const mockRequest = {
        headers: { userid: String(mockUserId) },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const mockUserDetails = { userId: 1, name: "Test User" };

      mockSimpleAuthService.getUserDetails.mockResolvedValue(mockUserDetails);

      await controller.getUserDetails(mockRequest, mockResponse);

      expect(service.getUserDetails).toHaveBeenCalledWith(mockUserId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 200,
        message: "User details retrieved successfully",
        data: mockUserDetails,
      });
    });

    it("should return 404 if user is not found", async () => {
      const mockUserId = 1;
      const mockRequest = {
        headers: { userid: String(mockUserId) },
      } as unknown as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      mockSimpleAuthService.getUserDetails.mockRejectedValue(
        new NotFoundException("User not found.")
      );

      await controller.getUserDetails(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 404,
        message: "User not found.",
      });
    });
  });

  describe("refreshToken", () => {
    it("should return a new access token if refresh token is valid", async () => {
      const mockRefreshTokenDto: RefreshTokenDto = {
        refreshToken: "valid-refresh-token",
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const mockAccessToken = "new-access-token";

      mockSimpleAuthService.validateRefreshTokenAndGenerateAccessToken.mockResolvedValue(
        {
          accessToken: mockAccessToken,
        }
      );

      await controller.refreshToken(mockRefreshTokenDto, mockResponse);

      expect(
        service.validateRefreshTokenAndGenerateAccessToken
      ).toHaveBeenCalledWith(mockRefreshTokenDto.refreshToken);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 200,
        message: "Token refreshed successfully.",
        data: { accessToken: mockAccessToken },
      });
    });

    it("should return 403 if refresh token is invalid", async () => {
      const mockRefreshTokenDto: RefreshTokenDto = {
        refreshToken: "invalid-refresh-token",
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      mockSimpleAuthService.validateRefreshTokenAndGenerateAccessToken.mockRejectedValue(
        new ForbiddenException("Invalid refresh token.")
      );

      await controller.refreshToken(mockRefreshTokenDto, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 403,
        message: "Invalid refresh token.",
      });
    });
  });
});
