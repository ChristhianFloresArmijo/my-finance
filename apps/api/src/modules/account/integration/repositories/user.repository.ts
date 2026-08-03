import { Injectable } from "@nestjs/common"
import { User } from "@account/business/entities/user.entity"
import { Prisma, Status } from "@database/prisma/generated-client"
import { RepositoryService } from "@shared/integration/services"
import { ErrorCollection, Result, success, failure } from "@shared/business/utils/error-handling"
import { IUserRepository } from "@account/business/repositories"
import { CurrentUserDto } from "@auth/presentation/dtos"

@Injectable()
export class UserRepository extends RepositoryService<User> implements IUserRepository {
  model = Prisma.ModelName.User
  builder = User

  async findByEmail(email: string): Promise<Result<User | null, ErrorCollection>> {
    try {
      const userResult = await this.client.user.findUnique({ where: { email } })
      if (!userResult) return success(null)
      return this.builder.instance(userResult)
    } catch (error) {
      return failure({ error })
    }
  }

  async findCurrent<TypeError = any>(
    id: string,
  ): Promise<Result<CurrentUserDto | null, TypeError>> {
    try {
      const now = new Date()
      const user = await this.client.user.findUnique({
        where: { id },
        include: {
          profile: true,
          preferences: true,
          user_roles: {
            where: {
              status: Status.ACTIVE,
              OR: [{ expires_at: null }, { expires_at: { gt: now } }],
            },
            include: {
              role: {
                include: {
                  role_permissions: {
                    where: { status: Status.ACTIVE },
                    include: { permission: true },
                  },
                },
              },
            },
          },
          direct_permissions: {
            where: {
              status: Status.ACTIVE,
              OR: [{ expires_at: null }, { expires_at: { gt: now } }],
            },
            include: { permission: true },
          },
        },
      })

      if (!user) return success(null) as unknown as Result<CurrentUserDto | null, TypeError>

      // Deduplicate permissions: role permissions + direct permissions
      const permissionsMap = new Map<string, CurrentUserDto["permissions"][number]>()

      for (const ur of user.user_roles) {
        for (const rp of ur.role.role_permissions) {
          if (rp.permission.status === Status.ACTIVE && !permissionsMap.has(rp.permission.id)) {
            permissionsMap.set(rp.permission.id, {
              id: rp.permission.id,
              resource: rp.permission.resource,
              action: rp.permission.action,
              scope: rp.permission.scope,
              description: rp.permission.description,
            })
          }
        }
      }

      for (const dp of user.direct_permissions) {
        if (dp.permission.status === Status.ACTIVE && !permissionsMap.has(dp.permission.id)) {
          permissionsMap.set(dp.permission.id, {
            id: dp.permission.id,
            resource: dp.permission.resource,
            action: dp.permission.action,
            scope: dp.permission.scope,
            description: dp.permission.description,
          })
        }
      }

      const dto: CurrentUserDto = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        status: user.status,
        created_at: user.created_at,
        roles: user.user_roles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          display_name: ur.role.display_name,
        })),
        permissions: Array.from(permissionsMap.values()),
        profile: user.profile
          ? {
              avatar: user.profile.avatar,
              phone: user.profile.phone,
              address_line_1: user.profile.address_line_1,
              address_line_2: user.profile.address_line_2,
              city: user.profile.city,
              state: user.profile.state,
              postal_code: user.profile.postal_code,
              country: user.profile.country,
            }
          : null,
        preferences: user.preferences
          ? {
              theme: user.preferences.theme,
              language: user.preferences.language,
              timezone: user.preferences.timezone,
              notify_email: user.preferences.notify_email,
              notify_push: user.preferences.notify_push,
              notify_sms: user.preferences.notify_sms,
            }
          : null,
      }

      return success(dto) as unknown as Result<CurrentUserDto | null, TypeError>
    } catch (error) {
      return failure({ error }) as unknown as Result<CurrentUserDto | null, TypeError>
    }
  }

  async updateIdentity(
    userId: string,
    data: Partial<Pick<User, "first_name" | "last_name" | "email">>,
  ): Promise<Result<User, ErrorCollection>> {
    try {
      await this.client.user.update({ where: { id: userId }, data })
      return this.findById(userId) as Promise<Result<User, ErrorCollection>>
    } catch (error) {
      return failure({ error })
    }
  }

  async storeVerificationToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<Result<true, ErrorCollection>> {
    try {
      await this.client.user.update({
        where: { id: userId },
        data: { password_reset_token: token, password_reset_expires_at: expiresAt },
      })
      return success(true)
    } catch (error) {
      return failure({ error })
    }
  }

  async updateStatus(
    userId: string,
    status: "ACTIVE" | "SUSPENDED",
  ): Promise<Result<true, ErrorCollection>> {
    try {
      await this.client.user.update({ where: { id: userId }, data: { status } })
      return success(true)
    } catch (error) {
      return failure({ error })
    }
  }
}
