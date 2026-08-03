import { ApiProperty } from "@nestjs/swagger"
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator"
import { Status } from '@database/prisma/generated-client'

export class UpdateRoleDto {
  @ApiProperty({
    description: "Unique name of the role",
    example: "admin",
    minLength: 3,
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name?: string

  @ApiProperty({
    description: "Display name of the role for UI purposes",
    example: "Administrator",
    minLength: 3,
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  display_name?: string

  @ApiProperty({
    description: "Description of the role and its purpose",
    example: "Full system administrator with all permissions",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({
    description: "Whether this is a system role that cannot be deleted",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_system?: boolean

  @ApiProperty({
    description: "Status of the role",
    enum: Status,
    example: Status.ACTIVE,
    required: false,
  })
  @IsOptional()
  status?: Status
}
