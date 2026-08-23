import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common"
import { CommandBus, QueryBus } from "@nestjs/cqrs"
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger"
import {
  AssignPermissionToUserCommand,
  RevokePermissionFromUserCommand,
} from "@authorization/capabilities/commands"
import { GetUserDirectPermissionsQuery } from "@authorization/capabilities/queries"
import { AssignPermissionToUserDto } from "@authorization/presentation/dtos"
import { UserPermission } from "@authorization/business/entities"
import { JwtAuthGuard } from "@auth/capabilities/guards"
import { CurrentUser } from "@auth/presentation/decorators"
import { AccessTokenPayload } from "@auth/business/types"
import { HandlerError, Result } from "@shared/business/utils/error-handling"

@ApiTags("user-permissions")
@ApiBearerAuth("JWT")
@Controller("user-permissions")
export class UserPermissionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: "Grant a permission directly to a user (bypasses roles)" })
  @ApiResponse({
    status: 201,
    description: "Permission assigned successfully",
    type: UserPermission,
  })
  @ApiResponse({ status: 404, description: "User or permission not found" })
  @ApiResponse({ status: 409, description: "Permission already assigned to user" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Post()
  async assignPermission(
    @Body() dto: AssignPermissionToUserDto,
    @CurrentUser() currentUser: AccessTokenPayload,
  ): Promise<UserPermission> {
    const result = await this.commandBus.execute<
      AssignPermissionToUserCommand,
      Result<UserPermission, HandlerError>
    >(new AssignPermissionToUserCommand({ ...dto, assigned_by: currentUser.id }))

    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Revoke a direct permission from a user" })
  @ApiParam({ name: "userId", description: "User ID" })
  @ApiParam({ name: "permissionId", description: "Permission ID" })
  @ApiResponse({
    status: 200,
    description: "Permission revoked successfully",
    type: UserPermission,
  })
  @ApiResponse({ status: 404, description: "User or assignment not found" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Delete(":userId/permissions/:permissionId")
  async revokePermission(
    @Param("userId") userId: string,
    @Param("permissionId") permissionId: string,
  ): Promise<UserPermission> {
    const result = await this.commandBus.execute<
      RevokePermissionFromUserCommand,
      Result<UserPermission, HandlerError>
    >(new RevokePermissionFromUserCommand(userId, permissionId))

    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Get all direct permissions for a user" })
  @ApiParam({ name: "userId", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "Direct permissions retrieved successfully",
    type: [UserPermission],
  })
  @ApiResponse({ status: 404, description: "User not found" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Get(":userId/permissions")
  async getUserDirectPermissions(@Param("userId") userId: string): Promise<UserPermission[]> {
    const result = await this.queryBus.execute<
      GetUserDirectPermissionsQuery,
      Result<UserPermission[], HandlerError>
    >(new GetUserDirectPermissionsQuery(userId))

    if (result.isOk) return result.value
    throw result.error
  }
}
