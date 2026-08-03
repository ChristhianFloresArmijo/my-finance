# Authorization — Frontend

The frontend authorization layer is backend-agnostic. Roles and permissions are loaded into the `authorizationStore` after sign-in via `/auth/me` (or equivalent). The store, directive, and route guard work regardless of which backend issued the data.

---

## Store

`authorizationStore` is populated by `checkAuth()` after every successful authentication.

```typescript
import { useAuthorizationStore } from '@/modules/authorization/integration/stores'

const store = useAuthorizationStore()

store.roles        // Role[]
store.permissions  // Permission[]

store.hasAnyRole(['admin', 'superadmin'])  // true if user has at least one of the listed roles
store.hasPermission('user:create')         // true if the permission is in the user's list

store.setData({ roles, permissions })      // called internally by checkAuth()
store.clear()                              // called internally by signOut()
```

---

## `v-can` Directive

Registered globally at app startup from `authorization/presentation/directives`. Removes the element from the DOM if the user lacks the required permission:

```html
<!-- visible only if user has 'user:delete' permission -->
<button v-can="'user:delete'">Delete user</button>

<!-- visible only if user has 'role:assign' permission -->
<li v-can="'role:assign'">Manage roles</li>
```

For role-based visibility, use the store directly:

```html
<div v-if="authorizationStore.hasAnyRole(['admin', 'superadmin'])">
  Admin panel
</div>
```

---

## Route Guard

```typescript
// src/router/index.ts
router.beforeEach(async (to) => {
  if (to.meta.requiresRole) {
    if (!authorizationStore.hasAnyRole(to.meta.requiresRole)) {
      return '/'  // redirect to home if role missing
    }
  }
})
```

Route meta:

```typescript
{
  path: '/admin/users',
  component: UsersListView,
  meta: {
    requiresAuth: true,
    requiresRole: ['admin', 'superadmin'],
  },
}
```

---

## Admin Composables

These composables drive the admin panel and call through the repository layer — never raw axios:

| Composable | Responsibility |
|---|---|
| `useAdminUsers` | User CRUD, status toggle, 2FA admin actions, session management |
| `useAdminRoles` | Role CRUD, permission assignment to roles |
| `useAdminPermissions` | Permission CRUD |
| `useAdminMeta` | Enum labels, dashboard stats |

```typescript
// Example: load and manage users
const { users, loadUsers, createUser, updateUser, deleteUser, toggleStatus } = useAdminUsers()

onMounted(() => loadUsers())
```

---

## Permission Format

The frontend treats permissions as opaque strings — it does not parse or validate the `resource:action` format itself. That validation happens on the backend. The frontend only checks string equality:

```typescript
store.hasPermission('user:create')   // exact string match against permissions[]
```

This means the format is whatever your backend defines. When switching backends, update the permissions seeded in the new backend to match the strings your frontend checks.

---

## Adding Permission Checks to a New Feature

1. Define the permission string in your backend (e.g. `report:export`)
2. Assign it to the appropriate role(s)
3. In the frontend, guard the UI element:

```html
<button v-can="'report:export'" @click="exportReport">Export</button>
```

And guard the route:

```typescript
{
  path: '/reports',
  meta: { requiresAuth: true, requiresRole: ['admin'] }
}
```
