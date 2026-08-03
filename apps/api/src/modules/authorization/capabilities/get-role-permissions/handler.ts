import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { GetRolePermissionsQuery } from "./query"
import { RolePermission } from "@authorization/business/entities"
import { IRoleRepository } from "@authorization/business/repositories"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { failure, Result } from "@shared/business/utils/error-handling"

@QueryHandler(GetRolePermissionsQuery)
export class GetRolePermissionsHandler implements IQueryHandler<GetRolePermissionsQuery> {
  constructor(private readonly repository: IRoleRepository) {}

  async execute(
    query: GetRolePermissionsQuery,
  ): Promise<Result<RolePermission[], InternalServerErrorException | NotFoundException>> {
    // First verify role exists
    const roleResult = await this.repository.findById(query.roleId)
    if (!roleResult.isOk) {
      return failure(new InternalServerErrorException(roleResult.error))
    }
    if (!roleResult.value) {
      return failure(new NotFoundException("Role not found"))
    }

    // Get role permissions
    const permissionsResult = await this.repository.getRolePermissions(query.roleId)
    if (!permissionsResult.isOk) {
      return failure(new InternalServerErrorException(permissionsResult.error))
    }

    return permissionsResult
  }
}
