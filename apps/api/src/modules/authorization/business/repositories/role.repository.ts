import { Permission, Role, RolePermission, UserRole } from "@authorization/business/entities"
import { Repository } from "@shared/business/repositories"
import { ErrorCollection, Result } from "@shared/business/utils/error-handling"

export abstract class IRoleRepository extends Repository<Role> {
  abstract assignRoleToUser(data: UserRole): Promise<Result<UserRole, ErrorCollection>>
  abstract revokeRoleFromUser(data: UserRole): Promise<Result<UserRole, ErrorCollection>>
  abstract getUserRoles(userId: string): Promise<Result<UserRole[], ErrorCollection>>
  abstract getRoleUsers(roleId: string): Promise<Result<UserRole[], ErrorCollection>>
  abstract getRolePermissions(roleId: string): Promise<Result<RolePermission[], ErrorCollection>>
  /** Single deep-joined query: user → active roles → active permissions. No N+1. */
  abstract getUserPermissionsViaRoles(
    userId: string,
  ): Promise<Result<Permission[], ErrorCollection>>
  abstract assignPermissionToRole(
    data: RolePermission,
  ): Promise<Result<RolePermission, ErrorCollection>>
  abstract revokePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<Result<RolePermission, ErrorCollection>>

  /** Find an active role by its name (e.g. "client", "admin"). */
  abstract findByName(name: string): Promise<Result<Role | null, ErrorCollection>>
}
