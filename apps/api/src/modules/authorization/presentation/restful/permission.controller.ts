import { ListPermissionsQuery, FindPermissionByIdQuery } from "@authorization/capabilities/queries"
import {
  CreatePermissionCommand,
  UpdatePermissionCommand,
  DeletePermissionCommand,
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
  ListPermissionsParams,
  CreatePermissionDto,
  UpdatePermissionDto,
} from "@authorization/presentation/dtos"
import { CommandBus, QueryBus } from "@nestjs/cqrs"
import { HandlerError, Result } from "@shared/business/utils/error-handling"
import { Permission } from "@authorization/business/entities"
import { PaginatedResults } from "@shared/business/utils/pagination.dto"
import { JwtAuthGuard } from "@auth/capabilities/guards"
import { RolesGuard } from "@authorization/capabilities/guards"
import { RequireRole } from "@authorization/presentation/decorators"
import { Public } from "@auth/presentation/decorators"
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger"

@ApiTags("permissions")
@ApiBearerAuth("JWT")
@Controller("permissions")
export class PermissionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: "Get all permissions" })
  @ApiResponse({
    status: 200,
    description: "List of permissions retrieved successfully",
    type: [Permission],
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Public()
  @Get()
  async findAll(@Query() query: ListPermissionsParams) {
    const result = await this.queryBus.execute<
      ListPermissionsQuery,
      Result<PaginatedResults<Permission[]>, HandlerError>
    >(new ListPermissionsQuery(query))

    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Get permission by ID" })
  @ApiParam({ name: "id", description: "Permission ID" })
  @ApiResponse({
    status: 200,
    description: "Permission retrieved successfully",
    type: Permission,
  })
  @ApiResponse({ status: 404, description: "Permission not found" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Public()
  @Get(":id")
  async findById(@Param("id") id: string): Promise<Permission> {
    const result = await this.queryBus.execute<
      FindPermissionByIdQuery,
      Result<Permission, HandlerError>
    >(new FindPermissionByIdQuery(id))

    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Create a new permission" })
  @ApiResponse({
    status: 201,
    description: "Permission created successfully",
    type: Permission,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('superadmin')
  @UsePipes(new ValidationPipe())
  @Post()
  async create(@Body() createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const result = await this.commandBus.execute<
      CreatePermissionCommand,
      Result<Permission, HandlerError>
    >(new CreatePermissionCommand(createPermissionDto))

    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Update a permission" })
  @ApiParam({ name: "id", description: "Permission ID" })
  @ApiResponse({
    status: 200,
    description: "Permission updated successfully",
    type: Permission,
  })
  @ApiResponse({ status: 404, description: "Permission not found" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 403, description: "Cannot modify system permission" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('superadmin')
  @UsePipes(new ValidationPipe())
  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const result = await this.commandBus.execute<
      UpdatePermissionCommand,
      Result<Permission, HandlerError>
    >(new UpdatePermissionCommand(id, updatePermissionDto))

    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Delete a permission" })
  @ApiParam({ name: "id", description: "Permission ID" })
  @ApiResponse({
    status: 200,
    description: "Permission deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Permission not found" })
  @ApiResponse({ status: 403, description: "Cannot delete system permission or permission in use" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('superadmin')
  @Delete(":id")
  async delete(@Param("id") id: string): Promise<{ message: string }> {
    const result = await this.commandBus.execute<
      DeletePermissionCommand,
      Result<boolean, HandlerError>
    >(new DeletePermissionCommand(id))

    if (result.isOk) return { message: "Permission deleted successfully" }
    throw result.error
  }
}
