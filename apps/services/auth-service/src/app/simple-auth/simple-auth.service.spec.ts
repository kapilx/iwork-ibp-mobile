import { Test, TestingModule } from "@nestjs/testing";
import { SimpleAuthService } from "./simple-auth.service";
import { JwtService } from "@nestjs/jwt";
import { ForbiddenException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UserRepository } from "./simple-auth.repository";
import { User } from "../../../../service-lib/src/lib/entities/user";
import { isPasswordMatch } from "../../../../service-lib/src/lib/utils/password.util";
import { ENV } from "../../../../service-lib/src/lib/environment.ts";
import { AuthSessionService } from "../../../../service-lib/src/lib/auth-session/auth-session.service";
jest.mock("../../../../service-lib/src/lib/utils/password.util");

describe("SimpleAuthService", () => {
  let service: SimpleAuthService;
  let jwtService: JwtService;
  let userRepository: UserRepository;
  let authSessionService: AuthSessionService;

  const mockUserRepository = {
    findByLoginNameOrEmail: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockAuthSessionService = {
    establishSession: jest.fn(),
    validateSession: jest.fn(),
    logoutSession: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.IWORK_SINGLE_SESSION = "true";
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimpleAuthService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuthSessionService,
          useValue: mockAuthSessionService,
        },
      ],
    }).compile();

    service = module.get<SimpleAuthService>(SimpleAuthService);
    jwtService = module.get<JwtService>(JwtService);
    userRepository = module.get<UserRepository>(UserRepository);
    authSessionService = module.get<AuthSessionService>(AuthSessionService);
  });

  afterEach(() => {
    delete process.env.IWORK_SINGLE_SESSION;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateUser", () => {
    it("should return user and tokens if credentials are valid", async () => {
      const mockUser = { userId: 1, password: "hashedPassword" } as User;
      const mockAccessToken = "access-token";
      const mockRefreshToken = "refresh-token";

      mockUserRepository.findByLoginNameOrEmail.mockResolvedValue(mockUser);
      (isPasswordMatch as jest.Mock).mockResolvedValue(true);
      mockAuthSessionService.establishSession.mockResolvedValue({
        sessionId: "session-1",
        sameScope: true,
        checksSkipped: false,
      });
      jest.spyOn(service, "getTokens").mockResolvedValue({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });

      const result = await service.validateUser(
        "testUser",
        "password",
        "scope-1"
      );

      expect(mockUserRepository.findByLoginNameOrEmail).toHaveBeenCalledWith(
        "testUser"
      );
      expect(mockAuthSessionService.establishSession).toHaveBeenCalledWith(
        1,
        "scope-1"
      );
      expect(isPasswordMatch).toHaveBeenCalledWith(
        "password",
        "hashedPassword"
      );
      expect(result).toEqual({
        user: { userId: 1 },
        accessToken: {
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
        },
      });
    });

    it("should throw ForbiddenException if credentials are invalid", async () => {
      mockUserRepository.findByLoginNameOrEmail.mockResolvedValue(null);

      await expect(
        service.validateUser("testUser", "password")
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException when another session is active", async () => {
      const mockUser = { userId: 1, password: "hashedPassword" } as User;
      mockUserRepository.findByLoginNameOrEmail.mockResolvedValue(mockUser);
      (isPasswordMatch as jest.Mock).mockResolvedValue(true);
      mockAuthSessionService.establishSession.mockResolvedValue({
        sessionId: "session-1",
        sameScope: false,
        checksSkipped: false,
        blockedByActiveSession: true,
      });

      await expect(
        service.validateUser("testUser", "password", "scope-1")
      ).rejects.toThrow(ForbiddenException);
    });

    it("should skip session enforcement when client scope is missing", async () => {
      const mockUser = { userId: 1, password: "hashedPassword" } as User;
      const mockAccessToken = "access-token";
      const mockRefreshToken = "refresh-token";

      mockUserRepository.findByLoginNameOrEmail.mockResolvedValue(mockUser);
      (isPasswordMatch as jest.Mock).mockResolvedValue(true);
      jest.spyOn(service, "getTokens").mockResolvedValue({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });

      const result = await service.validateUser("testUser", "password");

      expect(mockAuthSessionService.establishSession).not.toHaveBeenCalled();
      expect(result).toEqual({
        user: { userId: 1 },
        accessToken: {
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
        },
      });
    });

    it("should throw NotFoundException if user is not found", async () => {
      mockUserRepository.findByLoginNameOrEmail.mockRejectedValue(
        new NotFoundException()
      );

      await expect(
        service.validateUser("testUser", "password")
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getTokens", () => {
    it("should return access and refresh tokens", async () => {
      const mockUser = {
        userId: 1,
        departmentId: 2,
        roles: [{ name: "Admin" }],
      } as User;
      const mockAccessToken = "access-token";
      const mockRefreshToken = "refresh-token";

      mockJwtService.signAsync
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const result = await service.getTokens(mockUser, "session-1");

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it("should throw ForbiddenException if user details are missing", async () => {
      await expect(service.getTokens(null as any)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe("validateRefreshTokenAndGenerateAccessToken", () => {
    it("should return a new access token if refresh token is valid", async () => {
      const mockPayload = { userDetails: { userId: 1 }, sid: "session-1" };
      const mockAccessToken = "new-access-token";

      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockJwtService.signAsync.mockResolvedValue(mockAccessToken);
      mockAuthSessionService.validateSession.mockResolvedValue({
        valid: true,
        checksSkipped: false,
      });

      const result = await service.validateRefreshTokenAndGenerateAccessToken(
        "valid-refresh-token"
      );

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        "valid-refresh-token"
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { userDetails: mockPayload.userDetails, sid: "session-1" },
        { expiresIn: ENV.JWT_EXPIRATION }
      );
      expect(result).toEqual({ accessToken: mockAccessToken });
    });

    it("should throw ForbiddenException if refresh token is invalid", async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error("Invalid token"));

      await expect(
        service.validateRefreshTokenAndGenerateAccessToken("invalid-token")
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw UnauthorizedException if session is revoked", async () => {
      const mockPayload = { userDetails: { userId: 1 }, sid: "session-1" };
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockAuthSessionService.validateSession.mockResolvedValue({
        valid: false,
        code: "SESSION_REVOKED",
        message: "Session ended due to a new login.",
        checksSkipped: false,
      });

      await expect(
        service.validateRefreshTokenAndGenerateAccessToken("revoked-token")
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw ForbiddenException if refresh token has expired", async () => {
      const error = new Error("TokenExpiredError");
      error.name = "TokenExpiredError";
      mockJwtService.verifyAsync.mockRejectedValue(error);

      await expect(
        service.validateRefreshTokenAndGenerateAccessToken("expired-token")
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("getUserDetails", () => {
    it("should return user details if user exists", async () => {
      const mockUserDetails = { userId: 1, name: "Test User" };
      mockUserRepository.findById.mockResolvedValue(mockUserDetails);

      const result = await service.getUserDetails(1);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUserDetails);
    });

    it("should throw an error if user is not found", async () => {
      mockUserRepository.findById.mockRejectedValue(
        new NotFoundException("User not found")
      );

      await expect(service.getUserDetails(1)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
