import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { AuthorizationService } from "@authorization/business/services/authorization.service"
import { REQUIRE_PERMISSIONS_KEY } from "@authorization/presentation/decorators/require-permission.decorator"

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true // No permission requirement
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user // Should be set by JWT guard

    // JWT payload uses 'sub' for user ID
    if (!user || !user.sub) {
      throw new ForbiddenException("User not authenticated")
    }

    // Fetch all permissions once — single DB round trip — then check all requirements
    const allPermissions = await this.authorizationService.getUserPermissions(user.sub)
    const permissionSet = new Set(allPermissions.map((p) => `${p.resource}:${p.action}`))

    for (const permission of requiredPermissions) {
      if (!permissionSet.has(permission)) {
        throw new ForbiddenException(`Missing required permission: ${permission}`)
      }
    }

    return true
  }
}
