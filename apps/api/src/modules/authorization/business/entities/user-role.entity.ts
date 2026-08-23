import { UserRole as PrismaUserRole, Status } from "@database/prisma/generated-client"
import { CommonTimeStamps, MakePartial } from "@shared/business/types"
import { ensureIsValidEntity } from "@shared/business/entities/validate-entity"
import { ErrorCollection, failure, Result, success } from "@shared/business/utils/error-handling"
import { Id } from "@shared/business/value-object/id.vo"
import { TimeStamp } from "@shared/business/value-object/timestamp.vo"
import * as v from "valibot"

type PartialFields = "id" | "assigned_by" | "expires_at" | keyof CommonTimeStamps

export class UserRole implements PrismaUserRole {
  private static readonly rules = {
    id: v.optional(v.string()),
    user_id: v.string(),
    role_id: v.string(),
    status: v.enum(Status),
    assigned_by: v.nullish(v.string()),
    assigned_at: v.nullish(v.date()),
    expires_at: v.nullish(v.date()),
    created_at: v.nullish(v.date()),
    updated_at: v.nullish(v.date()),
    deleted_at: v.nullish(v.date()),
  }

  constructor(
    public readonly id: string,
    public readonly user_id: string,
    public readonly role_id: string,
    public readonly status: Status,
    public readonly assigned_by: string | null,
    public readonly assigned_at: Date,
    public readonly expires_at: Date | null,
    public readonly created_at: Date,
    public readonly updated_at: Date | null,
    public readonly deleted_at: Date | null,
  ) {}

  public static instance(
    data: MakePartial<UserRole, PartialFields> & Partial<CommonTimeStamps>,
  ): Result<UserRole, ErrorCollection> {
    const result = UserRole.validate(data)
    if (!result.isOk) return failure(result.error)

    const id = new Id(data.id).value
    const { created_at, deleted_at, updated_at } = TimeStamp.createCommonTimestamps(data)

    return success(
      new UserRole(
        id,
        data.user_id,
        data.role_id,
        data.status,
        data.assigned_by,
        data.assigned_at,
        data.expires_at,
        created_at.value,
        updated_at.value,
        deleted_at.value,
      ),
    )
  }

  public static validate(
    data: MakePartial<UserRole, PartialFields> & Partial<CommonTimeStamps>,
  ): Result<true, ErrorCollection> {
    const result = ensureIsValidEntity(v.object(UserRole.rules), data)
    if (!result.isOk) return failure(result.error)
    return success(true)
  }
}
