import { SignInValidationHandler } from "./sign-in-validation"
import { SignInHandler } from "./sign-in"
import { GenerateTokenPairHandler } from "./generate-token-pair"
import { SignOutHandler } from "./sign-out"
import { CleanupTokensHandler } from "./cleanup-tokens"
import { GetCurrentUserHandler } from "./get-current-user"
import { VerifyEmailHandler } from "./verify-email"
import { ForgotPasswordHandler } from "./forgot-password"
import { ResetPasswordHandler } from "./reset-password"
import { ListUserSessionsHandler } from "./list-user-sessions"
import { RevokeSessionHandler } from "./revoke-session"
import { RevokeAllSessionsHandler } from "./revoke-all-sessions"
import { SetupTotpHandler } from "./setup-totp"
import { EnableTotpHandler } from "./enable-totp"
import { DisableTotpHandler } from "./disable-totp"
import { VerifyTotpLoginHandler } from "./verify-totp-login"
import { RegenerateRecoveryCodesHandler } from "./regenerate-recovery-codes"
import { AdminDisable2faHandler } from "./admin-disable-2fa"

export default [
  SignInValidationHandler,
  SignInHandler,
  GenerateTokenPairHandler,
  SignOutHandler,
  CleanupTokensHandler,
  GetCurrentUserHandler,
  VerifyEmailHandler,
  ForgotPasswordHandler,
  ResetPasswordHandler,
  ListUserSessionsHandler,
  RevokeSessionHandler,
  RevokeAllSessionsHandler,
  SetupTotpHandler,
  EnableTotpHandler,
  DisableTotpHandler,
  VerifyTotpLoginHandler,
  RegenerateRecoveryCodesHandler,
  AdminDisable2faHandler,
]
