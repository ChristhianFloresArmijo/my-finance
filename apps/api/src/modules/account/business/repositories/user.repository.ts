import { User } from "@account/business/entities/user.entity"
import { Repository } from "@shared/business/repositories"
import { ErrorCollection, Result } from "@shared/business/utils/error-handling"
import { CurrentUserDto } from "@auth/presentation/dtos"
export abstract class IUserRepository extends Repository<User> {
  abstract findByEmail(email: string): Promise<Result<User | null, ErrorCollection>>
  abstract findCurrent<TypeError = any>(
    id: string,
  ): Promise<Result<CurrentUserDto | null, TypeError>>

  /** Update account identity fields (name, email) without touching the hashed password. */
  abstract updateIdentity(
    userId: string,
    data: Partial<Pick<User, "first_name" | "last_name" | "email">>,
  ): Promise<Result<User, ErrorCollection>>

  /** Store an email-verification token and its expiry on the user row. */
  abstract storeVerificationToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<Result<true, ErrorCollection>>

  /** Set a user's status to ACTIVE or SUSPENDED (admin operation). */
  abstract updateStatus(
    userId: string,
    status: "ACTIVE" | "SUSPENDED",
  ): Promise<Result<true, ErrorCollection>>
}
