import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const allowedRoles = this.reflector.get<string[]>(
        "roles",
        context.getHandler()
      );
      if (!allowedRoles) {
        return true; // If no roles are specified, allow access
      }

      const request = context.switchToHttp().getRequest();
      const user = request.user;

      // Extract role from user.userDetails.role
      const userRole = user?.userDetails?.role;
      if (!userRole || !allowedRoles.includes(userRole)) {
        throw new ForbiddenException(
          "Access denied. User doesn't have permission."
        );
      }
      return true;
    } catch (error) {
      console.error("Error in RolesGuard:", error);
      throw new ForbiddenException(
        "Access denied. User doesn't have permission."
      );
    }
  }
}
