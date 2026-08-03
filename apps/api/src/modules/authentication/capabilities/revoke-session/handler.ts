import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { ForbiddenException, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { RevokeSessionCommand } from "./command"
import { PrismaService } from "@shared/integration/services"
import { Status } from "@database/prisma/generated-client"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"

@CommandHandler(RevokeSessionCommand)
export class RevokeSessionHandler implements ICommandHandler<
  RevokeSessionCommand,
  Result<true, HandlerError>
> {
  constructor(private readonly client: PrismaService) {}

  async execute(command: RevokeSessionCommand): Promise<Result<true, HandlerError>> {
    try {
      const token = await this.client.refreshToken.findUnique({
        where: { id: command.tokenId },
        select: { id: true, user_id: true },
      })

      if (!token) return failure(new NotFoundException("Session not found"))
      if (token.user_id !== command.userId) {
        return failure(new ForbiddenException("Cannot revoke another user's session"))
      }

      await this.client.refreshToken.update({
        where: { id: command.tokenId },
        data:  { status: Status.INACTIVE },
      })

      return success(true)
    } catch (error) {
      return failure(new InternalServerErrorException(error))
    }
  }
}
