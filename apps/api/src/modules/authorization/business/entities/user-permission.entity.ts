import { UserPermission as PrismaUserPermission, Status } from '@database/prisma/generated-client'
import { CommonTimeStamps, MakePartial } from "@shared/business/types"
import { ensureIsValidEntity } from "@shared/business/entities/validate-entity"
import { ErrorCollection, failure, Result, success } from "@shared/business/utils/error-handling"
import { Id } from "@shared/business/value-object/id.vo"
import { TimeStamp } from "@shared/business/value-object/timestamp.vo"
import * as v from "valibot"

type PartialFields = "id" | "assigned_by" | "expires_at" | keyof CommonTimeStamps

export class UserPermission implements PrismaUserPermission {
  private static readonly rules = {
    id: v.optional(v.string()),
    user_id: v.pipe(v.string(), v.uuid()),
    permission_id: v.pipe(v.string(), v.uuid()),
    status: v.enum(Status),
    assigned_by: v.nullish(v.pipe(v.string(), v.uuid())),
    assigned_at: v.nullish(v.date()),
    expires_at: v.nullish(v.date()),
    created_at: v.nullish(v.date()),
    updated_at: v.nullish(v.date()),
    deleted_at: v.nullish(v.date()),
  }

  constructor(
    public readonly id: string,
    public readonly user_id: string,
    public readonly permission_id: string,
    public readonly status: Status,
    public readonly assigned_by: string | null,
    public readonly assigned_at: Date,
    public readonly expires_at: Date | null,
    public readonly created_at: Date,
    public readonly updated_at: Date | null,
    public readonly deleted_at: Date | null,
  ) {}

  public static instance(
    data: MakePartial<UserPermission, PartialFields> & Partial<CommonTimeStamps>,
  ): Result<UserPermission, ErrorCollection> {
    const result = UserPermission.validate(data)
    if (!result.isOk) return failure(result.error)

    const id = new Id(data.id).value
    const { created_at, deleted_at, updated_at } = TimeStamp.createCommonTimestamps(data)

    return success(
      new UserPermission(
        id,
        data.user_id,
        data.permission_id,
        data.status,
        data.assigned_by ?? null,
        data.assigned_at ?? new Date(),
        data.expires_at ?? null,
        created_at.value,
        updated_at.value,
        deleted_at.value,
      ),
    )
  }

  public static validate(
    data: MakePartial<UserPermission, PartialFields> & Partial<CommonTimeStamps>,
  ): Result<true, ErrorCollection> {
    const result = ensureIsValidEntity(v.object(UserPermission.rules), data)
    if (!result.isOk) return failure(result.error)
    return success(true)
  }
}
