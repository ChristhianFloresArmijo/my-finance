import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common"

/**
 * IsOwnerGuard — pure ownership check, no DB query.
 *
 * Passes when `req.user.sub === req.params.id`.
 *
 * Use after JwtAuthGuard so `req.user` is already populated:
 *
 *   @UseGuards(JwtAuthGuard, IsOwnerGuard)
 *   @Get(':id/profile')
 *   getProfile(@Param('id') id: string) { ... }
 *
 * For admin bypass, stack with RolesGuard/PermissionsGuard BEFORE IsOwnerGuard,
 * or override on the handler with a custom decorator.
 */
@Injectable()
export class IsOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { sub?: string }
      params?: { id?: string; userId?: string }
    }>()

    const userId = request.user?.sub
    // Support both :id and :userId route params
    const paramId = request.params?.id ?? request.params?.userId

    if (!userId || !paramId) {
      throw new ForbiddenException("Ownership check failed: missing user or resource id")
    }

    if (userId !== paramId) {
      throw new ForbiddenException("You do not have permission to access this resource")
    }

    return true
  }
}
