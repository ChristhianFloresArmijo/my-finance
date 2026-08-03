import { Test, TestingModule } from "@nestjs/testing"
import { CleanupTokensHandler } from "@auth/capabilities/cleanup-tokens/handler"
import { CleanupTokensCommand } from "@auth/capabilities/cleanup-tokens/command"
import { IRefreshTokenRepository } from "@auth/business/repositories"
import { success, failure } from "@shared/business/utils/error-handling"

/**
 * CleanupTokensHandler Unit Tests
 *
 * Tests the handler that cleans up old inactive refresh tokens from the database.
 */

describe("CleanupTokensHandler", () => {
  let handler: CleanupTokensHandler
  let mockRefreshTokenRepo: jest.Mocked<IRefreshTokenRepository>

  beforeEach(async () => {
    // Create mock repository
    mockRefreshTokenRepo = {
      findByUserToken: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByUser: jest.fn(),
      deleteMany: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanupTokensHandler,
        {
          provide: IRefreshTokenRepository,
          useValue: mockRefreshTokenRepo,
        },
      ],
    }).compile()

    handler = module.get<CleanupTokensHandler>(CleanupTokensHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("execute", () => {
    it("should successfully delete inactive tokens older than specified days", async () => {
      // Arrange
      const command = new CleanupTokensCommand(7) // 7 days old
      mockRefreshTokenRepo.deleteMany.mockResolvedValueOnce(success(5))

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(5)
      }
      expect(mockRefreshTokenRepo.deleteMany).toHaveBeenCalled()
    })

    it("should return 0 when no old tokens found", async () => {
      // Arrange
      const command = new CleanupTokensCommand(30)
      mockRefreshTokenRepo.deleteMany.mockResolvedValueOnce(success(0))

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(0)
      }
    })

    it("should delete tokens with INACTIVE status older than cutoff date", async () => {
      // Arrange
      const daysOld = 14
      const command = new CleanupTokensCommand(daysOld)
      mockRefreshTokenRepo.deleteMany.mockResolvedValueOnce(success(3))

      // Act
      await handler.execute(command)

      // Assert
      expect(mockRefreshTokenRepo.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "INACTIVE",
            updated_at: expect.objectContaining({
              lt: expect.any(Date),
            }),
          }),
        }),
      )
    })

    it("should handle repository errors gracefully", async () => {
      // Arrange
      const command = new CleanupTokensCommand(7)
      mockRefreshTokenRepo.deleteMany.mockResolvedValueOnce(failure({ error: ["Database error"] }))

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should handle unexpected exceptions", async () => {
      // Arrange
      const command = new CleanupTokensCommand(7)
      mockRefreshTokenRepo.deleteMany.mockRejectedValueOnce(new Error("Unexpected error"))

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should use correct cutoff date calculation", async () => {
      // Arrange
      const daysOld = 30
      const command = new CleanupTokensCommand(daysOld)
      mockRefreshTokenRepo.deleteMany.mockResolvedValueOnce(success(10))

      const expectedCutoffDate = new Date()
      expectedCutoffDate.setDate(expectedCutoffDate.getDate() - daysOld)

      // Act
      await handler.execute(command)

      // Assert
      const callArg = (mockRefreshTokenRepo.deleteMany as jest.Mock).mock.calls[0][0]
      const actualCutoffDate = callArg.where.updated_at.lt

      // Check date is within 1 second of expected (to handle execution time)
      const diff = Math.abs(actualCutoffDate.getTime() - expectedCutoffDate.getTime())
      expect(diff).toBeLessThan(1000)
    })

    it("should handle large number of deleted tokens", async () => {
      // Arrange
      const command = new CleanupTokensCommand(90)
      mockRefreshTokenRepo.deleteMany.mockResolvedValueOnce(success(1000))

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(1000)
      }
    })
  })
})
