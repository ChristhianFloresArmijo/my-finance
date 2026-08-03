import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { PrismaClient } from "@database/prisma/generated-client"
import { ConfigService } from "@nestjs/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

//Create
//function to give us a prismaClient with extensions we want
export const customPrismaClient = (prismaClient: PrismaClient) => {
  return prismaClient
  // .$extends(softDelete) //here we add our created extensions
  // .$extends(softDeleteMany)
  // .$extends(filterSoftDeleted);
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  customPrismaClient: CustomPrismaClient
  private pool: Pool

  constructor(private readonly configService: ConfigService) {
    const connectionString = configService.get<string>("DATABASE_URL")
    
    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured")
    }
    
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)

    super({ adapter })
    this.pool = pool
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
    await this.pool.end()
  }

  get client() {
    if (!this.customPrismaClient) this.customPrismaClient = customPrismaClient(this)

    return this.customPrismaClient
  }
}

//Create a type to our funtion
export type CustomPrismaClient = ReturnType<typeof customPrismaClient>
