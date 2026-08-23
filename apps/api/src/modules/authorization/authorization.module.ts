import { Module, forwardRef } from "@nestjs/common"
import { CqrsModule } from "@nestjs/cqrs"
import {
  RoleRepository,
  PermissionRepository,
  UserPermissionRepository,
} from "@authorization/integration/repositories"
import { RoleController } from "@authorization/presentation/restful/role.controller"
import { PermissionController } from "@authorization/presentation/restful/permission.controller"
import { UserRoleController } from "@authorization/presentation/restful/user-role.controller"
import { UserPermissionController } from "@authorization/presentation/restful/user-permission.controller"
import { StatsController } from "@authorization/presentation/restful/stats.controller"
import { AuditController } from "@authorization/presentation/restful/audit.controller"
import HANDLERS from "@authorization/capabilities/handlers"
import {
  IRoleRepository,
  IPermissionRepository,
  IUserPermissionRepository,
} from "./business/repositories"
import { RepositoryService } from "@shared/integration/services"
import { AccountModule } from "@account/account.module"
import { AuthorizationService } from "./business/services/authorization.service"
import { RolesGuard, PermissionsGuard } from "./capabilities/guards"
import { AuditHandler } from "@shared/capabilities/handlers"

@Module({
  imports: [CqrsModule, forwardRef(() => AccountModule)],
  controllers: [
    RoleController,
    PermissionController,
    UserRoleController,
    UserPermissionController,
    StatsController,
    AuditController,
  ],
  providers: [
    RepositoryService,
    {
      provide: IRoleRepository,
      useClass: RoleRepository,
    },
    {
      provide: IPermissionRepository,
      useClass: PermissionRepository,
    },
    {
      provide: IUserPermissionRepository,
      useClass: UserPermissionRepository,
    },
    AuthorizationService,
    RolesGuard,
    PermissionsGuard,
    AuditHandler,
    ...HANDLERS,
  ],
  exports: [
    IRoleRepository,
    IPermissionRepository,
    IUserPermissionRepository,
    AuthorizationService,
    RolesGuard,
    PermissionsGuard,
  ],
})
export class AuthorizationModule {}
