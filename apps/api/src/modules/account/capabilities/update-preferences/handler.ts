import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { InternalServerErrorException } from "@nestjs/common"
import { UpdatePreferencesCommand } from "./command"
import { IUserPreferencesRepository } from "@account/business/repositories"
import { CurrentUserPreferencesDto } from "@auth/presentation/dtos"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"

@CommandHandler(UpdatePreferencesCommand)
export class UpdatePreferencesHandler implements ICommandHandler<
  UpdatePreferencesCommand,
  Result<CurrentUserPreferencesDto, HandlerError>
> {
  constructor(private readonly preferencesRepository: IUserPreferencesRepository) {}

  async execute(
    command: UpdatePreferencesCommand,
  ): Promise<Result<CurrentUserPreferencesDto, HandlerError>> {
    const result = await this.preferencesRepository.upsert(command.userId, command.dto)
    if (!result.isOk) return failure(new InternalServerErrorException(result.error))

    const p = result.value
    return success({
      theme: p.theme,
      language: p.language,
      timezone: p.timezone,
      notify_email: p.notify_email,
      notify_push: p.notify_push,
      notify_sms: p.notify_sms,
    })
  }
}
