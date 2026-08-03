import { Injectable } from "@nestjs/common"
import { UserProfile } from "@database/prisma/generated-client"
import { IUserProfileRepository } from "@account/business/repositories"
import { PrismaService } from "@shared/integration/services"
import { ErrorCollection, Result, success, failure } from "@shared/business/utils/error-handling"

@Injectable()
export class UserProfileRepository implements IUserProfileRepository {
  constructor(private readonly client: PrismaService) {}

  async findByUserId(userId: string): Promise<Result<UserProfile | null, ErrorCollection>> {
    try {
      const profile = await this.client.userProfile.findUnique({ where: { user_id: userId } })
      return success(profile)
    } catch (error) {
      return failure(error as ErrorCollection)
    }
  }

  async upsert(
    userId: string,
    data: Partial<UserProfile>,
  ): Promise<Result<UserProfile, ErrorCollection>> {
    try {
      const profile = await this.client.userProfile.upsert({
        where: { user_id: userId },
        update: data,
        create: { user_id: userId, ...data },
      })
      return success(profile)
    } catch (error) {
      return failure(error as ErrorCollection)
    }
  }
}
