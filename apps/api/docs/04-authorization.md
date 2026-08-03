# Authorization — Backend

## Model

RBAC is implemented with three core tables:

```
Role                  # named roles (admin, superadmin, client, …)
Permission            # resource:action:scope tuples
RolePermission        # many-to-many: which permissions a role has
UserRole              # many-to-many: which roles a user has
UserPermission        # direct per-user permissions (bypass role)
```

A permission has three fields:

| Field | Example values |
|---|---|
| `resource` | `user`, `role`, `permission`, `system`, `report` |
| `action` | `create`, `read`, `update`, `delete`, `manage` |
| `scope` | `ALL` (default), `OWN`, `TEAM`, `ORG` |

The composite `(resource, action, scope)` is unique.

---

## Guards

```typescript
// Require user to have the named role
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRole('superadmin')

// Require user to have the named permission
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('user:create')
```

Guards resolve permissions by loading the user's roles + direct permissions through `AuthorizationService`.

---

## `AuthorizationService`

Lives in `authorization/business/services/`. Provides:

```typescript
// Returns all permissions for a user (role permissions + direct permissions)
await authorizationService.getUserPermissions(userId)

// Checks whether a user has a specific role
await authorizationService.userHasRole(userId, roleName)

// Checks whether a user has a specific permission
await authorizationService.userHasPermission(userId, resource, action, scope?)
```

---

## Admin Endpoints

All admin role/permission management requires `superadmin` role:

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/roles` | List all roles |
| POST | `/api/admin/roles` | Create role |
| PATCH | `/api/admin/roles/:id` | Update role |
| DELETE | `/api/admin/roles/:id` | Delete role (not system roles) |
| GET | `/api/admin/permissions` | List all permissions |
| POST | `/api/admin/permissions` | Create permission |
| DELETE | `/api/admin/permissions/:id` | Delete permission |
| POST | `/api/admin/roles/:id/permissions` | Assign permission to role |
| DELETE | `/api/admin/roles/:id/permissions/:pid` | Remove permission from role |
| POST | `/api/admin/users/:id/roles` | Assign role to user |
| DELETE | `/api/admin/users/:id/roles/:rid` | Revoke role from user |

---

## System Roles and Permissions

Roles and permissions with `is_system: true` cannot be deleted — only deactivated. The seed script marks `superadmin`, `admin`, and core system permissions as `is_system: true`.

---

## Adding a New Permission

1. Add to the Prisma seed or create via the admin API:
   ```
   resource: "report"
   action: "export"
   scope: "ALL"
   ```
2. Assign to the appropriate role via `/api/admin/roles/:id/permissions`
3. Guard the endpoint:
   ```typescript
   @UseGuards(JwtAuthGuard, PermissionsGuard)
   @RequirePermission('report:export')
   ```

---

## `forwardRef()` and Circular Deps

`AuthorizationModule` is imported by both `AccountModule` and `AuthenticationModule`. All three use `forwardRef()` to avoid circular import errors:

```typescript
imports: [
  forwardRef(() => AuthenticationModule),
  forwardRef(() => AccountModule),
]
```
