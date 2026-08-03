import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString } from "class-validator"

export class AssignRoleToUserDto {
  @ApiProperty({
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  user_id: string

  @ApiProperty({
    description: "Role ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  role_id: string

  @ApiProperty({
    description: "Optional expiration date for the role assignment",
    example: "2025-12-31T23:59:59Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expires_at?: string
}
