import { UserProfile } from "@database/prisma/generated-client"
import { ErrorCollection, Result } from "@shared/business/utils/error-handling"

export abstract class IUserProfileRepository {
  abstract findByUserId(userId: string): Promise<Result<UserProfile | null, ErrorCollection>>
  abstract upsert(
    userId: string,
    data: Partial<UserProfile>,
  ): Promise<Result<UserProfile, ErrorCollection>>
}
