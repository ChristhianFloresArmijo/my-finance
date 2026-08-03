import type { Result } from '@/shared/business';
import type { SignInDto, SignUpDto } from '../schemas/AuthSchemas';

/** Mirrors the backend's CurrentUserDto */
export interface CurrentUserRoleDto {
  id: string;
  name: string;
  display_name: string;
}

export interface CurrentUserPermissionDto {
  id: string;
  resource: string;
  action: string;
  scope: string; // 'ALL' | 'OWN' | 'TEAM' | 'ORG'
  description: string | null;
}

export interface CurrentUserProfileDto {
  avatar: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
}

export interface CurrentUserPreferencesDto {
  theme: string;
  language: string;
  timezone: string;
  notify_email: boolean;
  notify_push: boolean;
  notify_sms: boolean;
}

export interface CurrentUserDto {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  roles: CurrentUserRoleDto[];
  permissions: CurrentUserPermissionDto[];
  profile: CurrentUserProfileDto | null;
  preferences: CurrentUserPreferencesDto | null;
}

/** Mirrors the backend's RefreshTokenDto — used by the sessions list */
export interface SessionDto {
  id: string;
  created_at: string;
  expires_at: string;
}

/** Returned by signIn when the server asks for a 2FA code before issuing cookies */
export interface TotpPendingDto {
  requires_2fa: true;
  totp_pending_token: string;
}

export interface TotpStatusDto {
  totp_enabled: boolean;
  totp_enabled_at: string | null;
  recovery_codes_remaining: number;
}

export interface IUserRepository {
  signIn(credentials: SignInDto): Promise<Result<TotpPendingDto | null, string>>;
  signIn2fa(pendingToken: string, code: string): Promise<Result<void, string>>;
  getTotpStatus(): Promise<Result<TotpStatusDto, string>>;
  setupTotp(): Promise<Result<{ uri: string }, string>>;
  enableTotp(code: string): Promise<Result<{ recovery_codes: string[] }, string>>;
  disableTotp(code: string): Promise<Result<void, string>>;
  regenerateRecoveryCodes(code: string): Promise<Result<{ recovery_codes: string[] }, string>>;
  signUp(data: SignUpDto): Promise<Result<CurrentUserDto, string>>;
  signOut(): Promise<Result<void, string>>;
  getCurrentUser(): Promise<Result<CurrentUserDto, string>>;
  verifyEmail(token: string): Promise<Result<void, string>>;
  forgotPassword(email: string): Promise<Result<void, string>>;
  resetPassword(token: string, newPassword: string, repassword: string): Promise<Result<void, string>>;
  listSessions(): Promise<Result<SessionDto[], string>>;
  revokeSession(tokenId: string): Promise<Result<void, string>>;
  revokeAllSessions(): Promise<Result<void, string>>;
}
