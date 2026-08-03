import { MakePartial, CommonTimeStamps } from "@shared/business/types"
import { ErrorCollection, failure, Result, success } from "@shared/business/utils/error-handling"
import { Status, User as PrismaUser } from "@database/prisma/generated-client"
import * as v from "valibot"
import { ensureIsValidEntity } from "@shared/business/entities/validate-entity"
import { Id } from "@shared/business/value-object"
import { Encript } from "@shared/business/value-object/encript.vo"
import { Exclude, Expose } from "class-transformer"
import { TimeStamp } from "@shared/business/value-object/timestamp.vo"

type PartialFields =
  | "id"
  | "last_login"
  | "full_name"
  | "comparePassword"
  | "needsPasswordRehash"
  | "email_verified_at"
  | "password_reset_token"
  | "password_reset_expires_at"
  | "totp_secret"
  | "totp_enabled"
  | "totp_enabled_at"
  | keyof CommonTimeStamps

export class User implements PrismaUser {
  private static readonly rules = {
    id: v.optional(v.string()),
    first_name: v.string(),
    last_name: v.string(),
    email: v.pipe(v.string(), v.email()),
    password: v.union([
      // Plain password (new, not yet hashed)
      v.pipe(v.string(), v.regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,}$/)),
      // Already-hashed SHA-256 (legacy — accepted during lazy bcrypt migration)
      v.pipe(v.string(), v.hash(["sha256"])),
      // Already-hashed bcrypt
      v.pipe(v.string(), v.regex(/^\$2[ab]\$\d{2}\$.{53}$/)),
    ]),
    status: v.enum(Status, "Invalid status"),
    last_login: v.nullish(v.date()),
    created_at: v.nullish(v.date()),
    updated_at: v.nullish(v.date()),
    deleted_at: v.nullish(v.date()),
  }

  @Exclude({ toPlainOnly: true })
  public password: string

  private constructor(
    public readonly id: string,
    public first_name: string,
    public last_name: string,
    public email: string,
    password: string,
    public status: Status,
    public created_at: Date,
    public updated_at: Date | null,
    public deleted_at: Date | null,
    public last_login: Date | null,
    public email_verified_at: Date | null,
    public password_reset_token: string | null,
    public password_reset_expires_at: Date | null,
    public totp_secret: string | null = null,
    public totp_enabled: boolean = false,
    public totp_enabled_at: Date | null = null,
  ) {
    this.password = password
  }

  public static instance(
    data: MakePartial<User, PartialFields> & Partial<CommonTimeStamps>,
    repassword?: string,
  ): Result<User, ErrorCollection> {
    const result = User.validate(data, repassword)
    if (!result.isOk) return failure(result.error)

    const id = new Id(data.id).value
    const isBcrypt = /^\$2[ab]\$/.test(data.password)
    const isSha256 = /^[a-f0-9]{64}$/i.test(data.password)
    // Pass already-hashed values through; hash plaintext with bcrypt
    const password =
      isBcrypt || isSha256 ? data.password : Encript.create(data.password, "hash").value
    const { created_at, deleted_at, updated_at } = TimeStamp.createCommonTimestamps(data)
    const last_login = data.last_login ? TimeStamp.create(data.last_login) : TimeStamp.create(null)
    return success(
      new User(
        id,
        data.first_name,
        data.last_name,
        data.email.toLowerCase(),
        password,
        data.status,
        created_at.value,
        updated_at.value,
        deleted_at.value,
        last_login.value,
        data.email_verified_at ?? null,
        data.password_reset_token ?? null,
        data.password_reset_expires_at ?? null,
        data.totp_secret ?? null,
        data.totp_enabled ?? false,
        data.totp_enabled_at ?? null,
      ),
    )
  }

  public static validate(
    data: MakePartial<User, PartialFields>,
    repassword?: string,
  ): Result<true, ErrorCollection> {
    const validationResult = ensureIsValidEntity(v.object(User.rules), data)

    let collectedErrors: ErrorCollection = validationResult.isOk ? {} : validationResult.error

    if (repassword) {
      const confirmPassword = User.confirmPassword(data.password, repassword)
      if (confirmPassword.isOk === false) {
        collectedErrors = { ...collectedErrors, ...confirmPassword.error }
      }
    }

    if (Object.keys(collectedErrors).length > 0) return failure(collectedErrors)

    return success(true)
  }

  // public static partialValidate(
  //   data: MakePartial<User, PartialFields>,
  //   repassword?: string,
  // ): Result<true, ErrorCollection> {
  //   const rules = makeSchemaOptional(User.rules, [
  //     "first_name",
  //     "last_name",
  //     "email",
  //     "password",
  //     "status",
  //     "last_login",
  //     "created_at",
  //     "updated_at",
  //     "deleted_at",
  //   ])
  //   const validationResult = ensureIsValidEntity(v.object(rules), data)
  //   if (repassword) {
  //     const confirmPassword = User.confirmPassword(data.password, repassword)
  //     if (confirmPassword.isOk === false)
  //       validationResult.error = { ...validationResult.error, ...confirmPassword.error }
  //   }

  //   if (validationResult.isOk === false) return validationResult

  //   return success(true)
  // }

  public static confirmPassword(
    password: string,
    repassword: string,
  ): Result<true, ErrorCollection> {
    if (password !== repassword) return failure({ password: ["Passwords do not match"] })
    return success(true)
  }

  public comparePassword(plainPassword: string): boolean {
    const method = /^\$2[ab]\$/.test(this.password) ? "hash" : "sha256"
    return Encript.compare(plainPassword, this.password, method)
  }

  /**
   * Returns true if the stored password is still SHA-256.
   * The sign-in handler should re-hash with bcrypt after a successful login
   * to transparently migrate the user to bcrypt.
   */
  public needsPasswordRehash(): boolean {
    return /^[a-f0-9]{64}$/i.test(this.password)
  }

  @Expose()
  get full_name(): string {
    return `${this.first_name} ${this.last_name}`
  }
}
