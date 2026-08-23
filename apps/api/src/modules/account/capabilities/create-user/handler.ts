import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs"
import { InternalServerErrorException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { v4 as uuidv4 } from "uuid"
import {
  IUserRepository,
  IUserProfileRepository,
  IUserPreferencesRepository,
} from "@account/business/repositories"
import { IRoleRepository } from "@authorization/business/repositories"
import { MailService } from "@shared/integration/mail/MailService"
import { User } from "@account/business/entities"
import { UserRole } from "@authorization/business/entities"
import { CreateUserCommand } from "./command"
import { failure, HandlerError, Result } from "@shared/business/utils/error-handling"
import { ValidationException } from "@shared/business/exceptions"
import { AuditEvent } from "@shared/capabilities/events"

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<
  CreateUserCommand,
  Result<User, HandlerError>
> {
  constructor(
    private readonly repository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly profileRepository: IUserProfileRepository,
    private readonly preferencesRepository: IUserPreferencesRepository,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<Result<User, HandlerError>> {
    // 1. Guard: email must not already exist
    const existing = await this.repository.findByEmail(command.data.email)
    if (!existing.isOk) {
      return failure(new InternalServerErrorException(existing.error))
    }
    if (existing.value) {
      return failure(
        new InternalServerErrorException(undefined, "This email is not available or is blocked"),
      )
    }

    // 2. Create and save the User entity
    const { repassword, role_ids, send_credentials, ...data } = command.data
    const plaintextPassword = data.password
    const entity = User.instance(data, repassword)
    if (!entity.isOk) return failure(new ValidationException(entity.error))

    const result = await this.repository.save(entity.value)
    if (!result.isOk) return failure(new InternalServerErrorException(result.error))

    const createdUser = result.value

    // 3. Auto-create UserProfile and UserPreferences with defaults (best-effort)
    await this.profileRepository.upsert(createdUser.id, {}).catch(() => {})
    await this.preferencesRepository.upsert(createdUser.id, {}).catch(() => {})

    // 4. Resolve role IDs: use provided ones or fall back to DEFAULT_SIGNUP_ROLE by name
    const resolvedRoleIds: string[] = []

    if (role_ids && role_ids.length > 0) {
      resolvedRoleIds.push(...role_ids)
    } else {
      const defaultRoleName = this.configService.get<string>("defaultSignupRole")
      if (defaultRoleName) {
        const defaultRole = await this.roleRepository.findByName(defaultRoleName)
        if (defaultRole.isOk && defaultRole.value) {
          resolvedRoleIds.push(defaultRole.value.id)
        }
      }
    }

    // 5. Assign roles (best-effort)
    for (const roleId of resolvedRoleIds) {
      const roleResult = await this.roleRepository.findById(roleId)
      if (!roleResult.isOk || !roleResult.value) {
        console.warn(`Role ${roleId} not found, skipping assignment`)
        continue
      }

      const userRoleResult = UserRole.instance({
        user_id: createdUser.id,
        role_id: roleId,
        assigned_by: null,
        assigned_at: new Date(),
        expires_at: null,
        status: "ACTIVE" as const,
      })
      if (!userRoleResult.isOk) {
        console.warn(`Failed to build UserRole for ${roleId}:`, userRoleResult.error)
        continue
      }

      const assignResult = await this.roleRepository.assignRoleToUser(userRoleResult.value)
      if (!assignResult.isOk) {
        console.warn(
          `Failed to assign role ${roleId} to user ${createdUser.id}:`,
          assignResult.error,
        )
      }
    }

    const appUrl = this.configService.get<string>("appUrl") ?? "http://localhost:5173"

    // 6. Send welcome email with credentials if requested (admin-created users)
    if (send_credentials) {
      const loginUrl = `${appUrl}/auth/sign-in`
      const fullName = `${createdUser.first_name} ${createdUser.last_name}`
      this.mailService
        .sendWelcomeWithCredentials(createdUser.email, fullName, plaintextPassword, loginUrl)
        .catch((err) => {
          console.warn(
            `[CreateUser] Failed to send credentials email to ${createdUser.email}:`,
            err,
          )
        })
    } else {
      // 7. Generate email verification token (24h) and send verification email (best-effort)
      const verifyToken = uuidv4()
      const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await this.repository
        .storeVerificationToken(createdUser.id, verifyToken, verifyExpiresAt)
        .catch(() => {})

      const verifyUrl = `${appUrl}/auth/verify-email?token=${verifyToken}`

      this.mailService.sendEmailVerification(command.data.email, verifyUrl).catch((err) => {
        console.warn(
          `[CreateUser] Failed to send verification email to ${command.data.email}:`,
          err,
        )
      })
    }

    // 8. Emit audit event
    this.eventBus.publish(
      new AuditEvent("create-user", "User", createdUser.id, null, {
        email: createdUser.email,
        role_ids: resolvedRoleIds,
      }),
    )

    return result
  }
}
