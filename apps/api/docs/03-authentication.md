# Authentication — Backend

## Overview

Authentication uses **HTTP-only cookies** for access and refresh tokens. No tokens are exposed to JavaScript on the client. The flow:

1. `POST /auth/sign-in` → validates credentials → issues `accessToken` + `refreshToken` cookies
2. All subsequent requests send cookies automatically
3. When `accessToken` expires, `POST /auth/refresh` rotates both cookies
4. `POST /auth/sign-out` clears cookies and deletes the refresh token from DB

---

## JWT Setup

Two JWT secrets are required:

| Config key | Env var | Used for |
|---|---|---|
| `jwtSecretKey` | `JWT_SECRET_KEY` | Access tokens |
| `jwtRefreshSecretKey` | `JWT_REFRESH_SECRET_KEY` | Refresh tokens |

Expiry:

| Config key | Env var | Default |
|---|---|---|
| `secretKeyExpiresIn` | `ACCESS_TOKEN_VALIDITY_DURATION_IN_SEC` | 900 (15 min) |
| `refreshTokenExpiresIn` | `REFRESH_TOKEN_VALIDITY_DURATION_IN_SEC` | 604800 (7 days) |

Cookies are `httpOnly: true`. The `secure`, `sameSite`, and `domain` options are driven by `nodeEnv`, `cookieSecure`, `cookieSameSite`, and `cookieDomain` config values.

---

## Passport Strategies

Three strategies are registered:

| Strategy | File | Used by |
|---|---|---|
| `local` | `integration/strategies/local.strategy.ts` | `LocalAuthGuard` on `POST /sign-in` |
| `jwt` | `integration/strategies/jwt.strategy.ts` | `JwtAuthGuard` on protected routes |
| `jwt-refresh` | `integration/strategies/jwt-refresh.strategy.ts` | `POST /auth/refresh` |

The JWT strategy reads `accessToken` from `req.cookies`, not the `Authorization` header.

---

## Guards and Decorators

```typescript
// Require a valid JWT on any route (used on most protected endpoints)
@UseGuards(JwtAuthGuard)

// Require a specific role (always pair with JwtAuthGuard)
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRole('superadmin')

// Require a specific permission
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('user:create')

// Mark a route as public (skips JwtAuthGuard)
@Public()

// Inject the authenticated user into a parameter
@CurrentUser() user: CurrentUserDto
```

`@Public()` sets route metadata that `JwtAuthGuard` reads before verifying the token.

---

## 2FA / TOTP Implementation

TOTP is implemented with **pure Node.js `crypto`** (no external packages) — RFC 6238 with HMAC-SHA1, 30-second windows, ±1 window clock skew, base32 encode/decode inline.

### Setup flow

```
POST /auth/2fa/setup    → TotpService.generateSecret() → returns { secret, otpauth_url }
POST /auth/2fa/enable   → TotpService.verify(secret, code) → if valid, enable and return recovery codes
```

### Sign-in flow when 2FA is enabled

```
POST /auth/sign-in
  → if totp_enabled: return { requires_2fa: true, totp_pending_token }
  → NO cookies issued yet

POST /auth/2fa/verify-login { pending_token, code }
  → JwtService.verify(pending_token, secretKey + ':totp_pending')
  → TotpService.verify(secret, code) OR check recovery codes
  → if valid: issue accessToken + refreshToken cookies
```

The pending token is signed with `JWT_SECRET_KEY + ":totp_pending"` so `JwtAuthGuard` rejects it on any other endpoint.

### Recovery codes

8 × 10-char hex codes. Generated at `enable` time, bcrypt-hashed and stored in `user_recovery_codes`. Using a code marks it `used_at` (not deleted) — the audit trail is preserved. Codes can be regenerated via `POST /auth/2fa/regenerate-codes`.

---

## Token Refresh

`POST /auth/refresh` is guarded by `JwtRefreshGuard` (reads `refreshToken` cookie). On success:
1. Validates the refresh token exists and is `ACTIVE` in DB
2. Deletes the old refresh token (rotation)
3. Issues new access + refresh token cookies

---

## Email Flows

`MailService` (in `shared/integration/services`) sends transactional email via Nodemailer. Templates live inline in the service. MailHog is the local SMTP target.

| Flow | Trigger |
|---|---|
| Email verification | After sign-up |
| Password reset | `POST /auth/forgot-password` |
