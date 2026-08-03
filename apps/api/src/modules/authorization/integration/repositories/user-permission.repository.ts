import { Injectable } from "@nestjs/common"
import { Permission, UserPermission } from "@authorization/business/entities"
import { Prisma, Status } from '@database/prisma/generated-client'
import { RepositoryService } from "@shared/integration/services"
import { IUserPermissionRepository } from "@authorization/business/repositories"
import { ErrorCollection, Result, success, failure } from "@shared/business/utils/error-handling"

@Injectable()
export class UserPermissionRepository
  extends RepositoryService<UserPermission>
  implements IUserPermissionRepository
{
  model = Prisma.ModelName.UserPermission
  builder = UserPermission

  async assignPermissionToUser(
    data: UserPermission,
  ): Promise<Result<UserPermission, ErrorCollection>> {
    try {
      const existing = await this.client.userPermission.findUnique({
        where: {
          user_id_permission_id: {
            user_id: data.user_id,
            permission_id: data.permission_id,
          },
        },
      })

      let record
      if (existing) {
        const isActive = existing.status === Status.ACTIVE
        const isNotExpired = !existing.expires_at || existing.expires_at > new Date()
        if (isActive && isNotExpired) {
          return failure({ assignment: ["User already has this permission assigned"] })
        }
        // Reactivate a previously revoked/expired assignment
        record = await this.client.userPermission.update({
          where: { id: existing.id },
          data: {
            status: Status.ACTIVE,
            assigned_by: data.assigned_by,
            assigned_at: new Date(),
            expires_at: data.expires_at ?? null,
            updated_at: new Date(),
          },
        })
      } else {
        record = await this.client.userPermission.create({
          data: {
            id: data.id,
            user_id: data.user_id,
            permission_id: data.permission_id,
            assigned_by: data.assigned_by,
            assigned_at: data.assigned_at || new Date(),
            expires_at: data.expires_at,
            status: data.status,
            created_at: data.created_at,
            updated_at: data.updated_at,
            deleted_at: data.deleted_at,
          },
        })
      }

      const entityResult = UserPermission.instance(record)
      if (!entityResult.isOk) return failure(entityResult.error)
      return success(entityResult.value)
    } catch (error) {
      return failure({ assignment: [error.message || "Failed to assign permission to user"] })
    }
  }

  async revokePermissionFromUser(
    userId: string,
    permissionId: string,
  ): Promise<Result<UserPermission, ErrorCollection>> {
    try {
      const existing = await this.client.userPermission.findUnique({
        where: {
          user_id_permission_id: {
            user_id: userId,
            permission_id: permissionId,
          },
        },
      })

      if (!existing) {
        return failure({ assignment: ["User permission assignment not found"] })
      }

      // Revoke: set INACTIVE only — INACTIVE ≠ DELETED, do not touch deleted_at
      const record = await this.client.userPermission.update({
        where: { id: existing.id },
        data: {
          status: Status.INACTIVE,
          updated_at: new Date(),
        },
      })

      const entityResult = UserPermission.instance(record)
      if (!entityResult.isOk) return failure(entityResult.error)
      return success(entityResult.value)
    } catch (error) {
      return failure({ assignment: [error.message || "Failed to revoke permission from user"] })
    }
  }

  async getUserDirectPermissions(
    userId: string,
  ): Promise<Result<UserPermission[], ErrorCollection>> {
    try {
      const now = new Date()
      const records = await this.client.userPermission.findMany({
        where: {
          user_id: userId,
          status: Status.ACTIVE,
          OR: [{ expires_at: null }, { expires_at: { gt: now } }],
        },
      })

      const entities: UserPermission[] = []
      for (const record of records) {
        const entityResult = UserPermission.instance(record)
        if (!entityResult.isOk) return failure(entityResult.error)
        entities.push(entityResult.value)
      }

      return success(entities)
    } catch (error) {
      return failure({ query: [error.message || "Failed to get user direct permissions"] })
    }
  }

  async getUserDirectPermissionEntities(userId: string): Promise<Result<Permission[], ErrorCollection>> {
    try {
      const now = new Date()
      const records = await this.client.userPermission.findMany({
        where: {
          user_id: userId,
          status: Status.ACTIVE,
          OR: [{ expires_at: null }, { expires_at: { gt: now } }],
        },
        include: { permission: true },
      })

      const permissionsMap = new Map<string, Permission>()
      for (const up of records) {
        if (up.permission.status === Status.ACTIVE && !permissionsMap.has(up.permission.id)) {
          const result = Permission.instance(up.permission)
          if (result.isOk) permissionsMap.set(up.permission.id, result.value)
        }
      }

      return success(Array.from(permissionsMap.values()))
    } catch (error) {
      return failure({ query: [error.message || "Failed to get user direct permission entities"] })
    }
  }

  override async delete<TypeError = any>(id: string): Promise<Result<true, TypeError>> {
    await this.client.userPermission.update({
      where: { id },
      data: {
        status: Status.DELETED,
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    })
    return success(true)
  }
}
