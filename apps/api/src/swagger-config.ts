import { INestApplication } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from "@nestjs/swagger"
import { apiReference } from "@scalar/nestjs-api-reference"
import helmet from "helmet"

export class SwaggerConfig {
  constructor(
    private readonly app: INestApplication,
    private readonly nodeEnv: string = "development",
  ) {
    const document = SwaggerModule.createDocument(app, this.config())

    // Expose raw OpenAPI JSON for tooling (always available)
    app.use("/openapi.json", (_req, res) => res.json(document))

    // Scalar API reference — disabled in production to avoid exposing full API surface
    if (nodeEnv !== "production") {
      // Relax CSP for /reference only — Scalar loads assets from its CDN
      app.use(
        "/reference",
        helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
              styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
              fontSrc: ["'self'", "https://fonts.gstatic.com"],
              imgSrc: ["'self'", "data:", "https:"],
              connectSrc: ["'self'"],
              workerSrc: ["'self'", "blob:"],
            },
          },
        }),
      )

      app.use(
        "/reference",
        apiReference({
          spec: { content: document },
          theme: "saturn",
          defaultHttpClient: {
            targetKey: "javascript",
            clientKey: "fetch",
          },
          authentication: {
            preferredSecurityScheme: "JWT",
            http: {
              bearer: { token: "" },
            },
          },
        }),
      )
    }
  }

  config(): Omit<OpenAPIObject, "paths"> {
    return new DocumentBuilder()
      .setTitle("NestJS + Prisma DDD Template API")
      .setDescription(
        "Production-ready backend template with DDD, CQRS, JWT authentication, " +
          "RBAC (roles + direct user permissions), and a full audit change log.",
      )
      .setVersion("1.0.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token from POST /api/auth/sign-in",
          name: "Authorization",
          in: "header",
        },
        "JWT",
      )
      .addCookieAuth("accessToken", {
        type: "apiKey",
        in: "cookie",
        name: "accessToken",
        description: "HTTP-only cookie containing JWT access token",
      })
      .addTag("auth", "Authentication — sign in, refresh, sign out, current user")
      .addTag("account", "User account management")
      .addTag("roles", "Role management (RBAC)")
      .addTag("permissions", "Permission management (RBAC)")
      .addTag("user-roles", "Assign and revoke roles to/from users")
      .addTag("user-permissions", "Grant and revoke permissions directly to/from users")
      .addTag("health", "Health check")
      .build()
  }
}
