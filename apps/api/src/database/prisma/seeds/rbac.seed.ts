import { PrismaClient } from '@database/prisma/generated-client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export async function seedRbac() {
  console.log("🌱 Starting RBAC seed...")

  const permissions = await createPermissions()
  console.log(`✅ Created ${permissions.length} permissions`)

  const roles = await createRoles()
  console.log(`✅ Created ${roles.length} roles`)

  await assignPermissionsToRoles(roles, permissions)
  console.log("✅ Assigned permissions to roles")

  console.log("🎉 RBAC seed completed successfully!")
}

// ---------------------------------------------------------------------------
// PERMISSIONS
// ---------------------------------------------------------------------------
//
// Structure: { resource, action, scope }
//
// Scopes:
//   ALL  — applies to any record in the system
//   OWN  — restricted to the requesting user's own records
//   TEAM — restricted to the user's team (future use)
//   ORG  — restricted to the user's organisation (future use)
//
// Resources:
//   user      — user accounts
//   role      — RBAC roles
//   system    — server-level operations (backup, configure, monitor, logs)
//               ⚠️  Only SuperAdmin should have these. Giving an Admin system
//                   access risks accidental misconfigurations or outages.
//   auth      — session / token management
//               ⚠️  Only SuperAdmin. Admins must NOT be able to manage tokens
//                   because it would let them extend their own sessions, revoke
//                   others', or silently impersonate users — a privilege
//                   escalation risk even when unintentional.
//   dashboard — general dashboard view
//   reports   — analytics / reporting
// ---------------------------------------------------------------------------

async function createPermissions() {
  const permissionsData = [
    // ── User management ────────────────────────────────────────────────────
    { resource: "user", action: "create", scope: "ALL", description: "Create new user accounts" },
    { resource: "user", action: "read",   scope: "ALL", description: "View any user's information" },
    { resource: "user", action: "update", scope: "ALL", description: "Update any user's information" },
    { resource: "user", action: "delete", scope: "ALL", description: "Delete any user account" },
    { resource: "user", action: "list",   scope: "ALL", description: "List all user accounts" },
    { resource: "user", action: "read",   scope: "OWN", description: "View own profile" },
    { resource: "user", action: "update", scope: "OWN", description: "Update own profile" },

    // ── Role management ────────────────────────────────────────────────────
    { resource: "role", action: "create", scope: "ALL", description: "Create new roles" },
    { resource: "role", action: "read",   scope: "ALL", description: "View role information" },
    { resource: "role", action: "update", scope: "ALL", description: "Update role information" },
    { resource: "role", action: "delete", scope: "ALL", description: "Delete roles (non-system only)" },
    { resource: "role", action: "assign", scope: "ALL", description: "Assign roles to users" },
    { resource: "role", action: "revoke", scope: "ALL", description: "Revoke roles from users" },

    // ── System / infrastructure ────────────────────────────────────────────
    // ⚠️  SuperAdmin only — do not grant to Admin or below
    { resource: "system", action: "backup",    scope: "ALL", description: "Trigger and manage database backups" },
    { resource: "system", action: "configure", scope: "ALL", description: "Modify system-level configuration" },
    { resource: "system", action: "monitor",   scope: "ALL", description: "View system health and performance metrics" },
    { resource: "system", action: "logs",      scope: "ALL", description: "Access application and server logs" },

    // ── Authentication / token management ──────────────────────────────────
    // ⚠️  SuperAdmin only — granting this to Admin would allow session hijacking
    //     and unaudited privilege escalation
    { resource: "auth", action: "manage", scope: "ALL", description: "Manage authentication configuration" },
    { resource: "auth", action: "tokens", scope: "ALL", description: "View and revoke any user's active sessions" },

    // ── Dashboard ──────────────────────────────────────────────────────────
    { resource: "dashboard", action: "view", scope: "ALL", description: "Access the main dashboard" },

    // ── Reports ───────────────────────────────────────────────────────────
    { resource: "reports", action: "view",   scope: "ALL", description: "View analytics reports" },
    { resource: "reports", action: "export", scope: "ALL", description: "Export reports to CSV / PDF" },

    // ── Portal access (gates which login portal a user may use) ────────────
    //
    // admin:access  — required to enter the admin panel at /admin
    // client:access — required to enter the client app at /
    //
    // A superadmin has both. A regular admin has only admin:access.
    // A client user has only client:access. Staff have admin:access so they can
    // reach admin pages they are assigned, but no client:access.
    { resource: "admin",  action: "access", scope: "ALL", description: "Access the admin portal" },
    { resource: "client", action: "access", scope: "ALL", description: "Access the client portal" },

    // ── Admin section-level gating (nav / route visibility) ───────────────
    //
    // Grant admin:<section> to allow a role to see and navigate that section.
    // Backend endpoints enforce finer-grained CRUD; these control UI visibility.
    { resource: "admin", action: "users",       scope: "ALL", description: "Access the Users section in the admin panel" },
    { resource: "admin", action: "roles",       scope: "ALL", description: "Access the Roles section in the admin panel" },
    { resource: "admin", action: "permissions", scope: "ALL", description: "Access the Permissions section in the admin panel" },
    { resource: "admin", action: "audit",       scope: "ALL", description: "Access the Audit log section in the admin panel" },
  ]

  const permissions = []
  for (const permData of permissionsData) {
    const permission = await prisma.permission.upsert({
      where: {
        resource_action_scope: {
          resource: permData.resource,
          action: permData.action,
          scope: permData.scope as any,
        },
      },
      update: {},
      create: { ...permData, scope: permData.scope as any, is_system: true },
    })
    permissions.push(permission)
  }

  return permissions
}

