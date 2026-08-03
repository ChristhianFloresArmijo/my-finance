import { Test, TestingModule } from "@nestjs/testing"
import { RepositoryService } from "@shared/integration/services/repository.service"
import { PrismaService } from "@shared/integration/services/prisma.service"
import { ConfigService } from "@nestjs/config"

/**
 * RepositoryService Tests
 *
 * Tests for the base RepositoryService which provides common database operations.
 */

// Mock entity type for testing
interface MockEntity {
  id: string
  name: string
}

describe("RepositoryService", () => {
  let service: RepositoryService<MockEntity>
  let prismaService: PrismaService
  let module: TestingModule

  beforeEach(async () => {
    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn().mockReturnValue("postgresql://test:test@localhost:5432/test"),
    }

    module = await Test.createTestingModule({
      providers: [
        RepositoryService,
        PrismaService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<RepositoryService<MockEntity>>(RepositoryService)
    prismaService = module.get<PrismaService>(PrismaService)
  })

  afterEach(async () => {
    await prismaService.$disconnect()
    await module.close()
  })

  describe("initialization", () => {
    it("should be defined", () => {
      // Assert
      expect(service).toBeDefined()
      expect(service).toBeInstanceOf(RepositoryService)
    })

    it("should have access to PrismaService client", () => {
      // Assert
      expect(service.client).toBeDefined()
      expect(service.client).toBeInstanceOf(PrismaService)
    })
  })

  describe("model accessors", () => {
    it("should provide access to user model", () => {
      // Act
      const userModel = service.user

      // Assert
      expect(userModel).toBeDefined()
    })

    it("should provide access to refreshToken model", () => {
      // Act
      const refreshTokenModel = service.refreshToken

      // Assert
      expect(refreshTokenModel).toBeDefined()
    })
  })

  describe("base repository functionality", () => {
    it("should provide access to Prisma client", () => {
      // Act
      const client = service.client

      // Assert
      expect(client).toBeDefined()
      expect(client.$connect).toBeDefined()
      expect(client.$disconnect).toBeDefined()
      expect(client.$transaction).toBeDefined()
    })

    it("should allow transaction operations", async () => {
      // Arrange
      const mockCallback = jest.fn().mockResolvedValue("result")

      // Act
      const result = await service.client.$transaction(mockCallback as any)

      // Assert
      expect(result).toBe("result")
      expect(mockCallback).toHaveBeenCalled()
    })
  })

  describe("common patterns", () => {
    it("should support raw queries", async () => {
      // Act & Assert
      await expect(service.client.$queryRaw`SELECT 1 as test`).resolves.toBeDefined()
    })

    it("should support parameterized queries", async () => {
      // Arrange
      const value = "test"

      // Act & Assert
      await expect(service.client.$queryRaw`SELECT ${value} as test`).resolves.toBeDefined()
    })
  })
})
