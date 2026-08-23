import { UserPreferences } from "@database/prisma/generated-client"
import { ErrorCollection, Result } from "@shared/business/utils/error-handling"

export abstract class IUserPreferencesRepository {
  abstract findByUserId(userId: string): Promise<Result<UserPreferences | null, ErrorCollection>>
  abstract upsert(
    userId: string,
    data: Partial<UserPreferences>,
  ): Promise<Result<UserPreferences, ErrorCollection>>
}
