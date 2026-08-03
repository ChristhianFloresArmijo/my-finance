import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { Inject, InternalServerErrorException } from "@nestjs/common"
import { DeleteAvatarCommand } from "./command"
import { IUserProfileRepository } from "@account/business/repositories"
import { IStorageProvider, STORAGE_PROVIDER } from "@shared/business/storage/IStorageProvider"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"

@CommandHandler(DeleteAvatarCommand)
export class DeleteAvatarHandler implements ICommandHandler<
  DeleteAvatarCommand,
  Result<true, HandlerError>
> {
  constructor(
    private readonly profileRepository: IUserProfileRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  async execute(command: DeleteAvatarCommand): Promise<Result<true, HandlerError>> {
    try {
      const existing = await this.profileRepository.findByUserId(command.userId)
      if (existing.isOk && existing.value?.avatar) {
        await this.storage.delete(existing.value.avatar).catch(() => {})
      }

      const result = await this.profileRepository.upsert(command.userId, { avatar: null })
      if (!result.isOk) return failure(new InternalServerErrorException(result.error))

      return success(true)
    } catch (error) {
      return failure(new InternalServerErrorException(error))
    }
  }
}
