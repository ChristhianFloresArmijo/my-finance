import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { BadRequestException, InternalServerErrorException } from "@nestjs/common"
import { ResetPasswordCommand } from "./command"
import { IUserRepository } from "@account/business/repositories"
import { PrismaService } from "@shared/integration/services"
import { User } from "@account/business/entities"
import { ValidationException } from "@shared/business/exceptions"
import { Status } from "@database/prisma/generated-client"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, Result<true, HandlerError>> {
  constructor(
    private readonly repository: IUserRepository,
    private readonly client: PrismaService,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<Result<true, HandlerError>> {
    try {
      // 1. Find user by reset token
      const userData = await this.client.user.findUnique({
        where: { password_reset_token: command.token },
      })

      if (!userData) return failure(new BadRequestException("Invalid or expired reset token"))

      if (!userData.password_reset_expires_at || userData.password_reset_expires_at < new Date()) {
        return failure(new BadRequestException("Reset token has expired"))
      }

      // 2. Re-create entity with new password (handles bcrypt hashing + confirm validation)
      const updated = User.instance(
        { ...userData, password: command.password, status: userData.status as Status },
        command.repassword,
      )
      if (!updated.isOk) return failure(new ValidationException(updated.error))

      // 3. Save new password and clear reset token
      const saveResult = await this.repository.save(updated.value)
      if (!saveResult.isOk) return failure(new InternalServerErrorException(saveResult.error))

      await this.client.user.update({
        where: { id: userData.id },
        data: {
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
