import { ensureIsValidEntity } from "@shared/business/entities/validate-entity"
import { MakePartial } from "@shared/business/types"
import { ErrorCollection, failure, Result, success } from "@shared/business/utils/error-handling"
import { Id } from "@shared/business/value-object"
import { TimeStamp } from "@shared/business/value-object/timestamp.vo"

import * as v from "valibot"

type PartialFields = "id" | "created_at"

export class ChangeLog {
  private static readonly rules = {
    id: v.optional(v.string()),
    action: v.pipe(v.string(), v.minLength(1)),
    entity_type: v.pipe(v.string(), v.minLength(1)),
    entity_id: v.nullish(v.string()),
    performed_by: v.nullish(v.string()),
    payload: v.nullish(v.any()),
    created_at: v.nullish(v.date()),
  }

  constructor(
    public readonly id: string,
    public readonly action: string,
    public readonly entity_type: string,
    public readonly entity_id: string | null,
    public readonly performed_by: string | null,
    public readonly payload: unknown,
    public readonly created_at: Date,
  ) {}

  public static instance(
    data: MakePartial<ChangeLog, PartialFields>,
  ): Result<ChangeLog, ErrorCollection> {
    const result = ChangeLog.validate(data)
    if (!result.isOk) return failure(result.error)

    const id = new Id(data.id).value
    const created_at = data.created_at ? TimeStamp.create(data.created_at) : TimeStamp.now()

    return success(
      new ChangeLog(
        id,
        data.action,
        data.entity_type,
        data.entity_id ?? null,
        data.performed_by ?? null,
        data.payload ?? null,
        created_at.value,
      ),
    )
  }

  public static validate(
    data: MakePartial<ChangeLog, PartialFields>,
  ): Result<true, ErrorCollection> {
    const validationResult = ensureIsValidEntity(v.object(ChangeLog.rules), data)
    if (!validationResult.isOk) return failure(validationResult.error)
    return success(true)
  }
}
