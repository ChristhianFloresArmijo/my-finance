import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication, ValidationPipe } from "@nestjs/common"
import * as request from "supertest"
import * as cookieParser from "cookie-parser"
import { AppModule } from "../../../src/app.module"
import { PrismaService } from "@shared/integration/services/prisma.service"
import { Status } from "@database/prisma/generated-client"
import { cleanDatabase } from "../../helpers/database.helper"

/**
 * Account Module E2E Tests
 *
 * End-to-end tests for the Account module API endpoints.
 * These tests cover the complete flow from HTTP request to database response.
 *
 * Note: Some endpoints require authentication. We test the endpoints that are
 * accessible without auth (@Public decorator).
 */

describe("Account Module (E2E)", () => {
  let app: INestApplication
  let prismaService: PrismaService

  beforeAll(async () => {
    // Create test application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()

    // Apply global pipes and middleware (same as main.ts)
    app.use(cookieParser())
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )

    await app.init()

    prismaService = app.get<PrismaService>(PrismaService)

    // Clean database before tests
    await cleanDatabase(prismaService)
  })

  afterAll(async () => {
    await cleanDatabase(prismaService)
    await app.close()
  })

  beforeEach(async () => {
    // Clean database before each test
    await cleanDatabase(prismaService)
  })

  describe("POST /account (Create User)", () => {
    it("should create a new user successfully", async () => {
      // Arrange
      const newUser = {
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        password: "SecurePassword123!",
        repassword: "SecurePassword123!",
        status: Status.ACTIVE,
      }

      // Act
      const response = await request(app.getHttpServer()).post("/account").send(newUser).expect(201)

      // Assert
      expect(response.body).toBeDefined()
      expect(response.body.id).toBeDefined()
      expect(response.body.email).toBe("john.doe@example.com")
      expect(response.body.first_name).toBe("John")
      expect(response.body.last_name).toBe("Doe")
      expect(response.body.password).toBeUndefined() // Should be excluded
      expect(response.body.full_name).toBe("John Doe")
    })

    it("should reject duplicate email", async () => {
      // Arrange - Create first user
      const userData = {
        first_name: "John",
        last_name: "Doe",
        email: "duplicate@example.com",
        password: "SecurePassword123!",
        repassword: "SecurePassword123!",
        status: Status.ACTIVE,
      }

      await request(app.getHttpServer()).post("/account").send(userData).expect(201)

      // Act - Try to create user with same email
      const response = await request(app.getHttpServer())
        .post("/account")
        .send(userData)
        .expect(500) // Internal server error for duplicate

      // Assert
      expect(response.body.message).toBeDefined()
    })

    it("should validate required fields", async () => {
      // Arrange - Missing required fields
      const invalidUser = {
        first_name: "John",
        // Missing: last_name, email, password, repassword, status
      }

      // Act & Assert
      await request(app.getHttpServer()).post("/account").send(invalidUser).expect(400) // Bad request for validation error
    })

    it("should validate email format", async () => {
      // Arrange
      const invalidUser = {
        first_name: "John",
        last_name: "Doe",
        email: "not-an-email",
        password: "SecurePassword123!",
        repassword: "SecurePassword123!",
        status: Status.ACTIVE,
      }

      // Act & Assert
      await request(app.getHttpServer()).post("/account").send(invalidUser).expect(400)
    })

    it("should validate password strength", async () => {
      // Arrange
      const weakPasswordUser = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        password: "123",
        repassword: "123",
        status: Status.ACTIVE,
      }

      // Act & Assert - ValidationPipe catches this before handler
      await request(app.getHttpServer()).post("/account").send(weakPasswordUser).expect(400) // Bad request from ValidationPipe
    })

    it("should accept matching passwords (validation happens in entity layer)", async () => {
      // Arrange
      const validUser = {
        first_name: "John",
        last_name: "Doe",
        email: "john2@example.com",
        password: "SecurePassword123!",
        repassword: "SecurePassword123!",
        status: Status.ACTIVE,
      }

      // Act
      const response = await request(app.getHttpServer())
        .post("/account")
        .send(validUser)
        .expect(201)

      // Assert - User created successfully
      expect(response.body.id).toBeDefined()
      expect(response.body.email).toBe("john2@example.com")
    })
  })

  describe("GET /account/:id (Find User by ID)", () => {
    it("should return 401 unauthorized without auth token", async () => {
      // Arrange
      const userId = "00000000-0000-0000-0000-000000000000"

      // Act & Assert - GET endpoints require authentication
      await request(app.getHttpServer()).get(`/account/${userId}`).expect(401)
    })

    it("should verify endpoint exists and requires auth", async () => {
      // Arrange - Create a user first
      const newUser = {
        first_name: "Jane",
        last_name: "Smith",
        email: "jane.smith@example.com",
        password: "SecurePassword123!",
        repassword: "SecurePassword123!",
        status: Status.ACTIVE,
      }

      const createResponse = await request(app.getHttpServer())
        .post("/account")
        .send(newUser)
        .expect(201)

      const userId = createResponse.body.id

      // Act & Assert - Without auth token, should get 401
      await request(app.getHttpServer()).get(`/account/${userId}`).expect(401)
    })
  })

  describe("GET /account (List Users)", () => {
    it("should return 401 unauthorized without auth token", async () => {
      // Act & Assert - List endpoint requires authentication
      await request(app.getHttpServer())
        .get("/account")
        .query({ limit: "10", offset: "0" })
        .expect(401)
    })

    it("should verify endpoint exists and requires auth", async () => {
      // Arrange - Create a user first
      await request(app.getHttpServer()).post("/account").send({
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        password: "SecurePassword123!",
        repassword: "SecurePassword123!",
        status: Status.ACTIVE,
      })

      // Act & Assert - Without auth token, should get 401
      await request(app.getHttpServer())
        .get("/account")
        .query({ limit: "2", offset: "0" })
        .expect(401)
    })
  })
})
