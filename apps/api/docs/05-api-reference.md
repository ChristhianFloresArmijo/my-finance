# API Reference

Base URL: `http://localhost:3000/api`  
Interactive docs: `http://localhost:3000/reference` (Scalar UI)

Auth: all endpoints set/read **HTTP-only cookies** (`accessToken`, `refreshToken`). No `Authorization` header needed for cookie-based clients.

---

## Auth

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/auth/sign-up` | No | Create account; sets cookies |
| POST | `/auth/sign-in` | No | Sign in; sets cookies or returns `requires_2fa` |
| POST | `/auth/sign-out` | Yes | Clear cookies; delete refresh token from DB |
| POST | `/auth/refresh` | Cookie | Rotate access + refresh tokens |
| GET  | `/auth/me` | Yes | Current user with roles + permissions |
| POST | `/auth/verify-email` | No | Verify email with token from email link |
| POST | `/auth/forgot-password` | No | Send password reset email |
| POST | `/auth/reset-password` | No | Reset password with token from email |

### 2FA

| Method | Path | Auth | Description |
|---|---|---|---|
| GET  | `/auth/2fa/status` | Yes | `{ totp_enabled, totp_enabled_at, recovery_codes_remaining }` |
| POST | `/auth/2fa/setup` | Yes | Generate TOTP secret; returns `{ secret, otpauth_url }` |
| POST | `/auth/2fa/enable` | Yes | Body: `{ code }` — verify code, enable 2FA, return recovery codes |
| POST | `/auth/2fa/disable` | Yes | Body: `{ code }` — disable 2FA (TOTP code or recovery code) |
| POST | `/auth/2fa/verify-login` | No | Body: `{ pending_token, code }` — complete sign-in after 2FA prompt |
| POST | `/auth/2fa/regenerate-codes` | Yes | Body: `{ code }` — generate 8 new recovery codes |

### Sign-in response (2FA enabled)

```json
{
  "requires_2fa": true,
  "totp_pending_token": "<short-lived JWT>"
}
```

No cookies are set. Send the token + TOTP code to `/auth/2fa/verify-login`.

---

## Account

| Method | Path | Auth | Description |
|---|---|---|---|
| GET    | `/account/profile` | Yes | Current user profile |
| PATCH  | `/account/profile` | Yes | Update profile fields |
| PATCH  | `/account/password` | Yes | Change password (requires `current_password`) |
| POST   | `/account/avatar` | Yes | Upload avatar (multipart/form-data) |
| DELETE | `/account/avatar` | Yes | Remove avatar |
| GET    | `/account/preferences` | Yes | Load preferences |
| PATCH  | `/account/preferences` | Yes | Update preferences |
| GET    | `/account/sessions` | Yes | List own sessions |
| DELETE | `/account/sessions/:id` | Yes | Revoke one session |
| DELETE | `/account/sessions` | Yes | Revoke all sessions |

---

## Admin — Users

All admin endpoints require `superadmin` role.

| Method | Path | Description |
|---|---|---|
| GET    | `/admin/users` | Paginated user list |
| POST   | `/admin/users` | Create user |
| GET    | `/admin/users/:id` | Get user by ID |
| PATCH  | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Soft-delete user |
| PATCH  | `/admin/users/:id/status` | Toggle status (`ACTIVE`/`INACTIVE`/`SUSPENDED`) |
| GET    | `/admin/users/:id/sessions` | List user sessions |
| GET    | `/admin/users/:id/2fa-status` | User 2FA status |
| DELETE | `/admin/users/:id/2fa` | Force-disable user 2FA |

---

## Admin — Roles and Permissions

| Method | Path | Description |
|---|---|---|
| GET    | `/admin/roles` | List roles |
| POST   | `/admin/roles` | Create role |
| PATCH  | `/admin/roles/:id` | Update role |
| DELETE | `/admin/roles/:id` | Delete role |
| POST   | `/admin/roles/:id/permissions` | Assign permission to role |
| DELETE | `/admin/roles/:id/permissions/:pid` | Remove permission from role |
| POST   | `/admin/users/:id/roles` | Assign role to user |
| DELETE | `/admin/users/:id/roles/:rid` | Revoke role from user |
| GET    | `/admin/permissions` | List permissions |
| POST   | `/admin/permissions` | Create permission |
| DELETE | `/admin/permissions/:id` | Delete permission |

---

## Admin — Stats

| Method | Path | Description |
|---|---|---|
| GET | `/admin/stats` | Dashboard counts (users, roles, permissions) |

---

## Meta

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/meta/enums` | Yes | `{ status, permissionScope }` as `{ value, label }[]` — i18n-ready labels for frontend dropdowns |
