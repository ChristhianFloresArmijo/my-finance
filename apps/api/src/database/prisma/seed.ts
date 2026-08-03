import { PrismaClient } from "@database/prisma/generated-client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { seedRbac, seedUsers } from "./seeds"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    console.log("🚀 Starting database seeding...")

    // Run RBAC seed first (roles and permissions)
    await seedRbac()

    // Run Users seed (creates admin user and assigns roles)
    await seedUsers()

    console.log("✅ All seeds completed successfully!")
  } catch (error) {
    console.error("❌ Seeding failed:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
