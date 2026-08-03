import { PrismaClient } from "@database/prisma/generated-client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { Encript } from "../../../modules/shared/business/value-object/encript.vo"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Read only what the seed actually needs — no app config, no JWT validation
const rootAdminEmail     = process.env.ROOT_ADMIN_EMAIL      ?? "admin@admin.com"
const rootAdminPassword  = process.env.ROOT_ADMIN_PASSWORD   ?? "DevAdmin123!"
const rootAdminFirstName = process.env.ROOT_ADMIN_FIRST_NAME ?? "Root"
const rootAdminLastName  = process.env.ROOT_ADMIN_LAST_NAME  ?? "Administrator"

export async function seedUsers() {
  console.log("👥 Starting Users seed...")

  const adminUser = await createRootAdminUser()
  console.log(`✅ Created root admin user: ${adminUser.email}`)

  await assignSuperAdminRole(adminUser.id)
  console.log("✅ Assigned superadmin role to root admin user")

  console.log("🎉 Users seed completed successfully!")
}

async function createRootAdminUser() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: rootAdminEmail },
  })

  if (existingAdmin) {
    console.log("ℹ️  Root admin user already exists, skipping creation")
    return existingAdmin
  }

  if (rootAdminPassword.length < 8) {
    throw new Error("Root admin password must be at least 8 characters long")
  }

  const hashedPassword = Encript.create(rootAdminPassword, "sha256").value

  const adminUser = await prisma.user.create({
    data: {
      first_name: rootAdminFirstName,
      last_name:  rootAdminLastName,
      email:      rootAdminEmail,
      password:   hashedPassword,
      status:     "ACTIVE",
    },
  })

  console.log(`   Name:  ${rootAdminFirstName} ${rootAdminLastName}`)
  console.log(`   Email: ${rootAdminEmail}`)

  return adminUser
}

async function assignSuperAdminRole(userId: string) {
  const superAdminRole = await prisma.role.findUnique({ where: { name: "superadmin" } })

  if (!superAdminRole) {
    throw new Error("superadmin role not found — run the RBAC seed first.")
  }

  const existing = await prisma.userRole.findUnique({
    where: { user_id_role_id: { user_id: userId, role_id: superAdminRole.id } },
  })

  if (existing) {
    console.log("ℹ️  superadmin role already assigned")
    return existing
  }

  return prisma.userRole.create({
    data: {
      user_id:     userId,
      role_id:     superAdminRole.id,
      assigned_by: userId,
    },
  })
}

// If running this file directly
if (require.main === module) {
  seedUsers()
    .catch((e) => {
      console.error("❌ Users Seed failed:", e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
