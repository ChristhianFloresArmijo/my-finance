import { RolePermission as PrismaRolePermission, Status } from "@database/prisma/generated-client"
import { CommonTimeStamps, MakePartial } from "@shared/business/types"
import { ensureIsValidEntity } from "@shared/business/entities/validate-entity"
import { ErrorCollection, failure, Result, success } from "@shared/business/utils/error-handling"
import { Id } from "@shared/business/value-object/id.vo"
import { TimeStamp } from "@shared/business/value-object/timestamp.vo"
import * as v from "valibot"

type PartialFields = "id" | keyof CommonTimeStamps

export class RolePermission implements PrismaRolePermission {
  private static readonly rules = {
    id: v.optional(v.string()),
    role_id: v.string(),
    permission_id: v.string(),
    status: v.enum(Status),
    created_at: v.nullish(v.date()),
    updated_at: v.nullish(v.date()),
    deleted_at: v.nullish(v.date()),
  }

  constructor(
    public readonly id: string,
    public readonly role_id: string,
    public readonly permission_id: string,
    public readonly created_at: Date,
    public readonly updated_at: Date | null,
    public readonly deleted_at: Date | null,
    public readonly status: Status,
  ) {}

  public static instance(
    data: MakePartial<RolePermission, PartialFields> & Partial<CommonTimeStamps>,
  ): Result<RolePermission, ErrorCollection> {
    const validationResult = ensureIsValidEntity(v.object(RolePermission.rules), data)
    if (!validationResult.isOk) return failure(validationResult.error)

    const id = new Id(data.id).value
    const { created_at, deleted_at, updated_at } = TimeStamp.createCommonTimestamps(data)

    return success(
      new RolePermission(
        id,
        data.role_id,
        data.permission_id,
        created_at.value,
        updated_at.value,
        deleted_at.value,
        data.status,
      ),
    )
  }

  public static validate(
    data: MakePartial<RolePermission, PartialFields> & Partial<CommonTimeStamps>,
  ): Result<true, ErrorCollection> {
    const result = ensureIsValidEntity(v.object(RolePermission.rules), data)
    if (!result.isOk) return failure(result.error)
    return success(true)
  }
}
