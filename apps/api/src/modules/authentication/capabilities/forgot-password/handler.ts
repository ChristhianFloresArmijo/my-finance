import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { InternalServerErrorException } from "@nestjs/common"
import { v4 as uuidv4 } from "uuid"
import { ForgotPasswordCommand } from "./command"
import { PrismaService } from "@shared/integration/services"
import { ConfigService } from "@nestjs/config"
import { MailService } from "@shared/integration/mail/MailService"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler implements ICommandHandler<ForgotPasswordCommand, Result<true, HandlerError>> {
  constructor(
    private readonly client: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async execute(command: ForgotPasswordCommand): Promise<Result<true, HandlerError>> {
    try {
      const user = await this.client.user.findUnique({
        where: { email: command.email.toLowerCase() },
        select: { id: true },
      })

      // Silently succeed if user not found (prevents email enumeration)
      if (!user) return success(true)

      const token = uuidv4()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await this.client.user.update({
        where: { id: user.id },
        data: {
          password_reset_token: token,
          password_reset_expires_at: expiresAt,
        },
      })

      const appUrl = this.configService.get<string>("appUrl") ?? "http://localhost:5173"
      const resetUrl = `${appUrl}/auth/reset-password?token=${token}`

      await this.mailService.sendPasswordReset(command.email, resetUrl)

      return success(true)
    } catch (error) {
      return failure(new InternalServerErrorException(error))
    }
  }
}
