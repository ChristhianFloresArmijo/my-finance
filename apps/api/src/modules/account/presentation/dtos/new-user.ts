import { ApiProperty } from "@nestjs/swagger"
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsString,
  IsUUID,
} from "class-validator"
import { Status } from "@database/prisma/generated-client"

export class NewUserSerializer {
  @ApiProperty({
    description: "First name of the user",
    example: "John",
  })
  @IsNotEmpty()
  @IsString()
  first_name: string

  @ApiProperty({
    description: "Last name of the user",
    example: "Doe",
  })
  @IsNotEmpty()
  @IsString()
  last_name: string

  @ApiProperty({
    description: "Email of the user",
    example: "johndoe@gmail.com",
  })
  @IsNotEmpty()
  @IsEmail(undefined, { message: "Invalid email" })
  email: string

  @ApiProperty({
    description: "Password of the user",
    example: "P@ssw0rd.",
    // minLength: 8,
    // maxLength: 20,
    // pattern: "(?=.*\\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,}",
  })
  @IsNotEmpty()
  password: string

  @ApiProperty({
    description: "Repassword of the user",
    example: "P@ssw0rd.",
  })
  @IsNotEmpty()
  @IsString()
  repassword: string

  @ApiProperty({
    description: "Status of the user",
    example: "ACTIVE",
    enum: Status,
  })
  @IsNotEmpty()
  status: Status

  @ApiProperty({
    description: "Array of role IDs to assign to the user",
    example: ["550e8400-e29b-41d4-a716-446655440000"],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true, message: "Each role ID must be a valid UUID" })
  role_ids?: string[]

  @ApiProperty({
    description: "Send a welcome email with login credentials to the new user",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  send_credentials?: boolean
}
