import {
  Permission as PrismaPermission,
  PermissionScope,
  Status,
} from "@database/prisma/generated-client"
import { CommonTimeStamps, MakePartial } from "@shared/business/types"
import { ensureIsValidEntity } from "@shared/business/entities/validate-entity"
import { ErrorCollection, failure, Result, success } from "@shared/business/utils/error-handling"
import { Id } from "@shared/business/value-object"
import { TimeStamp } from "@shared/business/value-object/timestamp.vo"
import * as v from "valibot"

type PartialFields = "id" | "scope" | keyof CommonTimeStamps

export class Permission implements PrismaPermission {
  private static readonly rules = {
    id: v.optional(v.string()),
    resource: v.pipe(
      v.string(),
      v.regex(/^[a-z][a-z0-9_-]*$/, "resource must be a lowercase slug (e.g. 'user', 'blog-post')"),
    ),
    action: v.pipe(
      v.string(),
      v.regex(/^[a-z][a-z0-9_-]*$/, "action must be a lowercase slug (e.g. 'read', 'create')"),
    ),
    scope: v.optional(v.enum(PermissionScope, "scope must be ALL | OWN | TEAM | ORG")),
    description: v.nullish(v.string()),
    is_system: v.boolean(),
    created_at: v.nullish(v.date()),
    updated_at: v.nullish(v.date()),
    deleted_at: v.nullish(v.date()),
    status: v.enum(Status),
  }

  constructor(
    public readonly id: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly scope: PermissionScope,
    public readonly description: string,
    public readonly is_system: boolean,
    public readonly created_at: Date,
    public readonly updated_at: Date,
    public readonly deleted_at: Date,
    public readonly status: Status,
  ) {}

  public static instance(
    data: MakePartial<Permission, PartialFields> & Partial<CommonTimeStamps>,
  ): Result<Permission, ErrorCollection> {
    const result = Permission.validate(data)
    if (!result.isOk) return failure(result.error)

    const id = new Id(data.id).value
    const { created_at, deleted_at, updated_at } = TimeStamp.createCommonTimestamps(data)
    return success(
      new Permission(
        id,
        data.resource,
        data.action,
        data.scope ?? PermissionScope.ALL,
        data.description,
        data.is_system,
        created_at.value,
        updated_at.value,
        deleted_at.value,
        data.status,
      ),
    )
  }

  public static validate(
    data: MakePartial<Permission, PartialFields> & Partial<CommonTimeStamps>,
  ): Result<true, ErrorCollection> {
    const result = ensureIsValidEntity(v.object(Permission.rules), data)
    if (!result.isOk) return failure(result.error)
    return success(true)
  }
}

export { PermissionScope }
