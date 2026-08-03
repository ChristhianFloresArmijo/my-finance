import { Test } from "@nestjs/testing"
import { HealthService } from "../../../src/health/health.service"
import { PrismaService } from "@shared/integration/services/prisma.service"

describe("HealthService", () => {
  let service: HealthService
  let mockPrismaService: jest.Mocked<PrismaService>

  beforeEach(async () => {
    mockPrismaService = {
      $queryRaw: jest.fn(),
    } as any

    const module = await Test.createTestingModule({
      providers: [HealthService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile()

    service = module.get<HealthService>(HealthService)
  })

  describe("checkDatabase", () => {
    it("should return healthy status for successful connection", async () => {
      // Arrange
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }])

      // Act
      const result = await service.checkDatabase()

      // Assert
      expect(result.status).toBe("healthy")
      expect(result.responseTime).toBeDefined()
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
    })

    it("should return unhealthy status for failed connection", async () => {
      // Arrange
      mockPrismaService.$queryRaw.mockRejectedValue(new Error("Connection refused"))

      // Act
      const result = await service.checkDatabase()

      // Assert
      expect(result.status).toBe("unhealthy")
      expect(result.error).toBe("Connection refused")
    })

    it("should measure response time", async () => {
      // Arrange
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }] as any)

      // Act
      const result = await service.checkDatabase()

      // Assert
      expect(result.status).toBe("healthy")
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe("getMemoryUsage", () => {
    it("should return memory usage statistics", () => {
      // Act
      const result = service.getMemoryUsage()

      // Assert
      expect(result).toHaveProperty("heapUsed")
      expect(result).toHaveProperty("heapTotal")
      expect(result).toHaveProperty("external")
      expect(result).toHaveProperty("rss")
      expect(result.heapUsed).toMatch(/\d+MB/)
    })

    it("should format memory values as megabytes", () => {
      // Act
      const result = service.getMemoryUsage()

      // Assert
      expect(result.heapUsed).toMatch(/^\d+MB$/)
      expect(result.heapTotal).toMatch(/^\d+MB$/)
      expect(result.external).toMatch(/^\d+MB$/)
      expect(result.rss).toMatch(/^\d+MB$/)
    })
  })

  describe("getUptime", () => {
    it("should return formatted uptime", () => {
      // Act
      const result = service.getUptime()

      // Assert
      expect(result).toMatch(/\d+h \d+m \d+s/)
    })

    it("should include hours minutes and seconds", () => {
      // Act
      const result = service.getUptime()

      // Assert
      expect(result).toContain("h")
      expect(result).toContain("m")
      expect(result).toContain("s")
    })
  })
})
