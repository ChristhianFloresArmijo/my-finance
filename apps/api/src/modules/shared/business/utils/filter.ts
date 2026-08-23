import { Prisma } from "@database/prisma/generated-client"

type PrismaMatchTypes = keyof Prisma.StringFilter

export class Filter {
  where: Record<string, any> = {}

  constructor(
    obj: Record<string, any>,
    fields: [string, (value: any) => any, PrismaMatchTypes?, boolean?][], // Add `boolean` to indicate OR condition
  ) {
    const orConditions: Record<string, any>[] = []

    fields.forEach(([key, transform, matchType = "equals", isOr = false]) => {
      if (obj[key] !== undefined) {
        let transformedValue = transform(obj[key])

        if (typeof transformedValue === "boolean") {
          transformedValue = obj[key] === "true" || obj[key] === true
        }
        const condition: Record<string, any> = {
          [matchType]: transformedValue,
        }

        if (["contains", "startsWith", "endsWith"].includes(matchType)) {
          condition.mode = "insensitive"
        }

        if (isOr) {
          orConditions.push({ [key]: condition })
        } else {
          this.where[key] = condition
        }
      }
    })

    if (orConditions.length > 0) {
      this.where.OR = orConditions
    }
  }

  join(obj: { where: Record<string, any> }) {
    this.where = { ...this.where, ...obj.where }
  }
}
