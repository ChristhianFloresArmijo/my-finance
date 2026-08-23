import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class UpdateAccountDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() first_name?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() last_name?: string
  @ApiProperty({ required: false }) @IsOptional() @IsEmail() email?: string
}

export class ChangePasswordDto {
  @ApiProperty() @IsNotEmpty() @IsString() current_password: string
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])/, {
    message: "new_password must contain uppercase, lowercase, number and special character",
  })
  new_password: string
  @ApiProperty() @IsNotEmpty() @IsString() repassword: string
}

export class UpdateProfileDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() address_line_1?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() address_line_2?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() city?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() state?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() postal_code?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() @Length(2, 2) country?: string
}

export class UpdatePreferencesDto {
  @ApiProperty({ required: false, enum: ["light", "dark", "system"] })
  @IsOptional()
  @IsString()
  @IsIn(["light", "dark", "system"])
  theme?: string

  @ApiProperty({ required: false }) @IsOptional() @IsString() language?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() timezone?: string
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() notify_email?: boolean
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() notify_push?: boolean
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() notify_sms?: boolean
}

export class DeleteAccountDto {
  @ApiProperty() @IsNotEmpty() @IsString() password: string
}
