import { Test } from "@nestjs/testing"
import { HealthController } from "../../../src/health/health.controller"
import { HealthService } from "../../../src/health/health.service"
import { HttpException, HttpStatus } from "@nestjs/common"

describe("HealthController", () => {
  let controller: HealthController
  let mockHealthService: jest.Mocked<HealthService>

  beforeEach(async () => {
    mockHealthService = {
      checkDatabase: jest.fn(),
      getMemoryUsage: jest.fn(),
      getUptime: jest.fn(),
    } as any

    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: mockHealthService }],
    }).compile()

    controller = module.get<HealthController>(HealthController)
  })

  describe("health", () => {
    it("should return healthy status", async () => {
      // Arrange
      mockHealthService.checkDatabase.mockResolvedValue({
        status: "healthy",
        responseTime: 50,
      })
      mockHealthService.getMemoryUsage.mockReturnValue({
        heapUsed: "100MB",
        heapTotal: "200MB",
        external: "10MB",
        rss: "300MB",
      })
      mockHealthService.getUptime.mockReturnValue("1h 30m 45s")

      // Act
      const result = await controller.health()

      // Assert
      expect(result.status).toBe("healthy")
      expect(result.database).toEqual({ status: "healthy", responseTime: 50 })
      expect(result.memory).toBeDefined()
      expect(result.uptime).toBe("1h 30m 45s")
      expect(result.timestamp).toBeDefined()
    })

    it("should throw 503 when database is unhealthy", async () => {
      // Arrange
      mockHealthService.checkDatabase.mockResolvedValue({
        status: "unhealthy",
        error: "Connection failed",
      })
      mockHealthService.getMemoryUsage.mockReturnValue({
        heapUsed: "100MB",
        heapTotal: "200MB",
        external: "10MB",
        rss: "300MB",
      })
      mockHealthService.getUptime.mockReturnValue("1h 30m 45s")

      // Act & Assert
      await expect(controller.health()).rejects.toThrow(HttpException)
      await expect(controller.health()).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.SERVICE_UNAVAILABLE,
        }),
      )
    })

    it("should include database response time", async () => {
      // Arrange
      mockHealthService.checkDatabase.mockResolvedValue({
        status: "healthy",
        responseTime: 75,
      })
      mockHealthService.getMemoryUsage.mockReturnValue({
        heapUsed: "100MB",
        heapTotal: "200MB",
        external: "10MB",
        rss: "300MB",
      })
      mockHealthService.getUptime.mockReturnValue("1h 30m 45s")

      // Act
      const result = await controller.health()

      // Assert
      expect(result.database.responseTime).toBe(75)
    })
  })

  describe("liveness", () => {
    it("should return alive status", async () => {
      // Act
      const result = await controller.liveness()

      // Assert
      expect(result.status).toBe("alive")
      expect(result.timestamp).toBeDefined()
    })

    it("should always succeed (no dependencies checked)", async () => {
      // Act
      const result = await controller.liveness()

      // Assert
      expect(result.status).toBe("alive")
      expect(mockHealthService.checkDatabase).not.toHaveBeenCalled()
    })
  })

  describe("readiness", () => {
    it("should return ready status when database is healthy", async () => {
      // Arrange
      mockHealthService.checkDatabase.mockResolvedValue({
        status: "healthy",
        responseTime: 50,
      })

      // Act
      const result = await controller.readiness()

      // Assert
      expect(result.status).toBe("ready")
      expect(result.timestamp).toBeDefined()
    })

    it("should throw 503 when database is unhealthy", async () => {
      // Arrange
      mockHealthService.checkDatabase.mockResolvedValue({
        status: "unhealthy",
        error: "Database unavailable",
      })

      // Act & Assert
      await expect(controller.readiness()).rejects.toThrow(HttpException)
      await expect(controller.readiness()).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.SERVICE_UNAVAILABLE,
        }),
      )
    })

    it("should check database availability", async () => {
      // Arrange
      mockHealthService.checkDatabase.mockResolvedValue({
        status: "healthy",
        responseTime: 50,
      })

      // Act
      await controller.readiness()

      // Assert
      expect(mockHealthService.checkDatabase).toHaveBeenCalled()
    })
  })
})
