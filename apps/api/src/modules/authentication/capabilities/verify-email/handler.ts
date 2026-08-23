import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { BadRequestException, InternalServerErrorException } from "@nestjs/common"
import { VerifyEmailCommand } from "./command"
import { PrismaService } from "@shared/integration/services"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"

@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<
  VerifyEmailCommand,
  Result<true, HandlerError>
> {
  constructor(private readonly client: PrismaService) {}

  async execute(command: VerifyEmailCommand): Promise<Result<true, HandlerError>> {
    try {
      const user = await this.client.user.findUnique({
        where: { password_reset_token: command.token },
        select: { id: true, password_reset_expires_at: true, email_verified_at: true },
      })

      if (!user) return failure(new BadRequestException("Invalid or expired verification token"))

      if (user.password_reset_expires_at && user.password_reset_expires_at < new Date()) {
        return failure(new BadRequestException("Verification token has expired"))
      }

      await this.client.user.update({
        where: { id: user.id },
        data: {
          email_verified_at: new Date(),
          password_reset_token: null,
          password_reset_expires_at: null,
        },
      })

      return success(true)
    } catch (error) {
      return failure(new InternalServerErrorException(error))
    }
  }
}
