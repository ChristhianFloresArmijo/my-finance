import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "@shared/integration/services/prisma.service"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { AdminDisable2faCommand } from "./command"

@CommandHandler(AdminDisable2faCommand)
export class AdminDisable2faHandler implements ICommandHandler<AdminDisable2faCommand, Result<true, HandlerError>> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: AdminDisable2faCommand): Promise<Result<true, HandlerError>> {
    const user = await this.prisma.user.findUnique({
      where: { id: command.targetUserId },
      select: { id: true, totp_enabled: true },
    })

    if (!user) return failure(new NotFoundException("User not found"))
    if (!user.totp_enabled) return failure(new BadRequestException("2FA is not enabled for this user"))

    await this.prisma.user.update({
      where: { id: command.targetUserId },
      data: { totp_enabled: false, totp_secret: null, totp_enabled_at: null },
    })
    await this.prisma.userRecoveryCode.deleteMany({ where: { user_id: command.targetUserId } })

    return success(true)
  }
}
