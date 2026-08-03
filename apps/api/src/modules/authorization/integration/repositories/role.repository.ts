import { Injectable } from "@nestjs/common"
import { Permission, Role, RolePermission, UserRole } from "@authorization/business/entities"
import { Prisma, Status } from '@database/prisma/generated-client'
import { RepositoryService } from "@shared/integration/services"
import { IRoleRepository } from "@authorization/business/repositories"
import { ErrorCollection, Result, success, failure } from "@shared/business/utils/error-handling"

@Injectable()
export class RoleRepository extends RepositoryService<Role> implements IRoleRepository {
  model = Prisma.ModelName.Role
  builder = Role

  async assignRoleToUser(data: UserRole): Promise<Result<UserRole, ErrorCollection>> {
    try {
      // Check if role assignment already exists
      const existingAssignment = await this.client.userRole.findUnique({
        where: {
          user_id_role_id: {
            user_id: data.user_id,
            role_id: data.role_id,
          },
        },
      })

      let userRole
      if (existingAssignment) {
        // Block if the assignment is already active and not expired
        const isActive = existingAssignment.status === Status.ACTIVE
        const isNotExpired = !existingAssignment.expires_at || existingAssignment.expires_at > new Date()
        if (isActive && isNotExpired) {
          return failure({ assignment: ["User already has this role assigned"] })
        }
        // Reactivate a previously revoked/expired assignment
        userRole = await this.client.userRole.update({
          where: { id: existingAssignment.id },
          data: {
            status: Status.ACTIVE,
            assigned_by: data.assigned_by,
            assigned_at: new Date(),
            expires_at: data.expires_at ?? null,
            updated_at: new Date(),
          },
        })
      } else {
        // Create new role assignment
        userRole = await this.client.userRole.create({
          data: {
            id: data.id,
            user_id: data.user_id,
            role_id: data.role_id,
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

      const entityResult = UserRole.instance(userRole)
      if (!entityResult.isOk) {
        return failure(entityResult.error)
      }

      return success(entityResult.value)
    } catch (error) {
      return failure({ assignment: [error.message || "Failed to assign role to user"] })
    }
  }

  async revokeRoleFromUser(data: UserRole): Promise<Result<UserRole, ErrorCollection>> {
    try {
      // Find existing role assignment
      const existingAssignment = await this.client.userRole.findUnique({
        where: {
          user_id_role_id: {
            user_id: data.user_id,
            role_id: data.role_id,
          },
        },
      })

      if (!existingAssignment) {
        return failure({ assignment: ["User role assignment not found"] })
      }

      // Revoke: set INACTIVE only — INACTIVE ≠ DELETED, do not touch deleted_at
      const userRole = await this.client.userRole.update({
        where: {
          id: existingAssignment.id,
        },
        data: {
          status: Status.INACTIVE,
          updated_at: new Date(),
        },
      })

      const entityResult = UserRole.instance(userRole)
      if (!entityResult.isOk) {
        return failure(entityResult.error)
      }

      return success(entityResult.value)
    } catch (error) {
      return failure({ assignment: [error.message || "Failed to revoke role from user"] })
    }
  }

  async getUserRoles(userId: string): Promise<Result<UserRole[], ErrorCollection>> {
    try {
      const now = new Date()
      const userRoles = await this.client.userRole.findMany({
        where: {
          user_id: userId,
          status: Status.ACTIVE,
          OR: [{ expires_at: null }, { expires_at: { gt: now } }],
        },
        include: {
          role: true,
        },
      })

      const userRoleEntities: UserRole[] = []

      for (const userRole of userRoles) {
        const entityResult = UserRole.instance(userRole)
        if (!entityResult.isOk) {
          return failure(entityResult.error)
        }
        userRoleEntities.push(entityResult.value)
      }

      return success(userRoleEntities)
    } catch (error) {
      return failure({ query: [error.message || "Failed to get user roles"] })
    }
  }

  async getRolePermissions(roleId: string): Promise<Result<RolePermission[], ErrorCollection>> {
    try {
      const rolePermissions = await this.client.rolePermission.findMany({
        where: {
          role_id: roleId,
          status: Status.ACTIVE,
        },
        include: {
          permission: true,
        },
      })

      const rolePermissionEntities: RolePermission[] = []

      for (const rolePermission of rolePermissions) {
        const entityResult = RolePermission.instance(rolePermission)
        if (!entityResult.isOk) {
          return failure(entityResult.error)
        }
        rolePermissionEntities.push(entityResult.value)
      }

      return success(rolePermissionEntities)
    } catch (error) {
      return failure({ query: [error.message || "Failed to get role permissions"] })
    }
  }

  async assignPermissionToRole(
    data: RolePermission,
  ): Promise<Result<RolePermission, ErrorCollection>> {
    try {
      // Check if permission assignment already exists
      const existingAssignment = await this.client.rolePermission.findUnique({
        where: {
          role_id_permission_id: {
            role_id: data.role_id,
            permission_id: data.permission_id,
          },
        },
      })

      if (existingAssignment) {
        return failure({
          assignment: ["Role already has this permission assigned"],
        })
      }

      // Create new permission assignment
      const rolePermissionData = {
        id: data.id,
        role_id: data.role_id,
        permission_id: data.permission_id,
        status: data.status || Status.ACTIVE,
        created_at: data.created_at,
        updated_at: data.updated_at,
        deleted_at: data.deleted_at,
      }

      const rolePermission = await this.client.rolePermission.create({
        data: rolePermissionData,
      })

      const entityResult = RolePermission.instance(rolePermission)
      if (!entityResult.isOk) {
        return failure(entityResult.error)
      }

      return success(entityResult.value)
    } catch (error) {
      return failure({
        assignment: [error.message || "Failed to assign permission to role"],
      })
    }
  }

  async getRoleUsers(roleId: string): Promise<Result<UserRole[], ErrorCollection>> {
    try {
      const userRoles = await this.client.userRole.findMany({
        where: {
          role_id: roleId,
          status: Status.ACTIVE,
        },
      })

      const userRoleEntities: UserRole[] = []
      for (const userRole of userRoles) {
        const entityResult = UserRole.instance(userRole)
        if (!entityResult.isOk) {
          return failure(entityResult.error)
        }
        userRoleEntities.push(entityResult.value)
      }

      return success(userRoleEntities)
    } catch (error) {
      return failure({ query: [error.message || "Failed to get role users"] })
    }
  }

  async getUserPermissionsViaRoles(userId: string): Promise<Result<Permission[], ErrorCollection>> {
    try {
      const now = new Date()
      const userRoles = await this.client.userRole.findMany({
        where: {
          user_id: userId,
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
      })

      const permissionsMap = new Map<string, Permission>()
      for (const ur of userRoles) {
        for (const rp of ur.role.role_permissions) {
          if (rp.permission.status === Status.ACTIVE && !permissionsMap.has(rp.permission.id)) {
            const result = Permission.instance(rp.permission)
            if (result.isOk) permissionsMap.set(rp.permission.id, result.value)
          }
        }
      }

      return success(Array.from(permissionsMap.values()))
    } catch (error) {
      return failure({ query: [error.message || "Failed to get user permissions via roles"] })
    }
  }

  override async delete<TypeError = any>(id: string): Promise<Result<true, TypeError>> {
    await this.client.role.update({
      where: { id },
      data: {
        status: Status.DELETED,
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    })
    return success(true)
  }

  async revokePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<Result<RolePermission, ErrorCollection>> {
    try {
      // Find existing permission assignment
      const existingAssignment = await this.client.rolePermission.findUnique({
        where: {
          role_id_permission_id: {
            role_id: roleId,
            permission_id: permissionId,
          },
        },
      })

      if (!existingAssignment) {
        return failure({
          assignment: ["Role permission assignment not found"],
        })
      }

      // Revoke: set INACTIVE only — INACTIVE ≠ DELETED, do not touch deleted_at
      const rolePermission = await this.client.rolePermission.update({
        where: {
          id: existingAssignment.id,
        },
        data: {
          status: Status.INACTIVE,
          updated_at: new Date(),
        },
      })

      const entityResult = RolePermission.instance(rolePermission)
      if (!entityResult.isOk) {
        return failure(entityResult.error)
      }

      return success(entityResult.value)
    } catch (error) {
      return failure({
        assignment: [error.message || "Failed to revoke permission from role"],
      })
    }
  }

  async findByName(name: string): Promise<Result<Role | null, ErrorCollection>> {
    try {
      const role = await this.client.role.findFirst({
        where: { name, status: Status.ACTIVE },
      })
      if (!role) return success(null)
      return this.builder.instance(role)
    } catch (error) {
      return failure({ role: [error.message || 'Failed to find role by name'] })
    }
  }
}
