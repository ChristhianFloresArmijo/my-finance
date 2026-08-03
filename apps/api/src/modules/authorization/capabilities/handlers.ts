import { ListRolesHandler } from "./list-roles"
import { CreateRoleHandler } from "./create-role"
import { UpdateRoleHandler } from "./update-role"
import { DeleteRoleHandler } from "./delete-role"
import { FindRoleByIdHandler } from "./find-role-by-id"
import { ListPermissionsHandler } from "./list-permissions"
import { CreatePermissionHandler } from "./create-permission"
import { UpdatePermissionHandler } from "./update-permission"
import { DeletePermissionHandler } from "./delete-permission"
import { FindPermissionByIdHandler } from "./find-permission-by-id"
import { AssignPermissionToRoleHandler } from "./assign-permission-to-role"
import { RevokePermissionFromRoleHandler } from "./revoke-permission-from-role"
import { GetRolePermissionsHandler } from "./get-role-permissions"
import { AssignRoleToUserHandler } from "./assign-role-to-user"
import { RevokeRoleFromUserHandler } from "./revoke-role-from-user"
import { GetUserRolesHandler } from "./get-user-roles"
import { AssignPermissionToUserHandler } from "./assign-permission-to-user"
import { RevokePermissionFromUserHandler } from "./revoke-permission-from-user"
import { GetUserDirectPermissionsHandler } from "./get-user-direct-permissions"

export default [
  ListRolesHandler,
  CreateRoleHandler,
  UpdateRoleHandler,
  DeleteRoleHandler,
  FindRoleByIdHandler,
  ListPermissionsHandler,
  CreatePermissionHandler,
  UpdatePermissionHandler,
  DeletePermissionHandler,
  FindPermissionByIdHandler,
  AssignPermissionToRoleHandler,
  RevokePermissionFromRoleHandler,
  GetRolePermissionsHandler,
  AssignRoleToUserHandler,
  RevokeRoleFromUserHandler,
  GetUserRolesHandler,
  AssignPermissionToUserHandler,
  RevokePermissionFromUserHandler,
  GetUserDirectPermissionsHandler,
]
