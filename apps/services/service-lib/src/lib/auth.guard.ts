import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ENV } from "./environment";
import { bypassAuthGuardApis, iirm } from "./constants";
import { 
  
  AuthSessionService,
  SESSION_REVOKED_CODE,
} from "./auth-session/auth-session.service";
import { AuthVersionService } from "./auth-version/auth-version.service";
// import { errorMessages } from "../../../../../libs/service-lib/src/lib/messages";
@Injectable()
export class AuthGuard implements CanActivate {
  // Feature-flag gate to preserve existing auth behavior when disabled.
  private readonly singleSessionEnabled =
    (ENV.IWORK_SINGLE_SESSION || "").toLowerCase() === "true";
  constructor(
    private readonly jwtService: JwtService,
    private readonly authSessionService: AuthSessionService,
    private readonly authVersionService: AuthVersionService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // By passing the login and register endpoints
    const serviceName = request.params.service;
    const path = request.path.replace(`/${iirm}/${serviceName}`, "");
    // if (serviceName === "ai-service") return true; // TODO: remove this line when ACL is mapped in DB for ai-service
    if (
      path === "/login" ||
      path === "/register" ||
      path === "/health" ||
      path === "/refresh-token" ||
      path === "/logout"
    ) {
      return true;
    }
    if (
      bypassAuthGuardApis.includes(path) ||
      path.includes("/employee/password-reset-mail") ||
      path.includes("/employee/company-employee-password-reset-mail") ||
      path.includes("/employee/ibp-password-reset-mail") ||
      path.includes("/employee/ibp-password-reset") ||
      path.includes("company-employee/login") ||
      path.includes("/auth/google/login") ||
      path.includes("/auth-config/company") ||
      (path.includes("/auth-config/file-upload/") && path.includes("/download")) ||
      path.includes("/auth/phone-otp/verify") ||
      path.includes("/auth/email-otp") ||
      path.includes("/oauth/callback") ||
      path.includes("/google/auth-url") ||
      path.includes("/google/callback") ||
      path.includes("/auth/microsoft/auth-url") ||
      path.includes("/auth/microsoft/callback") ||
      path.includes("company-colors/logo") ||
      path.includes("password-rules/company") ||
      path.includes("auth/phone-otp") ||
      path.includes("/config/company") ||
      path.includes("/external-app-sso/magic-url") ||
      path.includes("/password-protection-config") ||
      path.includes("/tickets") ||
      path.includes("/hr-module/zoho/callback") ||
      path.includes("/hr-module/zoho/auth-url") ||
      // HCL's HRMS pushes employee/dependent lifecycle data here directly —
      // no IBP session/JWT exists for that caller. Authenticated instead by
      // UserName/Password fields inside the payload itself, self-validated
      // in HclIntegrationService (see docs/HCL-Employee-Interface-Sync).
      // Deliberately scoped to just this one inbound route, not the whole
      // integrations/hcl prefix — the RiskWatch-facing intake/list/mark-
      // processing routes on the same controller (in
      // external-integration-service) are admin-only and must keep going
      // through the normal JWT check.
      path.includes("/integrations/hcl/process-enroll-data") ||
      path.includes("/password-protection-config") || 
      path.includes("/tickets") ||
      path.includes("/tpa-external-feature") ||
      path.includes("/tpa-sso-config")
    ) {
      return true;
    }
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
      const tokenAuthVersion = decoded?.userDetails?.authVersion;

      if (!userId) {
        throw new UnauthorizedException("Invalid or expired token");
      }

      // Auth Version Check - This ensures users are logged out when roles/permissions change
      if (tokenAuthVersion && this.authVersionService) {
        const currentAuthVersion = await this.authVersionService.getAuthVersion(userId);
        if (Number(tokenAuthVersion) !== Number(currentAuthVersion)) {
          // Clear active session when auth version mismatch occurs
          // This prevents the user from being blocked on subsequent login attempts
          if (this.singleSessionEnabled && sessionId) {
            await this.authSessionService.clearActiveSession(Number(userId));
          }
          throw new UnauthorizedException({
            code: "AUTH_VERSION_MISMATCH", 
            message: "Your session was invalidated due to role or permission changes. Please log in again.",
          });
        }
      }

      // Skip session checks when the feature is off or token has no sid.
      if (!this.singleSessionEnabled || !sessionId) {
        return true;
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
