import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { Inject, InternalServerErrorException } from "@nestjs/common"
import * as path from "path"
import { UploadAvatarCommand } from "./command"
import { IUserProfileRepository } from "@account/business/repositories"
import { IStorageProvider, STORAGE_PROVIDER } from "@shared/business/storage/IStorageProvider"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"

@CommandHandler(UploadAvatarCommand)
export class UploadAvatarHandler implements ICommandHandler<
  UploadAvatarCommand,
  Result<string, HandlerError>
> {
  constructor(
    private readonly profileRepository: IUserProfileRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  async execute(command: UploadAvatarCommand): Promise<Result<string, HandlerError>> {
    try {
      // Delete old avatar file if one exists
      const existing = await this.profileRepository.findByUserId(command.userId)
      if (existing.isOk && existing.value?.avatar) {
        await this.storage.delete(existing.value.avatar).catch(() => {})
      }

      const ext = path.extname(command.file.originalname).toLowerCase() || ".jpg"
      const storagePath = `uploads/avatars/${command.userId}-${Date.now()}${ext}`
      const avatarUrl = await this.storage.save(
        storagePath,
        command.file.buffer,
        command.file.mimetype,
      )

      const result = await this.profileRepository.upsert(command.userId, { avatar: avatarUrl })
      if (!result.isOk) return failure(new InternalServerErrorException(result.error))

      return success(avatarUrl)
    } catch (error) {
      return failure(new InternalServerErrorException(error))
    }
  }
}
