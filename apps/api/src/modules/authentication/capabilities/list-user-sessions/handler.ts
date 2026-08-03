import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { InternalServerErrorException } from "@nestjs/common"
import { ListUserSessionsQuery } from "./query"
import { PrismaService } from "@shared/integration/services"
import { RefreshTokenDto } from "@auth/presentation/dtos"
import { Status } from "@database/prisma/generated-client"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"

@QueryHandler(ListUserSessionsQuery)
export class ListUserSessionsHandler implements IQueryHandler<
  ListUserSessionsQuery,
  Result<RefreshTokenDto[], HandlerError>
> {
  constructor(private readonly client: PrismaService) {}

  async execute(query: ListUserSessionsQuery): Promise<Result<RefreshTokenDto[], HandlerError>> {
    try {
      const tokens = await this.client.refreshToken.findMany({
        where: {
          user_id: query.userId,
          status: Status.ACTIVE,
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          created_at: true,
          expires_at: true,
          user: { select: { id: true, email: true, first_name: true, last_name: true } },
        },
      })

      return success(tokens.map((t) => ({
        id:         t.id,
        user:       t.user,
        created_at: t.created_at,
        expires_at: t.expires_at,
      })))
    } catch (error) {
      return failure(new InternalServerErrorException(error))
    }
  }
}
