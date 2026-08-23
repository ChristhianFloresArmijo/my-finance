import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication, ValidationPipe } from "@nestjs/common"
import * as request from "supertest"
import * as cookieParser from "cookie-parser"
import { AppModule } from "../../../src/app.module"
import { PrismaService } from "@shared/integration/services/prisma.service"
import { cleanDatabase } from "../../helpers/database.helper"

/**
 * Authentication E2E Tests
 *
 * Covers real HTTP flows end-to-end against a live NestJS app + database.
 * Requires DATABASE_URL pointing at a test database (see .env.test).
 *
 * Run with: pnpm test:e2e
 */

const SIGN_UP_PAYLOAD = {
  first_name: "E2E",
  last_name: "User",
  email: "e2e@example.com",
  password: "StrongPass1!",
  repassword: "StrongPass1!",
}

/** Extract cookies from a supertest response as a string suitable for Cookie: header. */
function extractCookies(res: request.Response): string {
  const setCookie = res.headers["set-cookie"] as string[] | string | undefined
  if (!setCookie) return ""
  return (Array.isArray(setCookie) ? setCookie : [setCookie]).map((c) => c.split(";")[0]).join("; ")
}

describe("Authentication (E2E)", () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.use(cookieParser())
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    )
    await app.init()

    prisma = app.get<PrismaService>(PrismaService)
    await cleanDatabase(prisma)
  })

  afterAll(async () => {
    await cleanDatabase(prisma)
    await app.close()
  })

  beforeEach(async () => {
    await cleanDatabase(prisma)
  })

  // ─── Endpoint existence / auth guards ────────────────────────────────────

  describe("Endpoint guards", () => {
    it("GET /auth/me returns 401 when unauthenticated", async () => {
      const res = await request(app.getHttpServer()).get("/auth/me")
      expect(res.status).toBe(401)
    })

    it("POST /auth/sign-out returns 401 when unauthenticated", async () => {
      const res = await request(app.getHttpServer()).post("/auth/sign-out")
      expect(res.status).toBe(401)
    })

    it("POST /auth/refresh returns 401 when no refresh cookie", async () => {
      const res = await request(app.getHttpServer()).post("/auth/refresh")
      expect(res.status).toBe(401)
    })

    it("POST /auth/sign-in returns 400 for missing fields", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/sign-in")
        .send({ email: "x@x.com" })
      expect([400, 401]).toContain(res.status)
    })
  })

  // ─── Sign-up flow ─────────────────────────────────────────────────────────

  describe("POST /auth/sign-up", () => {
    it("creates an account and returns 201", async () => {
      const res = await request(app.getHttpServer()).post("/auth/sign-up").send(SIGN_UP_PAYLOAD)
      expect(res.status).toBe(201)
    })

    it("rejects duplicate email with 4xx", async () => {
      await request(app.getHttpServer()).post("/auth/sign-up").send(SIGN_UP_PAYLOAD)
      const res = await request(app.getHttpServer()).post("/auth/sign-up").send(SIGN_UP_PAYLOAD)
      expect(res.status).toBeGreaterThanOrEqual(400)
      expect(res.status).toBeLessThan(500)
    })

    it("rejects mismatched passwords with 400", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/sign-up")
        .send({ ...SIGN_UP_PAYLOAD, repassword: "WrongPass1!" })
      expect(res.status).toBe(400)
    })

    it("rejects weak password with 400", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/sign-up")
        .send({ ...SIGN_UP_PAYLOAD, password: "weak", repassword: "weak" })
      expect(res.status).toBe(400)
    })
  })

  // ─── Sign-in → /me → sign-out flow ───────────────────────────────────────

  describe("Full auth flow: sign-up → sign-in → /me → sign-out", () => {
    it("issues cookies on sign-in and clears them on sign-out", async () => {
      // 1. Sign up
      await request(app.getHttpServer()).post("/auth/sign-up").send(SIGN_UP_PAYLOAD)

      // 2. Sign in
      const signInRes = await request(app.getHttpServer()).post("/auth/sign-in").send({
        email: SIGN_UP_PAYLOAD.email,
        password: SIGN_UP_PAYLOAD.password,
      })
      expect(signInRes.status).toBe(200)
      const cookies = extractCookies(signInRes)
      expect(cookies).toMatch(/access_token|refresh_token/i)

      // 3. GET /auth/me with session cookie
      const meRes = await request(app.getHttpServer()).get("/auth/me").set("Cookie", cookies)
      expect(meRes.status).toBe(200)
      expect(meRes.body.data?.email ?? meRes.body.email).toBe(SIGN_UP_PAYLOAD.email)

      // 4. Sign out
      const signOutRes = await request(app.getHttpServer())
        .post("/auth/sign-out")
        .set("Cookie", cookies)
      expect(signOutRes.status).toBe(200)

      // 5. /me should be 401 now
      const meAfterRes = await request(app.getHttpServer()).get("/auth/me").set("Cookie", cookies)
      expect(meAfterRes.status).toBe(401)
    })

    it("includes roles and permissions in /auth/me response", async () => {
      await request(app.getHttpServer()).post("/auth/sign-up").send(SIGN_UP_PAYLOAD)
      const signInRes = await request(app.getHttpServer()).post("/auth/sign-in").send({
        email: SIGN_UP_PAYLOAD.email,
        password: SIGN_UP_PAYLOAD.password,
      })
      const cookies = extractCookies(signInRes)

      const meRes = await request(app.getHttpServer()).get("/auth/me").set("Cookie", cookies)
      const body = meRes.body.data ?? meRes.body
      expect(Array.isArray(body.roles)).toBe(true)
      expect(Array.isArray(body.permissions)).toBe(true)
    })
  })

  // ─── Token refresh flow ───────────────────────────────────────────────────

  describe("POST /auth/refresh", () => {
    it("issues new access token using a valid refresh cookie", async () => {
      await request(app.getHttpServer()).post("/auth/sign-up").send(SIGN_UP_PAYLOAD)
      const signInRes = await request(app.getHttpServer()).post("/auth/sign-in").send({
        email: SIGN_UP_PAYLOAD.email,
        password: SIGN_UP_PAYLOAD.password,
      })
      const cookies = extractCookies(signInRes)

      const refreshRes = await request(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", cookies)
      expect(refreshRes.status).toBe(200)
      // New cookies should be set
      expect(refreshRes.headers["set-cookie"]).toBeDefined()
    })
  })

  // ─── Password reset flow ──────────────────────────────────────────────────

  describe("Forgot / reset password", () => {
    it("POST /auth/forgot-password returns 200 for any email (no user enumeration)", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/forgot-password")
        .send({ email: "nobody@example.com" })
      // Must never 404 — always 200 to avoid leaking whether email exists
      expect(res.status).toBe(200)
    })

    it("POST /auth/forgot-password returns 400 for invalid email", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/forgot-password")
        .send({ email: "not-an-email" })
      expect(res.status).toBe(400)
    })

    it("POST /auth/reset-password returns 400 for invalid/missing token", async () => {
      const res = await request(app.getHttpServer()).post("/auth/reset-password").send({
        token: "invalid-token",
        password: "NewPass1!",
        repassword: "NewPass1!",
      })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  // ─── 2FA endpoints (existence + guard checks) ────────────────────────────

  describe("2FA endpoints", () => {
    it("POST /auth/2fa/setup requires authentication", async () => {
      const res = await request(app.getHttpServer()).post("/auth/2fa/setup")
      expect(res.status).toBe(401)
    })

    it("POST /auth/2fa/enable requires authentication", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/2fa/enable")
        .send({ code: "123456" })
      expect(res.status).toBe(401)
    })

    it("GET /auth/2fa/status requires authentication", async () => {
      const res = await request(app.getHttpServer()).get("/auth/2fa/status")
      expect(res.status).toBe(401)
    })

    it("GET /auth/2fa/status returns current status for authenticated user", async () => {
      await request(app.getHttpServer()).post("/auth/sign-up").send(SIGN_UP_PAYLOAD)
      const signInRes = await request(app.getHttpServer()).post("/auth/sign-in").send({
        email: SIGN_UP_PAYLOAD.email,
        password: SIGN_UP_PAYLOAD.password,
      })
      const cookies = extractCookies(signInRes)

      const statusRes = await request(app.getHttpServer())
        .get("/auth/2fa/status")
        .set("Cookie", cookies)
      expect(statusRes.status).toBe(200)
      const body = statusRes.body.data ?? statusRes.body
      expect(typeof body.totp_enabled).toBe("boolean")
      expect(body.totp_enabled).toBe(false)
    })

    it("POST /auth/2fa/setup returns an otpauth:// URI for authenticated user", async () => {
      await request(app.getHttpServer()).post("/auth/sign-up").send(SIGN_UP_PAYLOAD)
      const signInRes = await request(app.getHttpServer()).post("/auth/sign-in").send({
        email: SIGN_UP_PAYLOAD.email,
        password: SIGN_UP_PAYLOAD.password,
      })
      const cookies = extractCookies(signInRes)

      const setupRes = await request(app.getHttpServer())
        .post("/auth/2fa/setup")
        .set("Cookie", cookies)
      expect(setupRes.status).toBe(201)
      const body = setupRes.body.data ?? setupRes.body
      expect(body.uri).toMatch(/^otpauth:\/\/totp\//)
    })
  })
})
