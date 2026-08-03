import { Repository } from "@shared/business/repositories"
import { RefreshToken } from "../entities/refresh-token.entity"
import { ErrorCollection, Result } from "@shared/business/utils/error-handling"
import { Prisma } from '@database/prisma/generated-client'

export abstract class IRefreshTokenRepository extends Repository<RefreshToken> {
  abstract findByUserToken(
    userId: string,
    token: string,
  ): Promise<Result<RefreshToken | null, ErrorCollection>>

  abstract deleteMany(
    args: Prisma.RefreshTokenDeleteManyArgs,
  ): Promise<Result<number, ErrorCollection>>

  /** Revoke all active sessions for a given user (e.g. on account deletion). */
  abstract revokeAllForUser(userId: string): Promise<Result<true, ErrorCollection>>
}
