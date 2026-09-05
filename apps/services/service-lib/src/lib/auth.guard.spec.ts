import { AuthGuard } from "./auth.guard";
import { JwtService } from "@nestjs/jwt";
import { AuthSessionService } from "./auth-session/auth-session.service";
import { UnauthorizedException } from "@nestjs/common";

describe("AuthGuard", () => {
  beforeEach(() => {
    process.env.IWORK_SINGLE_SESSION = "true";
  });

  afterEach(() => {
    delete process.env.IWORK_SINGLE_SESSION;
  });
  const makeContext = (request: any) => ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  });

  it("throws SESSION_REVOKED when session is invalid", async () => {
    const jwtService = {
      verify: jest.fn().mockReturnValue({
        userDetails: { userId: 1 },
        sid: "session-1",
      }),
    } as unknown as JwtService;
    const authSessionService = {
      validateSession: jest.fn().mockResolvedValue({
        valid: false,
        code: "SESSION_REVOKED",
        message: "Session ended due to a new login.",
        checksSkipped: false,
      }),
    } as unknown as AuthSessionService;

    const guard = new AuthGuard(jwtService, authSessionService);
    const request = {
      params: { service: "auth-service" },
      path: "/iirm/auth-service/secure",
      headers: { authorization: "Bearer token" },
    };

    await expect(guard.canActivate(makeContext(request) as any)).rejects.toThrow(
      UnauthorizedException
    );
  });
});
