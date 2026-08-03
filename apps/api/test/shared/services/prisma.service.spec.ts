import { Test, TestingModule } from "@nestjs/testing"
import { ConfigService } from "@nestjs/config"
import { PrismaService } from "@shared/integration/services/prisma.service"

/**
 * PrismaService Tests
 *
 * Tests for the PrismaService which manages the database connection lifecycle.
 */

describe("PrismaService", () => {
  let service: PrismaService
  let module: TestingModule

  beforeEach(async () => {
    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn().mockReturnValue("postgresql://test:test@localhost:5432/test"),
    }

    module = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<PrismaService>(PrismaService)
  })

  afterEach(async () => {
    await service.$disconnect()
    await module.close()
  })

  describe("initialization", () => {
    it("should be defined", () => {
      // Assert
      expect(service).toBeDefined()
      expect(service).toBeInstanceOf(PrismaService)
    })

    it("should extend PrismaClient", () => {
      // Assert
      expect(service.$connect).toBeDefined()
      expect(service.$disconnect).toBeDefined()
      expect(service.$transaction).toBeDefined()
    })

    it("should have all model accessors", () => {
      // Assert
      expect(service.user).toBeDefined()
      expect(service.role).toBeDefined()
      expect(service.permission).toBeDefined()
      expect(service.refreshToken).toBeDefined()
      expect(service.userRole).toBeDefined()
      expect(service.rolePermission).toBeDefined()
    })

    it("should have custom client getter", () => {
      // Act
      const client = service.client

      // Assert
      expect(client).toBeDefined()
    })
  })

  describe("lifecycle hooks", () => {
    it("should implement OnModuleInit", () => {
      // Assert
      expect(service.onModuleInit).toBeDefined()
      expect(typeof service.onModuleInit).toBe("function")
    })

    it("should implement OnModuleDestroy", () => {
      // Assert
      expect(service.onModuleDestroy).toBeDefined()
      expect(typeof service.onModuleDestroy).toBe("function")
    })

    it("should connect on module init", async () => {
      // Arrange
      const connectSpy = jest.spyOn(service, "$connect")

      // Act
      await service.onModuleInit()

      // Assert
      expect(connectSpy).toHaveBeenCalled()
    })

    it("should disconnect on module destroy", async () => {
      // Arrange
      const disconnectSpy = jest.spyOn(service, "$disconnect")

      // Act
      await service.onModuleDestroy()

      // Assert
      expect(disconnectSpy).toHaveBeenCalled()
    })
  })

  describe("database operations", () => {
    it("should execute raw queries", async () => {
      // Act & Assert
      await expect(service.$queryRaw`SELECT 1 as test`).resolves.toBeDefined()
    })

    it("should support transactions", async () => {
      // Arrange
      const operations = jest.fn().mockResolvedValue("result")

      // Act
      const result = await service.$transaction(operations as any)

      // Assert
      expect(result).toBe("result")
      expect(operations).toHaveBeenCalled()
    })
  })
})
