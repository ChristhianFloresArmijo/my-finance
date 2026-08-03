import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { PaginatedResults } from "@shared/business/utils/pagination.dto"
import { ListUsersQuery } from "./query"
import { User } from "@account/business/entities"
import { IUserRepository } from "@account/business/repositories"
import { InternalServerErrorException } from "@nestjs/common"
import { failure, Result, success } from "@shared/business/utils/error-handling"

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(private readonly repository: IUserRepository) {}

  async execute(
    query: ListUsersQuery,
  ): Promise<Result<PaginatedResults<User[]>, InternalServerErrorException>> {
    // Build an AND array so conditions never clobber each other
    const andConditions: Record<string, any>[] = []

    // Exclude root admin by email (set ROOT_ADMIN_EMAIL in your .env)
    const rootAdminEmail = process.env.ROOT_ADMIN_EMAIL
    if (rootAdminEmail) {
      andConditions.push({ email: { not: rootAdminEmail } })
    }

    // Filter users who have a specific role (by role slug name)
    if (query.role) {
      andConditions.push({
        user_roles: {
          some: {
            role: { name: query.role },
            status: "ACTIVE",
          },
        },
      })
    }

    // Full-text search across first name, last name, and email
    if (query.search) {
      andConditions.push({
        OR: [
          { first_name: { contains: query.search, mode: "insensitive" } },
          { last_name: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ],
      })
    }

    // Status filter
    if (query.status) {
      andConditions.push({ status: query.status })
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {}

    const result = await this.repository.find({ where }, query.pagination)

    if (result.isOk === false) {
      return failure(new InternalServerErrorException(result.error))
    }

    const [count, results] = result.value

    return success({ count, results })
  }
}
