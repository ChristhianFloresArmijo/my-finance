import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { InternalServerErrorException } from "@nestjs/common"
import { RevokeAllSessionsCommand } from "./command"
import { PrismaService } from "@shared/integration/services"
import { Status } from "@database/prisma/generated-client"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"

@CommandHandler(RevokeAllSessionsCommand)
export class RevokeAllSessionsHandler implements ICommandHandler<
  RevokeAllSessionsCommand,
  Result<true, HandlerError>
> {
  constructor(private readonly client: PrismaService) {}

  async execute(command: RevokeAllSessionsCommand): Promise<Result<true, HandlerError>> {
    try {
      await this.client.refreshToken.updateMany({
        where: {
          user_id: command.userId,
          status: Status.ACTIVE,
          // Exclude the current session so the user stays logged in on this device
          ...(command.currentToken ? { NOT: { token: command.currentToken } } : {}),
        },
        data: { status: Status.INACTIVE },
      })

      return success(true)
    } catch (error) {
      return failure(new InternalServerErrorException(error))
    }
  }
}
