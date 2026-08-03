import { CommonTimeStamps } from "@shared/business/types"

export function timestamps(data: Partial<CommonTimeStamps>) {
  Date.prototype.toString = function () {
    return this.toISOString()
  }

  const date = new Date()

  const created_at: Date = data.created_at ? new Date(String(data.created_at)) : date
  const updated_at: Date = data.updated_at ? new Date(String(data.updated_at)) : date
  const deleted_at: Date | null = data.deleted_at ? new Date(String(data.deleted_at)) : null

  return {
    created_at,
    updated_at,
    deleted_at,
  }
}
