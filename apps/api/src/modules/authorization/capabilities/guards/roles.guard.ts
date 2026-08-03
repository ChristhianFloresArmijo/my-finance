import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { AuthorizationService } from "@authorization/business/services/authorization.service"
import { REQUIRE_ROLES_KEY } from "@authorization/presentation/decorators/require-role.decorator"

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(REQUIRE_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles || requiredRoles.length === 0) {
      return true // No role requirement
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user // Should be set by JWT guard

    // JWT payload uses 'sub' for user ID
    if (!user || !user.sub) {
      throw new ForbiddenException("User not authenticated")
    }

    // Check if user has any of the required roles
    for (const roleName of requiredRoles) {
      const hasRole = await this.authorizationService.checkUserRole(user.sub, roleName)
      if (hasRole) {
        return true
      }
    }

    throw new ForbiddenException("Insufficient permissions")
  }
}
