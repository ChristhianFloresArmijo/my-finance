import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { IUserPermissionRepository } from "@authorization/business/repositories"
import { IUserRepository } from "@account/business/repositories"
import { UserPermission } from "@authorization/business/entities"
import { GetUserDirectPermissionsQuery } from "./query"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"

@QueryHandler(GetUserDirectPermissionsQuery)
export class GetUserDirectPermissionsHandler
  implements
    IQueryHandler<GetUserDirectPermissionsQuery, Result<UserPermission[], HandlerError>>
{
  constructor(
    private readonly userPermissionRepository: IUserPermissionRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    query: GetUserDirectPermissionsQuery,
  ): Promise<Result<UserPermission[], HandlerError>> {
    const userResult = await this.userRepository.findById(query.userId)
    if (!userResult.isOk) {
      return failure(new InternalServerErrorException(userResult.error))
    }
    if (!userResult.value) {
      return failure(new NotFoundException("User not found"))
    }

    const result = await this.userPermissionRepository.getUserDirectPermissions(query.userId)
    if (!result.isOk) {
      return failure(new InternalServerErrorException(result.error))
    }

    return success(result.value)
  }
}
