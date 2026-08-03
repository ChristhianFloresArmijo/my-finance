import { ApiProperty } from "@nestjs/swagger"
import { Status } from "@database/prisma/generated-client"

export class CurrentUserRoleDto {
  @ApiProperty() id: string
  @ApiProperty() name: string
  @ApiProperty() display_name: string
}

export class CurrentUserPermissionDto {
  @ApiProperty() id: string
  @ApiProperty() resource: string
  @ApiProperty() action: string
  @ApiProperty() scope: string
  @ApiProperty({ required: false, nullable: true }) description: string | null
}

export class CurrentUserProfileDto {
  @ApiProperty({ required: false, nullable: true }) avatar: string | null
  @ApiProperty({ required: false, nullable: true }) phone: string | null
  @ApiProperty({ required: false, nullable: true }) address_line_1: string | null
  @ApiProperty({ required: false, nullable: true }) address_line_2: string | null
  @ApiProperty({ required: false, nullable: true }) city: string | null
  @ApiProperty({ required: false, nullable: true }) state: string | null
  @ApiProperty({ required: false, nullable: true }) postal_code: string | null
  @ApiProperty({ required: false, nullable: true }) country: string | null
}

export class CurrentUserPreferencesDto {
  @ApiProperty() theme: string
  @ApiProperty() language: string
  @ApiProperty() timezone: string
  @ApiProperty() notify_email: boolean
  @ApiProperty() notify_push: boolean
  @ApiProperty() notify_sms: boolean
}

export class CurrentUserDto {
  @ApiProperty() id: string
  @ApiProperty() first_name: string
  @ApiProperty() last_name: string
  @ApiProperty() full_name: string
  @ApiProperty() email: string
  @ApiProperty({ enum: Status }) status: Status
  @ApiProperty() created_at: Date
  @ApiProperty({ type: [CurrentUserRoleDto] }) roles: CurrentUserRoleDto[]
  @ApiProperty({ type: [CurrentUserPermissionDto] }) permissions: CurrentUserPermissionDto[]
  @ApiProperty({ type: CurrentUserProfileDto, nullable: true }) profile: CurrentUserProfileDto | null
  @ApiProperty({ type: CurrentUserPreferencesDto, nullable: true }) preferences: CurrentUserPreferencesDto | null
}
