import { CreateUserHandler } from "./create-user"
import { FindUserByIdHandler } from "./find-user-by-id"
import { ListUsersHandler } from "./list-users"
import { UpdateAccountHandler } from "./update-account"
import { ChangePasswordHandler } from "./change-password"
import { UpdateProfileHandler } from "./update-profile"
import { UploadAvatarHandler } from "./upload-avatar"
import { DeleteAvatarHandler } from "./delete-avatar"
import { UpdatePreferencesHandler } from "./update-preferences"
import { DeleteAccountHandler } from "./delete-account"
import { UpdateUserStatusHandler } from "./update-user-status"

export default [
  CreateUserHandler,
  FindUserByIdHandler,
  ListUsersHandler,
  UpdateAccountHandler,
  ChangePasswordHandler,
  UpdateProfileHandler,
  UploadAvatarHandler,
  DeleteAvatarHandler,
  UpdatePreferencesHandler,
  DeleteAccountHandler,
  UpdateUserStatusHandler,
]
