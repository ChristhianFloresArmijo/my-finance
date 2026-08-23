import { ApiProperty } from "@nestjs/swagger"
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from "class-validator"
import { PermissionScope } from "@authorization/business/entities"

export class CreatePermissionDto {
  @ApiProperty({
    description: "Resource name (e.g., 'user', 'post', 'system')",
    example: "user",
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z][a-z0-9_-]*$/, {
    message:
      "Resource must be lowercase alphanumeric with hyphens/underscores, starting with a letter",
  })
  resource: string

  @ApiProperty({
    description: "Action name (e.g., 'create', 'read', 'update', 'delete', 'manage')",
    example: "create",
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z][a-z0-9_-]*$/, {
    message:
      "Action must be lowercase alphanumeric with hyphens/underscores, starting with a letter",
  })
  action: string

  @ApiProperty({
    description:
      "Scope — ALL: any record, OWN: user's own records only, TEAM: user's team records, ORG: user's org records",
    example: PermissionScope.ALL,
    enum: PermissionScope,
    default: PermissionScope.ALL,
    required: false,
  })
  @IsOptional()
  @IsEnum(PermissionScope, { message: "scope must be ALL | OWN | TEAM | ORG" })
  scope?: PermissionScope

  @ApiProperty({
    description: "Permission description",
    example: "Allows creating new users",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({
    description: "Whether this is a system permission that cannot be deleted",
    example: false,
    default: false,
  })
  @IsBoolean()
  is_system: boolean
}
