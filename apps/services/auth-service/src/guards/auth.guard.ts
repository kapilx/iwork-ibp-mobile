import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ENV } from "../../../service-lib/src/lib/environment";
import {
  AuthSessionService,
  SESSION_REVOKED_CODE,
} from "../../../service-lib/src/lib/auth-session/auth-session.service";
@Injectable()
export class AuthGuard implements CanActivate {
  // Feature-flag gate to preserve existing auth behavior when disabled.
  private readonly singleSessionEnabled =
    (ENV.IWORK_SINGLE_SESSION || "").toLowerCase() === "true";
  constructor(
    private readonly jwtService: JwtService,
    private readonly authSessionService: AuthSessionService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException("Authorization header is missing");
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = this.jwtService.verify(token, {
        secret: ENV.JWT_SECRET,
      });
      request.user = decoded;
      const userId =
        decoded?.userDetails?.userId ?? decoded?.userId ?? decoded?.sub;
      const sessionId = decoded?.sid;
      // Skip session checks when the feature is off or token has no sid.
      if (!this.singleSessionEnabled || !sessionId) {
        return true;
      }
      if (!userId) {
        throw new UnauthorizedException("Invalid or expired token");
      }
      const validation = await this.authSessionService.validateSession(
        Number(userId),
        sessionId
      );
      if (!validation.valid) {
        const code = validation.code || SESSION_REVOKED_CODE;
        const message =
          validation.message ||
          "You were signed out because your account was used to sign in from another browser.";
        throw new UnauthorizedException({
          code,
          message,
        });
      }
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
