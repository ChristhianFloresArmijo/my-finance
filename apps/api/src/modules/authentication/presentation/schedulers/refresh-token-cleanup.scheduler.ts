import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { CommandBus } from "@nestjs/cqrs"
import { CleanupTokensCommand } from "@auth/capabilities/cleanup-tokens"

@Injectable()
export class RefreshTokenCleanupScheduler {
  private readonly logger = new Logger(RefreshTokenCleanupScheduler.name)

  constructor(private readonly commandBus: CommandBus) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupDeactivatedTokens() {
    this.logger.log("Starting scheduled cleanup of deactivated refresh tokens")

    try {
      const result = await this.commandBus.execute(new CleanupTokensCommand(7))

      if (!result.isOk) {
        this.logger.error("Scheduled cleanup failed", result.error)
        return
      }

      this.logger.log(`Scheduled cleanup completed. Removed ${result.value} tokens`)
    } catch (error) {
      this.logger.error("Error during scheduled cleanup", error)
    }
  }
}
