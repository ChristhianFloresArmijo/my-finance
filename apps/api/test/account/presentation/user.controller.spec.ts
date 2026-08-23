import { Test, TestingModule } from "@nestjs/testing"
import { CommandBus, QueryBus } from "@nestjs/cqrs"
import { UserController } from "@account/presentation/restful/user.controller"
import { CreateUserCommand } from "@account/capabilities/commands"
import { FindUserByIdQuery, ListUsersQuery } from "@account/capabilities/queries"
import { NewUserSerializer } from "@account/presentation/dtos"
import { Status } from "@database/prisma/generated-client"
import { success, failure } from "@shared/business/utils/error-handling"
import { InternalServerErrorException } from "@nestjs/common"
import { ValidationException } from "@shared/business/exceptions"
import { createMockUser } from "../../helpers/mock-factories"

/**
 * UserController Tests
 *
 * Tests for the UserController which handles HTTP endpoints for user management.
 */

describe("UserController", () => {
  let controller: UserController
  let mockCommandBus: jest.Mocked<CommandBus>
  let mockQueryBus: jest.Mocked<QueryBus>

  beforeEach(async () => {
    // Setup mock buses
    mockCommandBus = {
      execute: jest.fn(),
    } as any

    mockQueryBus = {
      execute: jest.fn(),
    } as any

    // Create test module
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: QueryBus, useValue: mockQueryBus },
      ],
    }).compile()

    controller = module.get<UserController>(UserController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("create", () => {
    it("should successfully create a user", async () => {
      // Arrange
      const dto: NewUserSerializer = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        password: "SecurePassword123!",
        repassword: "SecurePassword123!",
        status: Status.ACTIVE,
      }

      const mockUser = createMockUser({
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      })

      mockCommandBus.execute.mockResolvedValue(success(mockUser))

      // Act
      const result = await controller.create(dto)

      // Assert
      expect(result).toBe(mockUser)
      expect(mockCommandBus.execute).toHaveBeenCalledWith(expect.any(CreateUserCommand))
    })

    it("should throw error when user creation fails", async () => {
      // Arrange
      const dto: NewUserSerializer = {
        first_name: "John",
        last_name: "Doe",
        email: "existing@example.com",
        password: "SecurePassword123!",
        repassword: "SecurePassword123!",
        status: Status.ACTIVE,
      }

      const error = new InternalServerErrorException("Email already exists")
      mockCommandBus.execute.mockResolvedValue(failure(error))

      // Act & Assert
      await expect(controller.create(dto)).rejects.toThrow(InternalServerErrorException)
      expect(mockCommandBus.execute).toHaveBeenCalled()
    })

    it("should handle validation errors", async () => {
      // Arrange
      const dto: NewUserSerializer = {
        first_name: "",
        last_name: "Doe",
        email: "invalid-email",
        password: "123",
        repassword: "456",
        status: Status.ACTIVE,
      }

      const validationError = new ValidationException({
        first_name: ["First name is required"],
        email: ["Invalid email format"],
        password: ["Passwords do not match"],
      })
      mockCommandBus.execute.mockResolvedValue(failure(validationError))

      // Act & Assert
      await expect(controller.create(dto)).rejects.toThrow(ValidationException)
    })
  })

  describe("retrive", () => {
    it("should successfully retrieve a user by id", async () => {
      // Arrange
      const userId = "user-123"
      const mockUser = createMockUser({
        id: userId,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      })

      mockQueryBus.execute.mockResolvedValue(success(mockUser))

      // Act
      const result = await controller.retrive(userId)

      // Assert
      expect(result).toBe(mockUser)
      expect(mockQueryBus.execute).toHaveBeenCalledWith(expect.any(FindUserByIdQuery))
    })

    it("should throw error when user not found", async () => {
      // Arrange
      const userId = "non-existent-id"
      const error = new InternalServerErrorException("User not found")
      mockQueryBus.execute.mockResolvedValue(failure(error))

      // Act & Assert
      await expect(controller.retrive(userId)).rejects.toThrow(InternalServerErrorException)
      expect(mockQueryBus.execute).toHaveBeenCalled()
    })

    it("should handle invalid UUID format", async () => {
      // Arrange
      const invalidId = "invalid-uuid"
      const error = new InternalServerErrorException("Invalid UUID format")
      mockQueryBus.execute.mockResolvedValue(failure(error))

      // Act & Assert
      await expect(controller.retrive(invalidId)).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe("list", () => {
    it("should successfully list users with pagination", async () => {
      // Arrange
      const query = { limit: "10", offset: "0" }
      const mockUsers = [
        createMockUser({ id: "user-1", email: "user1@example.com" }),
        createMockUser({ id: "user-2", email: "user2@example.com" }),
      ]

      const paginatedResult = {
        count: 2,
        results: mockUsers,
      }

      mockQueryBus.execute.mockResolvedValue(success(paginatedResult))

      // Act
      const result = await controller.list(query)

      // Assert
      expect(result).toEqual(paginatedResult)
      expect(result.count).toBe(2)
      expect(result.results).toHaveLength(2)
      expect(mockQueryBus.execute).toHaveBeenCalledWith(expect.any(ListUsersQuery))
    })

    it("should return empty list when no users found", async () => {
      // Arrange
      const query = { limit: "10", offset: "0" }
      const paginatedResult = {
        count: 0,
        results: [],
      }

      mockQueryBus.execute.mockResolvedValue(success(paginatedResult))

      // Act
      const result = await controller.list(query)

      // Assert
      expect(result.count).toBe(0)
      expect(result.results).toHaveLength(0)
    })

    it("should handle pagination parameters", async () => {
      // Arrange
      const query = { limit: "20", offset: "40" }
      const mockUsers = [createMockUser()]
      const paginatedResult = {
        count: 100,
        results: mockUsers,
      }

      mockQueryBus.execute.mockResolvedValue(success(paginatedResult))

      // Act
      const result = await controller.list(query)

      // Assert
      expect(result.count).toBe(100)
      expect(mockQueryBus.execute).toHaveBeenCalled()
    })

    it("should handle query errors", async () => {
      // Arrange
      const query = { limit: "10", offset: "0" }
      const error = new InternalServerErrorException("Database error")
      mockQueryBus.execute.mockResolvedValue(failure(error))

      // Act & Assert
      await expect(controller.list(query)).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe("guards and interceptors", () => {
    it("should have ClassSerializerInterceptor on create endpoint", () => {
      // This is a metadata test - the decorator applies the interceptor
      const createMetadata = Reflect.getMetadata("__interceptors__", controller.create)
      expect(createMetadata).toBeDefined()
    })

    it("should have ClassSerializerInterceptor on retrive endpoint", () => {
      const retriveMetadata = Reflect.getMetadata("__interceptors__", controller.retrive)
      expect(retriveMetadata).toBeDefined()
    })

    it("should have ClassSerializerInterceptor on list endpoint", () => {
      const listMetadata = Reflect.getMetadata("__interceptors__", controller.list)
      expect(listMetadata).toBeDefined()
    })
  })
})
