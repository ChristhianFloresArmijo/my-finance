import { BaseSchema, ObjectSchema, safeParse, optional } from "valibot"
import { failure, Result, success } from "@shared/business/utils/error-handling"

export function ensureIsValidEntity(
  rules: ObjectSchema<any, any>,
  value: any,
): Result<true, Record<string, string[]>> {
  const result = safeParse(rules, value)

  if (result.success) return success(true)

  const hasErrors: Record<string, string[]> = {}

  result.issues.forEach((issue: { path: { key: string }[]; message: string }) => {
    const key = issue?.path?.[0].key
    if (!hasErrors[key]) hasErrors[key] = []
    hasErrors[key].push(issue.message)
  })

  return failure(hasErrors)
}

export function makeSchemaOptional<
  T extends Record<string, BaseSchema<unknown, unknown, any>>,
  K extends keyof T,
>(schema: T, fields: K[]): T {
  const optionalFields = {
    ...schema,
  }

  for (const field of fields) {
    optionalFields[field] = optional(schema[field]) as any
  }

  return optionalFields
}
