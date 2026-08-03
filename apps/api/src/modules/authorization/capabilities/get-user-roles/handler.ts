import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { GetUserRolesQuery } from "./query"
import { UserRole } from "@authorization/business/entities"
import { IRoleRepository } from "@authorization/business/repositories"
import { IUserRepository } from "@account/business/repositories"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { failure, Result } from "@shared/business/utils/error-handling"

@QueryHandler(GetUserRolesQuery)
export class GetUserRolesHandler implements IQueryHandler<GetUserRolesQuery> {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    query: GetUserRolesQuery,
  ): Promise<Result<UserRole[], InternalServerErrorException | NotFoundException>> {
    // Validate user exists
    const userResult = await this.userRepository.findById(query.userId)
    if (!userResult.isOk) {
      return failure(new InternalServerErrorException(userResult.error))
    }
    if (!userResult.value) {
      return failure(new NotFoundException("User not found"))
    }

    // Get user roles
    const rolesResult = await this.roleRepository.getUserRoles(query.userId)
    if (!rolesResult.isOk) {
      return failure(new InternalServerErrorException(rolesResult.error))
    }

    return rolesResult
  }
}
