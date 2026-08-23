import {
  ListRolesQuery,
  FindRoleByIdQuery,
  GetRolePermissionsQuery,
} from "@authorization/capabilities/queries"
import {
  CreateRoleCommand,
  UpdateRoleCommand,
  DeleteRoleCommand,
  AssignPermissionToRoleCommand,
  RevokePermissionFromRoleCommand,
} from "@authorization/capabilities/commands"
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
  UsePipes,
} from "@nestjs/common"
import {
  ListRolesParams,
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionToRoleDto,
} from "@authorization/presentation/dtos"
import { CommandBus, QueryBus } from "@nestjs/cqrs"
import { HandlerError, Result } from "@shared/business/utils/error-handling"
import { Role, RolePermission } from "@authorization/business/entities"
import { PaginatedResults } from "@shared/business/utils/pagination.dto"
import { JwtAuthGuard } from "@auth/capabilities/guards"
import { RolesGuard } from "@authorization/capabilities/guards"
import { RequireRole } from "@authorization/presentation/decorators"
import { Public } from "@auth/presentation/decorators"
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger"

@ApiTags("roles")
@ApiBearerAuth("JWT")
@Controller("roles")
export class RoleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: "Get all roles" })
  @ApiResponse({
    status: 200,
    description: "List of roles retrieved successfully",
    type: [Role],
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Public()
  @Get()
  async findAll(@Query() query: ListRolesParams) {
    const result = await this.queryBus.execute<
      ListRolesQuery,
      Result<PaginatedResults<Role[]>, HandlerError>
    >(new ListRolesQuery(query))

    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Get role by ID" })
  @ApiParam({ name: "id", description: "Role ID" })
  @ApiResponse({
    status: 200,
    description: "Role retrieved successfully",
    type: Role,
  })
  @ApiResponse({ status: 404, description: "Role not found" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Public()
  @Get(":id")
  async findById(@Param("id") id: string): Promise<Role> {
    const result = await this.queryBus.execute<FindRoleByIdQuery, Result<Role, HandlerError>>(
      new FindRoleByIdQuery(id),
    )

    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Create a new role" })
  @ApiResponse({
    status: 201,
    description: "Role created successfully",
    type: Role,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("superadmin")
  @UsePipes(new ValidationPipe())
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    const result = await this.commandBus.execute<CreateRoleCommand, Result<Role, HandlerError>>(
      new CreateRoleCommand(createRoleDto),
    )

    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Update a role" })
  @ApiParam({ name: "id", description: "Role ID" })
  @ApiResponse({
    status: 200,
    description: "Role updated successfully",
    type: Role,
  })
  @ApiResponse({ status: 404, description: "Role not found" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("superadmin")
  @UsePipes(new ValidationPipe())
  @Put(":id")
  async update(@Param("id") id: string, @Body() updateRoleDto: UpdateRoleDto): Promise<Role> {
    const result = await this.commandBus.execute<UpdateRoleCommand, Result<Role, HandlerError>>(
      new UpdateRoleCommand(id, updateRoleDto),
    )

    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Delete a role" })
  @ApiParam({ name: "id", description: "Role ID" })
  @ApiResponse({
    status: 200,
    description: "Role deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Role not found" })
  @ApiResponse({ status: 403, description: "Cannot delete system role" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("superadmin")
  @Delete(":id")
  async delete(@Param("id") id: string): Promise<{ message: string }> {
    const result = await this.commandBus.execute<DeleteRoleCommand, Result<boolean, HandlerError>>(
      new DeleteRoleCommand(id),
    )

    if (result.isOk) return { message: "Role deleted successfully" }
    throw result.error
  }

  @ApiOperation({ summary: "Get all permissions for a role" })
  @ApiParam({ name: "id", description: "Role ID" })
  @ApiResponse({
    status: 200,
    description: "Role permissions retrieved successfully",
    type: [RolePermission],
  })
  @ApiResponse({ status: 404, description: "Role not found" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Public()
  @Get(":id/permissions")
  async getRolePermissions(@Param("id") id: string): Promise<RolePermission[]> {
    const result = await this.queryBus.execute<
      GetRolePermissionsQuery,
      Result<RolePermission[], HandlerError>
    >(new GetRolePermissionsQuery(id))

    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Assign permission to role" })
  @ApiParam({ name: "id", description: "Role ID" })
  @ApiResponse({
    status: 201,
    description: "Permission assigned to role successfully",
    type: RolePermission,
  })
  @ApiResponse({ status: 404, description: "Role or permission not found" })
  @ApiResponse({ status: 409, description: "Permission already assigned to role" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("superadmin")
  @UsePipes(new ValidationPipe())
  @Post(":id/permissions")
  async assignPermission(
    @Param("id") roleId: string,
    @Body() assignDto: AssignPermissionToRoleDto,
  ): Promise<RolePermission> {
    const result = await this.commandBus.execute<
      AssignPermissionToRoleCommand,
      Result<RolePermission, HandlerError>
    >(
      new AssignPermissionToRoleCommand({
        role_id: roleId,
        permission_id: assignDto.permission_id,
      }),
    )

    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Revoke permission from role" })
  @ApiParam({ name: "id", description: "Role ID" })
  @ApiParam({ name: "permissionId", description: "Permission ID" })
  @ApiResponse({
    status: 200,
    description: "Permission revoked from role successfully",
    type: RolePermission,
  })
  @ApiResponse({ status: 404, description: "Role, permission, or assignment not found" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("superadmin")
  @Delete(":id/permissions/:permissionId")
  async revokePermission(
    @Param("id") roleId: string,
    @Param("permissionId") permissionId: string,
  ): Promise<RolePermission> {
    const result = await this.commandBus.execute<
      RevokePermissionFromRoleCommand,
      Result<RolePermission, HandlerError>
    >(new RevokePermissionFromRoleCommand(roleId, permissionId))

    if (result.isOk) return result.value
    throw result.error
  }
}
