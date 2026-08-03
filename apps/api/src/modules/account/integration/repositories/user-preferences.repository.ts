import { Injectable } from "@nestjs/common"
import { UserPreferences } from "@database/prisma/generated-client"
import { IUserPreferencesRepository } from "@account/business/repositories"
import { PrismaService } from "@shared/integration/services"
import { ErrorCollection, Result, success, failure } from "@shared/business/utils/error-handling"

@Injectable()
export class UserPreferencesRepository implements IUserPreferencesRepository {
  constructor(private readonly client: PrismaService) {}

  async findByUserId(userId: string): Promise<Result<UserPreferences | null, ErrorCollection>> {
    try {
      const prefs = await this.client.userPreferences.findUnique({ where: { user_id: userId } })
      return success(prefs)
    } catch (error) {
      return failure(error as ErrorCollection)
    }
  }

  async upsert(
    userId: string,
    data: Partial<UserPreferences>,
  ): Promise<Result<UserPreferences, ErrorCollection>> {
    try {
      const prefs = await this.client.userPreferences.upsert({
        where: { user_id: userId },
        update: data,
        create: { user_id: userId, ...data },
      })
      return success(prefs)
    } catch (error) {
      return failure(error as ErrorCollection)
    }
  }
}
