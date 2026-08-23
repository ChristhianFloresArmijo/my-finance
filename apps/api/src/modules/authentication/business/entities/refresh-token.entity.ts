import { RefreshToken as PrismaRefreshToken, Status } from "@database/prisma/generated-client"
import { ensureIsValidEntity, makeSchemaOptional } from "@shared/business/entities/validate-entity"
import { CommonTimeStamps, MakePartial } from "@shared/business/types"
import { ErrorCollection, failure, Result, success } from "@shared/business/utils/error-handling"
import { TimeStamp } from "@shared/business/value-object/timestamp.vo"
import * as v from "valibot"

type PartialFields = "expires_at" | keyof CommonTimeStamps

export class RefreshToken implements PrismaRefreshToken {
  private static readonly rules = {
    id: v.string(),
    token: v.string(),
    expires_at: v.nullish(v.date()),
    user_id: v.string(),
    created_at: v.nullish(v.date()),
    updated_at: v.nullish(v.date()),
    deleted_at: v.nullish(v.date()),
    status: v.enum(Status, "Invalid status"),
  }

  private constructor(
    public id: string,
    public token: string,
    public expires_at: Date,
    public user_id: string,
    public created_at: Date,
    public updated_at: Date | null,
    public deleted_at: Date | null,
    public status: Status,
  ) {}

  public static instance(
    data: MakePartial<RefreshToken, PartialFields> & Partial<CommonTimeStamps>,
  ): Result<RefreshToken, ErrorCollection> {
    const result = RefreshToken.validate(data)

    if (!result.isOk) return failure(result.error)

    const { created_at, deleted_at, updated_at } = TimeStamp.createCommonTimestamps(data)
    const expires_at = data.expires_at
      ? TimeStamp.create(data.expires_at)
      : TimeStamp.create().addDays(1)

    return success(
      new RefreshToken(
        data.id,
        data.token,
        expires_at.value,
        data.user_id,
        created_at.value,
        updated_at.value,
        deleted_at.value,
        data.status,
      ),
    )
  }

  public static validate(
    data: MakePartial<RefreshToken, PartialFields>,
  ): Result<true, ErrorCollection> {
    const validationResult = ensureIsValidEntity(v.object(RefreshToken.rules), data)
    if (validationResult.isOk === false) return validationResult
    return success(true)
  }

  public static partialValidate(
    data: MakePartial<RefreshToken, PartialFields>,
  ): Result<true, ErrorCollection> {
    const rules = makeSchemaOptional(RefreshToken.rules, [
      "id",
      "token",
      "expires_at",
      "user_id",
      "created_at",
      "updated_at",
      "deleted_at",
      "status",
    ])
    const validationResult = ensureIsValidEntity(v.object(rules), data)
    if (validationResult.isOk === false) return validationResult
    return success(true)
  }
}
