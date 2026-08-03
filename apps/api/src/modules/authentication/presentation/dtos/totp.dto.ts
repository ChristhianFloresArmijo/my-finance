import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString, Length } from "class-validator"

export class TotpCodeDto {
  @ApiProperty({ description: "6-digit TOTP code or 10-char recovery code", example: "123456" })
  @IsNotEmpty()
  @IsString()
  code: string
}

export class TotpVerifyLoginDto {
  @ApiProperty({ description: "Short-lived pending token returned by sign-in when 2FA is required" })
  @IsNotEmpty()
  @IsString()
  pending_token: string

  @ApiProperty({ description: "6-digit TOTP code or recovery code" })
  @IsNotEmpty()
  @IsString()
  code: string
}

export class TotpSetupResponseDto {
  @ApiProperty({ description: "otpauth:// URI — pass to a QR code renderer" })
  uri: string
}

export class TotpEnableResponseDto {
  @ApiProperty({ description: "One-time recovery codes — show once and never again", type: [String] })
  recovery_codes: string[]
}

export class TotpStatusDto {
  @ApiProperty()
  totp_enabled: boolean

  @ApiProperty({ nullable: true })
  totp_enabled_at: Date | null

  @ApiProperty({ description: "Number of unused recovery codes remaining" })
  recovery_codes_remaining: number
}
