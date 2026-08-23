import { Module, forwardRef } from "@nestjs/common"
import {
  IUserRepository,
  IUserProfileRepository,
  IUserPreferencesRepository,
} from "./business/repositories"
import {
  UserRepository,
  UserProfileRepository,
  UserPreferencesRepository,
} from "./integration/repositories"
import {
  UserController,
  UserProfileController,
  UserPreferencesController,
} from "./presentation/restful"
import { CqrsModule } from "@nestjs/cqrs"
import { RepositoryService } from "@shared/integration/services"
import HANDLERS from "@account/capabilities/handlers"
import { AuthorizationModule } from "@authorization/authorization.module"
import { AuthenticationModule } from "@auth/authentication.module"

@Module({
  imports: [
    CqrsModule,
    forwardRef(() => AuthorizationModule),
    forwardRef(() => AuthenticationModule),
  ],
  controllers: [UserController, UserProfileController, UserPreferencesController],
  providers: [
    RepositoryService,
    ...HANDLERS,
    { provide: IUserRepository, useClass: UserRepository },
    { provide: IUserProfileRepository, useClass: UserProfileRepository },
    { provide: IUserPreferencesRepository, useClass: UserPreferencesRepository },
  ],
  exports: [IUserRepository],
})
export class AccountModule {}
