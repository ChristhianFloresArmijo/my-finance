import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common"
import { IRoleRepository, IUserPermissionRepository } from "@authorization/business/repositories"
import { Permission, Role } from "@authorization/business/entities"
import { Status } from "@database/prisma/generated-client"

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name)

  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly userPermissionRepository: IUserPermissionRepository,
  ) {}

  /**
   * Check if user has a specific role (active, non-expired).
   */
  async checkUserRole(userId: string, roleName: string): Promise<boolean> {
    const userRolesResult = await this.roleRepository.getUserRoles(userId)
    if (!userRolesResult.isOk) {
      this.logger.error(`getUserRoles failed for user ${userId}`, userRolesResult.error)
      throw new InternalServerErrorException("Failed to retrieve user roles")
    }

    const rolePromises = userRolesResult.value.map(async (ur) => {
      const roleResult = await this.roleRepository.findById(ur.role_id)
      return roleResult.isOk && roleResult.value ? roleResult.value.name : null
    })

    const roleNames = await Promise.all(rolePromises)
    return roleNames.includes(roleName)
  }

  /**
   * Check if user has a specific permission (via roles).
   */
  async checkUserPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId)
    return permissions.some((p) => p.resource === resource && p.action === action)
  }

  /**
   * Get all permissions for a user: union of role-inherited and direct permissions.
   * Uses 2 joined queries total — no N+1.
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    // Query 1: all permissions inherited from active, non-expired roles (deep join)
    const rolePermissionsResult = await this.roleRepository.getUserPermissionsViaRoles(userId)
    if (!rolePermissionsResult.isOk) {
      this.logger.error(
        `getUserPermissionsViaRoles failed for user ${userId}`,
        rolePermissionsResult.error,
      )
      throw new InternalServerErrorException("Failed to retrieve role-based permissions")
    }

    // Query 2: all direct permissions (active, non-expired, joined with permission)
    const directResult = await this.userPermissionRepository.getUserDirectPermissionEntities(userId)
    if (!directResult.isOk) {
      this.logger.error(
        `getUserDirectPermissionEntities failed for user ${userId}`,
        directResult.error,
      )
      throw new InternalServerErrorException("Failed to retrieve direct permissions")
    }

    // Union — role-based first, direct permissions fill in anything not already present
    const permissionsMap = new Map<string, Permission>()
    for (const p of rolePermissionsResult.value) {
      permissionsMap.set(p.id, p)
    }
    for (const p of directResult.value) {
      if (!permissionsMap.has(p.id)) permissionsMap.set(p.id, p)
    }

    return Array.from(permissionsMap.values())
  }

  /**
   * Get all active roles for a user.
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const userRolesResult = await this.roleRepository.getUserRoles(userId)
    if (!userRolesResult.isOk) {
      this.logger.error(`getUserRoles failed for user ${userId}`, userRolesResult.error)
      throw new InternalServerErrorException("Failed to retrieve user roles")
    }

    const rolesMap = new Map<string, Role>()

    for (const userRole of userRolesResult.value) {
      if (rolesMap.has(userRole.role_id)) continue

      const roleResult = await this.roleRepository.findById(userRole.role_id)
      if (!roleResult.isOk) {
        this.logger.error(`findById failed for role ${userRole.role_id}`, roleResult.error)
        throw new InternalServerErrorException("Failed to retrieve role")
      }

      const role = roleResult.value
      if (role && role.status === Status.ACTIVE) {
        rolesMap.set(role.id, role)
      }
    }

    return Array.from(rolesMap.values())
  }
}
