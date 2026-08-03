/**
 * Pure Node.js TOTP service (RFC 6238 / RFC 4226).
 * No external packages — uses only the built-in `crypto` module.
 */
import { Injectable } from "@nestjs/common"
import { createHmac, randomBytes } from "crypto"
import * as bcrypt from "bcrypt"

// ─── Base32 ───────────────────────────────────────────────────────────────────

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

function base32Encode(buf: Buffer): string {
  let bits = 0
  let value = 0
  let output = ""
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i]
    bits += 8
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31]
  }
  return output
}

function base32Decode(str: string): Buffer {
  const s = str.toUpperCase().replace(/=+$/, "")
  const bytes: number[] = []
  let bits = 0
  let value = 0
  for (let i = 0; i < s.length; i++) {
    const idx = BASE32_CHARS.indexOf(s[i])
    if (idx < 0) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

// ─── TOTP (RFC 6238) ──────────────────────────────────────────────────────────

function hotp(secret: Buffer, counter: bigint): string {
  const counterBuf = Buffer.alloc(8)
  counterBuf.writeBigInt64BE(counter)
  const hmac = createHmac("sha1", secret).update(counterBuf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return String(code % 1_000_000).padStart(6, "0")
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class TotpService {
  private readonly STEP = 30n // 30-second window
  private readonly DIGITS = 6
  private readonly WINDOW = 1 // allow ±1 window for clock skew
  private readonly RECOVERY_COUNT = 8
  private readonly RECOVERY_BCRYPT_ROUNDS = 10

  /** Generate a random 20-byte base32-encoded secret. */
  generateSecret(): string {
    return base32Encode(randomBytes(20))
  }

  /**
   * Build an otpauth:// URI for QR code generation.
   * The client renders this with a QR library (e.g. qrcode.js from CDN).
   */
  generateUri(email: string, secret: string, issuer = "MyApp"): string {
    const label = encodeURIComponent(`${issuer}:${email}`)
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: "SHA1",
      digits: String(this.DIGITS),
      period: String(this.STEP),
    })
    return `otpauth://totp/${label}?${params.toString()}`
  }

  /**
   * Verify a 6-digit TOTP code against the stored base32 secret.
   * Accepts codes from the current window ±1 (clock-skew tolerance).
   */
  verifyCode(secret: string, code: string): boolean {
    const secretBuf = base32Decode(secret)
    const now = BigInt(Math.floor(Date.now() / 1000)) / this.STEP
    for (let delta = -this.WINDOW; delta <= this.WINDOW; delta++) {
      if (hotp(secretBuf, now + BigInt(delta)) === code.trim()) return true
    }
    return false
  }

  /**
   * Generate `RECOVERY_COUNT` one-time recovery codes (plain text).
   * Caller must hash these before storing.
   */
  generateRecoveryCodes(): string[] {
    return Array.from(
      { length: this.RECOVERY_COUNT },
      () => randomBytes(5).toString("hex").toUpperCase(), // 10 hex chars
    )
  }

  /** Hash a recovery code for storage. */
  async hashRecoveryCode(code: string): Promise<string> {
    return bcrypt.hash(code, this.RECOVERY_BCRYPT_ROUNDS)
  }

  /** Compare a plain recovery code against a stored bcrypt hash. */
  async verifyRecoveryCode(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash)
  }
}
