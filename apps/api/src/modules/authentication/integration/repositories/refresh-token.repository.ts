import { RefreshToken } from "@auth/business/entities/refresh-token.entity"
import { IRefreshTokenRepository } from "@auth/business/repositories"
import { Injectable } from "@nestjs/common"
import { Prisma, Status } from '@database/prisma/generated-client'
import { Result, ErrorCollection, success, failure } from "@shared/business/utils/error-handling"
import { RepositoryService } from "@shared/integration/services"

@Injectable()
export class RefreshTokenRepository
  extends RepositoryService<RefreshToken>
  implements IRefreshTokenRepository
{
  model = Prisma.ModelName.RefreshToken
  builder = RefreshToken

  async findByUserToken(
    userId: string,
    token: string,
  ): Promise<Result<RefreshToken | null, ErrorCollection>> {
    const refreshToken = await this.client.refreshToken.findUnique({
      where: { token, user_id: userId },
    })
    if (!refreshToken) return success(null)

    return this.builder.instance(refreshToken)
  }

  async deleteMany(
    args: Prisma.RefreshTokenDeleteManyArgs,
  ): Promise<Result<number, ErrorCollection>> {
    try {
      const result = await this.client.refreshToken.deleteMany(args)
      return success(result.count)
    } catch (error) {
      return failure(error as ErrorCollection)
    }
  }

  async revokeAllForUser(userId: string): Promise<Result<true, ErrorCollection>> {
    try {
      await this.client.refreshToken.updateMany({
        where: { user_id: userId },
        data: { status: Status.INACTIVE },
      })
      return success(true)
    } catch (error) {
      return failure(error as ErrorCollection)
    }
  }
}
