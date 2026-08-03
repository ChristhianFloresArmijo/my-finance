import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { CleanupTokensCommand } from "./command"
import { IRefreshTokenRepository } from "@auth/business/repositories"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { Logger, InternalServerErrorException } from "@nestjs/common"

@CommandHandler(CleanupTokensCommand)
export class CleanupTokensHandler implements ICommandHandler<
  CleanupTokensCommand,
  Result<number, HandlerError>
> {
  private readonly logger = new Logger(CleanupTokensHandler.name)

  constructor(private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(command: CleanupTokensCommand): Promise<Result<number, HandlerError>> {
    try {
      this.logger.log(`Starting cleanup of tokens older than ${command.daysOld} days`)

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - command.daysOld)

      const result = await this.refreshTokenRepository.deleteMany({
        where: {
          status: "INACTIVE",
          updated_at: {
            lt: cutoffDate,
          },
        },
      })

      if (!result.isOk) {
        this.logger.error("Failed to cleanup tokens", result.error)
        return failure(
          new InternalServerErrorException("Failed to cleanup tokens", "Database error"),
        )
      }

      this.logger.log(`Successfully cleaned up ${result.value} deactivated tokens`)
      return success(result.value)
    } catch (error) {
      this.logger.error("Error during token cleanup", error)
      return failure(
        new InternalServerErrorException("Error during token cleanup", "Unexpected error"),
      )
    }
  }
}
