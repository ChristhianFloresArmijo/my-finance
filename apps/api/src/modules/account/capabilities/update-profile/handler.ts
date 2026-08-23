import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { InternalServerErrorException } from "@nestjs/common"
import { UpdateProfileCommand } from "./command"
import { IUserProfileRepository } from "@account/business/repositories"
import { CurrentUserProfileDto } from "@auth/presentation/dtos"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<
  UpdateProfileCommand,
  Result<CurrentUserProfileDto, HandlerError>
> {
  constructor(private readonly profileRepository: IUserProfileRepository) {}

  async execute(
    command: UpdateProfileCommand,
  ): Promise<Result<CurrentUserProfileDto, HandlerError>> {
    const result = await this.profileRepository.upsert(command.userId, command.dto)
    if (!result.isOk) return failure(new InternalServerErrorException(result.error))

    const p = result.value
    return success({
      avatar: p.avatar,
      phone: p.phone,
      address_line_1: p.address_line_1,
      address_line_2: p.address_line_2,
      city: p.city,
      state: p.state,
      postal_code: p.postal_code,
      country: p.country,
    })
  }
}
