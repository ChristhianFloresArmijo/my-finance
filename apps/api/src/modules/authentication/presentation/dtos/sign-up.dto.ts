import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class SignUpDto {
  @ApiProperty() @IsNotEmpty() @IsString() first_name: string
  @ApiProperty() @IsNotEmpty() @IsString() last_name: string
  @ApiProperty() @IsEmail() @IsNotEmpty() email: string
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,}/, {
    message: "Password must contain uppercase, lowercase, number, and special character",
  })
  password: string
  @ApiProperty() @IsNotEmpty() @IsString() repassword: string
  @ApiProperty({
    description:
      "Role IDs to assign on registration. Falls back to DEFAULT_SIGNUP_ROLE env var if omitted.",
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  role_ids?: string[]
}
