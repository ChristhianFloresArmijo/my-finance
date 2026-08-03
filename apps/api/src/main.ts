import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { ValidationPipe } from "@nestjs/common"
import { TransformInterceptor } from "@shared/capabilities/interceptors"
import { ConfigService } from "@nestjs/config"
import helmet from "helmet"
import * as cookieParser from "cookie-parser"
import { SwaggerConfig } from "./swagger-config"
// import { JwtGuard } from "./modules/authentication/integration/guards/JwtGuard"
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // 🔒 Security Headers (XSS, clickjacking, MIME sniffing, etc.)
  app.use(helmet())

  // 🍪 Cookie Parser (for HTTP-only cookies)
  app.use(cookieParser())

  // 🌍 CORS Configuration
  const corsEnabled = configService.get<boolean>("corsEnabled")
  if (corsEnabled) {
    const origins = configService.get<string>("corsOrigin").split(",")
    app.enableCors({
      origin: origins,
      credentials: true, // Allow cookies
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
    console.log(`✅ CORS enabled for: ${origins.join(", ")}`)
  }

  // Response envelope — wraps all 2xx bodies in { data, timestamp }
  app.useGlobalInterceptors(new TransformInterceptor())

  // Validation Pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // app.useGlobalGuards(new JwtGuard(reflector))
  app.setGlobalPrefix("api")

  // API Reference (Scalar)
  new SwaggerConfig(app, configService.get<string>("nodeEnv") ?? "development")
  // 🛑 Graceful Shutdown Handler
  // In production, wait for in-flight requests to finish before closing.
  // In development (watch mode), shut down immediately so the restarted
  // process can bind port 3000 without hitting EADDRINUSE.
  const nodeEnv = configService.get<string>("nodeEnv") ?? "development"
  const shutdownDelay = nodeEnv === "production" ? 5000 : 0

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n📡 ${signal} received. Starting graceful shutdown...`)

    try {
      if (shutdownDelay > 0) {
        console.log("⏳ Waiting for ongoing requests to complete...")
        await new Promise((resolve) => setTimeout(resolve, shutdownDelay))
      }

      console.log("🔌 Closing application...")
      await app.close()

      console.log("✅ Graceful shutdown completed")
      process.exit(0)
    } catch (error) {
      console.error("❌ Error during shutdown:", error)
      process.exit(1)
    }
  }

  // Register shutdown handlers
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
  process.on("SIGINT", () => gracefulShutdown("SIGINT"))
  process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2")) // nodemon restart

  await app.listen(3000)
  console.log(`🚀 Application is running on: http://localhost:3000`)
  console.log(`📚 API Reference:      http://localhost:3000/reference`)
  console.log(`💚 Health Check: http://localhost:3000/api/health`)
}
bootstrap()