// ---------------------------------------------------------------------------
// ROLES
// ---------------------------------------------------------------------------
//
// Hierarchy (highest → lowest):
//
//   superadmin
//     Full technical + business control. Intended for system owners / DevOps.
//     Should have at most 1–2 accounts in production.
//
//   admin
//     Business administration: user CRUD, role management, reports.
//     Explicitly excluded: system.* and auth.* (see permission comments above).
//
//   staff
//     Operational / support team. Can view and update users but cannot create,
//     delete, or restructure access control (no role assign/revoke).
//     Read-only access to reports and dashboard.
//
//   client
//     End users. Restricted to their own data (OWN scope) and the dashboard.
// ---------------------------------------------------------------------------

async function createRoles() {
  const rolesData = [
    {
      name: "superadmin",
      display_name: "Super Administrator",
      description:
        "Full system access including infrastructure and auth management. Reserved for system owners.",
      is_system: true,
    },
    {
      name: "admin",
      display_name: "Administrator",
      description:
        "Business administration — manages users, roles, and reports. No infrastructure or auth-token access.",
      is_system: true,
    },
    {
      name: "staff",
      display_name: "Staff Member",
      description:
        "Operational access — can view and update users, read roles, view dashboard and reports.",
      is_system: true,
    },
    {
      name: "client",
      display_name: "Client",
      description: "Standard user — restricted to their own profile and the dashboard.",
      is_system: true,
    },
  ]

  const roles = []
  for (const roleData of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    })
    roles.push(role)
  }

  return roles
}

// ---------------------------------------------------------------------------
// ROLE → PERMISSION ASSIGNMENTS
// ---------------------------------------------------------------------------

async function assignPermissionsToRoles(roles: any[], permissions: any[]) {
  const role   = (name: string)                    => roles.find((r) => r.name === name)
  const perms  = (filter: (p: any) => boolean)     => permissions.filter(filter)
  const assign = async (roleId: string, subset: any[]) => {
    for (const p of subset) {
      await prisma.rolePermission.upsert({
        where: { role_id_permission_id: { role_id: roleId, permission_id: p.id } },
        update: {},
        create: { role_id: roleId, permission_id: p.id },
      })
    }
  }

  // ── SUPERADMIN: everything ──────────────────────────────────────────────
  await assign(role("superadmin").id, permissions)

  // ── ADMIN: business admin, no system.* / auth.* / client portal ─────────
  // Admins operate the admin portal exclusively — they do not have client:access.
  await assign(
    role("admin").id,
    perms((p) =>
      p.resource !== "system" &&
      p.resource !== "auth" &&
      !(p.resource === "client" && p.action === "access"),
    ),
  )

  // ── STAFF: admin portal + users section, limited resource permissions ────
  // Explicitly cannot: create/delete users, assign/revoke roles, export reports.
  // Staff can reach the admin panel (admin:access) and the Users section only.
  await assign(
    role("staff").id,
    perms(
      (p) =>
        // Portal + section access
        (p.resource === "admin" && p.action === "access") ||
        (p.resource === "admin" && p.action === "users") ||
        // User management
        (p.resource === "user"      && ["read", "update", "list"].includes(p.action)) ||
        (p.resource === "role"      && p.action === "read") ||
        (p.resource === "dashboard" && p.action === "view") ||
        (p.resource === "reports"   && p.action === "view"),
    ),
  )

  // ── CLIENT: client portal + own data + dashboard ─────────────────────────
  await assign(
    role("client").id,
    perms(
      (p) =>
        (p.resource === "client" && p.action === "access") ||
        p.scope === "OWN" ||
        (p.resource === "dashboard" && p.action === "view"),
    ),
  )
}

// If running this file directly
if (require.main === module) {
  seedRbac()
    .catch((e) => {
      console.error("❌ RBAC Seed failed:", e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
