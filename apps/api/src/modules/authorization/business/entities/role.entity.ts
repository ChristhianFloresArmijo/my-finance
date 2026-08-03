import { Role as PrismaRole, Status } from '@database/prisma/generated-client'
import { ensureIsValidEntity } from "@shared/business/entities/validate-entity"
import { CommonTimeStamps, MakePartial } from "@shared/business/types"
import { ErrorCollection, failure, Result, success } from "@shared/business/utils/error-handling"
import { Id } from "@shared/business/value-object"
import { TimeStamp } from "@shared/business/value-object/timestamp.vo"

import * as v from "valibot"

type PartialFields = "id" | keyof CommonTimeStamps

export class Role implements PrismaRole {
  private static readonly rules = {
    id: v.optional(v.string()),
    name: v.pipe(v.string(), v.minLength(3), v.maxLength(255)),
    display_name: v.pipe(v.string(), v.minLength(3), v.maxLength(255)),
    description: v.nullish(v.string()),
    is_system: v.boolean(),
    created_at: v.nullish(v.date()),
    updated_at: v.nullish(v.date()),
    deleted_at: v.nullish(v.date()),
    status: v.enum(Status),
  }

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly display_name: string,
    public readonly description: string,
    public readonly is_system: boolean,
    public readonly created_at: Date,
    public readonly updated_at: Date,
    public readonly deleted_at: Date,
    public readonly status: Status,
  ) {}

  public static instance(data: MakePartial<Role, PartialFields>): Result<Role, ErrorCollection> {
    const result = Role.validate(data)
    if (!result.isOk) return failure(result.error)

    const id = new Id(data.id).value
    const { created_at, deleted_at, updated_at } = TimeStamp.createCommonTimestamps(data)

    return success(
      new Role(
        id,
        data.name,
        data.display_name,
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
    data: MakePartial<Role, PartialFields> & Partial<CommonTimeStamps>,
  ): Result<true, ErrorCollection> {
    const validationResult = ensureIsValidEntity(v.object(Role.rules), data)
    if (!validationResult.isOk) return failure(validationResult.error)
    return success(true)
  }
}
