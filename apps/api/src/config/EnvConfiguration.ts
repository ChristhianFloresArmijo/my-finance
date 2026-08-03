export enum NodeEnv {
  Dev = "development",
  Prod = "production",
}

export interface StorageConfig {
  type: "local" | "s3"
  s3Bucket?: string
  s3Region?: string
  s3BaseUrl?: string
}

export interface MailConfig {
  host: string
  port: number
  secure: boolean
  from: string
}

export interface EnvironmentVariables {
  nodeEnv: NodeEnv
  storage: StorageConfig
  defaultSignupRole: string | undefined
  jwtSecretKey: string
  jwtRefreshSecretKey: string
  secretKeyExpiresIn: string
  accessTokenValidityDurationInSec: string
  // Admin user configuration
  rootAdminEmail: string
  rootAdminPassword: string
  rootAdminFirstName: string
  rootAdminLastName: string
  mail: MailConfig
  appUrl: string
  // CORS configuration
  corsOrigin: string
  corsEnabled: boolean
  // Rate limiting configuration
  throttlerTtl: number
  throttlerLimit: number
  // Cookie configuration
  cookieSecure: boolean
  cookieSameSite: string
  cookieDomain: string | undefined
}

/** Strip inline comments that dotenv leaves in values when the .env file uses `KEY=value  # comment` syntax. */
const env = (key: string): string | undefined => process.env[key]?.split("#")[0].trim() || undefined

export default (): EnvironmentVariables => {
  const jwtSecretKey = env("JWT_SECRET_KEY")
  const jwtRefreshSecretKey = env("JWT_REFRESH_SECRET_KEY")
  const secretKeyExpiresIn = env("SECRET_KEY_EXPIRES_IN")
  const accessTokenValidityDurationInSec = env("ACCESS_TOKEN_VALIDITY_DURATION_IN_SEC")

  // Admin user environment variables
  const rootAdminEmail = env("ROOT_ADMIN_EMAIL")
  const rootAdminPassword = env("ROOT_ADMIN_PASSWORD")
  const rootAdminFirstName = env("ROOT_ADMIN_FIRST_NAME")
  const rootAdminLastName = env("ROOT_ADMIN_LAST_NAME")

  if (!jwtSecretKey) {
    throw new Error("Jwt secret is not set in env")
  }

  if (!jwtRefreshSecretKey) {
    throw new Error("Jwt refresh secret is not set in env")
  }

  // Validate admin credentials in production
  if (process.env.NODE_ENV === NodeEnv.Prod) {
    if (!rootAdminEmail || !rootAdminPassword) {
      throw new Error("Root admin email and password must be set in production environment")
    }
  }

  return {
    nodeEnv: env("NODE_ENV") === NodeEnv.Prod ? NodeEnv.Prod : NodeEnv.Dev,
    jwtSecretKey,
    jwtRefreshSecretKey,
    secretKeyExpiresIn: secretKeyExpiresIn ?? "60 days",
    accessTokenValidityDurationInSec: accessTokenValidityDurationInSec ?? "3600s",
    // Admin defaults with fallbacks for development
    rootAdminEmail: rootAdminEmail ?? "admin@admin.com",
    rootAdminPassword: rootAdminPassword ?? "DevAdmin123!",
    rootAdminFirstName: rootAdminFirstName ?? "Root",
    rootAdminLastName: rootAdminLastName ?? "Administrator",
    appUrl: env("APP_URL") ?? "http://localhost:5173",
    // Mail configuration
    mail: {
      host: env("MAIL_HOST") ?? "localhost",
      port: parseInt(env("MAIL_PORT") ?? "1025"),
      secure: env("MAIL_SECURE") === "true",
      from: env("MAIL_FROM") ?? "noreply@example.com",
    },
    // CORS configuration
    corsOrigin: env("CORS_ORIGIN") ?? "http://localhost:3000",
    corsEnabled: env("CORS_ENABLED") === "true",
    // Rate limiting configuration
    throttlerTtl: parseInt(env("THROTTLER_TTL") ?? "60"),
    throttlerLimit: parseInt(env("THROTTLER_LIMIT") ?? "100"),
    // Cookie configuration
    cookieSecure: env("COOKIE_SECURE") === "true",
    cookieSameSite: env("COOKIE_SAME_SITE") ?? "strict",
    cookieDomain: env("COOKIE_DOMAIN"),
    // Default role assigned to new users on sign-up (matches the role `name` field)
    defaultSignupRole: env("DEFAULT_SIGNUP_ROLE"),
    // Storage configuration
    storage: {
      type: (env("STORAGE_TYPE") ?? "local") as "local" | "s3",
      s3Bucket: env("STORAGE_S3_BUCKET"),
      s3Region: env("STORAGE_S3_REGION"),
      s3BaseUrl: env("STORAGE_S3_BASE_URL"),
    },
  }
}
