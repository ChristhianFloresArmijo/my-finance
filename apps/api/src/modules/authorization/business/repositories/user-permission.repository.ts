import { Permission, UserPermission } from "@authorization/business/entities"
import { Repository } from "@shared/business/repositories"
import { ErrorCollection, Result } from "@shared/business/utils/error-handling"

export abstract class IUserPermissionRepository extends Repository<UserPermission> {
  abstract assignPermissionToUser(
    data: UserPermission,
  ): Promise<Result<UserPermission, ErrorCollection>>
  abstract revokePermissionFromUser(
    userId: string,
    permissionId: string,
  ): Promise<Result<UserPermission, ErrorCollection>>
  abstract getUserDirectPermissions(
    userId: string,
  ): Promise<Result<UserPermission[], ErrorCollection>>
  /** Single joined query: direct assignments + resolved Permission entities. No N+1. */
  abstract getUserDirectPermissionEntities(
    userId: string,
  ): Promise<Result<Permission[], ErrorCollection>>
}
