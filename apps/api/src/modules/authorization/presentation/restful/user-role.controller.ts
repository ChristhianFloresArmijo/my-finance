import {
  AssignRoleToUserCommand,
  RevokeRoleFromUserCommand,
} from "@authorization/capabilities/commands"
import { GetUserRolesQuery } from "@authorization/capabilities/queries"
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
  ValidationPipe,
  UsePipes,
} from "@nestjs/common"
import { AssignRoleToUserDto } from "@authorization/presentation/dtos"
import { CommandBus, QueryBus } from "@nestjs/cqrs"
import { HandlerError, Result } from "@shared/business/utils/error-handling"
import { UserRole } from "@authorization/business/entities"
import { JwtAuthGuard } from "@auth/capabilities/guards"
import { CurrentUser, Public } from "@auth/presentation/decorators"
import { AccessTokenPayload } from "@auth/business/types"
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger"

@ApiTags("user-roles")
@ApiBearerAuth("JWT")
@Controller("user-roles")
export class UserRoleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: "Assign role to user" })
  @ApiResponse({
    status: 201,
    description: "Role assigned to user successfully",
    type: UserRole,
  })
  @ApiResponse({ status: 404, description: "User or role not found" })
  @ApiResponse({ status: 409, description: "Role already assigned to user" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Post()
  async assignRole(
    @Body() assignDto: AssignRoleToUserDto,
    @CurrentUser() currentUser: AccessTokenPayload,
  ): Promise<UserRole> {
    const result = await this.commandBus.execute<
      AssignRoleToUserCommand,
      Result<UserRole, HandlerError>
    >(new AssignRoleToUserCommand({ ...assignDto, assigned_by: currentUser.id }))

    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Revoke role from user" })
  @ApiParam({ name: "userId", description: "User ID" })
  @ApiParam({ name: "roleId", description: "Role ID" })
  @ApiResponse({
    status: 200,
    description: "Role revoked from user successfully",
    type: UserRole,
  })
  @ApiResponse({ status: 404, description: "User, role, or assignment not found" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Delete(":userId/roles/:roleId")
  async revokeRole(
    @Param("userId") userId: string,
    @Param("roleId") roleId: string,
  ): Promise<UserRole> {
    const result = await this.commandBus.execute<
      RevokeRoleFromUserCommand,
      Result<UserRole, HandlerError>
    >(new RevokeRoleFromUserCommand(userId, roleId))

    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Get all roles for a user" })
  @ApiParam({ name: "userId", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User roles retrieved successfully",
    type: [UserRole],
  })
  @ApiResponse({ status: 404, description: "User not found" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Public()
  @Get("users/:userId/roles")
  async getUserRoles(@Param("userId") userId: string): Promise<UserRole[]> {
    const result = await this.queryBus.execute<GetUserRolesQuery, Result<UserRole[], HandlerError>>(
      new GetUserRolesQuery(userId),
    )

    if (result.isOk) return result.value
    throw result.error
  }
}
