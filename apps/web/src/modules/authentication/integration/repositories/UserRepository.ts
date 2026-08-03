import { Result } from '@/shared/business';
import { getHttpErrorMessage, type HttpClient } from '@/shared/integration';
import type { IUserRepository, CurrentUserDto, SessionDto, SignInDto, SignUpDto, TotpPendingDto, TotpStatusDto } from '../../business';

export class UserRepository implements IUserRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async signIn(credentials: SignInDto): Promise<Result<TotpPendingDto | null, string>> {
    try {
      const response = await this.httpClient.post<{ requires_2fa?: boolean; totp_pending_token?: string }>(
        '/auth/sign-in',
        credentials,
      );
      if (response?.requires_2fa && response.totp_pending_token) {
        return Result.ok({ requires_2fa: true, totp_pending_token: response.totp_pending_token });
      }
      return Result.ok(null); // normal sign-in — cookies already set
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Sign in failed'));
    }
  }

  async signIn2fa(pendingToken: string, code: string): Promise<Result<void, string>> {
    try {
      await this.httpClient.post('/auth/2fa/verify-login', { pending_token: pendingToken, code });
      return Result.ok();
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, '2FA verification failed'));
    }
  }

  async getTotpStatus(): Promise<Result<TotpStatusDto, string>> {
    try {
      const response = await this.httpClient.get<TotpStatusDto>('/auth/2fa/status');
      return Result.ok(response);
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Failed to get 2FA status'));
    }
  }

  async setupTotp(): Promise<Result<{ uri: string }, string>> {
    try {
      const response = await this.httpClient.post<{ uri: string }>('/auth/2fa/setup');
      return Result.ok(response);
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, '2FA setup failed'));
    }
  }

  async enableTotp(code: string): Promise<Result<{ recovery_codes: string[] }, string>> {
    try {
      const response = await this.httpClient.post<{ recovery_codes: string[] }>('/auth/2fa/enable', { code });
      return Result.ok(response);
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Failed to enable 2FA'));
    }
  }

  async disableTotp(code: string): Promise<Result<void, string>> {
    try {
      await this.httpClient.post('/auth/2fa/disable', { code });
      return Result.ok();
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Failed to disable 2FA'));
    }
  }

  async regenerateRecoveryCodes(code: string): Promise<Result<{ recovery_codes: string[] }, string>> {
    try {
      const response = await this.httpClient.post<{ recovery_codes: string[] }>('/auth/2fa/recovery-codes/regenerate', { code });
      return Result.ok(response);
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Failed to regenerate recovery codes'));
    }
  }

  async signUp(data: SignUpDto): Promise<Result<CurrentUserDto, string>> {
    try {
      const response = await this.httpClient.post<CurrentUserDto>('/auth/sign-up', data);
      return Result.ok(response);
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Sign up failed'));
    }
  }

  async signOut(): Promise<Result<void, string>> {
    try {
      await this.httpClient.post('/auth/sign-out');
      return Result.ok();
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Sign out failed'));
    }
  }

  async getCurrentUser(): Promise<Result<CurrentUserDto, string>> {
    try {
      const response = await this.httpClient.get<CurrentUserDto>('/auth/me');
      return Result.ok(response);
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Failed to get current user'));
    }
  }

  async verifyEmail(token: string): Promise<Result<void, string>> {
    try {
      await this.httpClient.post('/auth/verify-email', { token });
      return Result.ok();
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Email verification failed'));
    }
  }

  async forgotPassword(email: string): Promise<Result<void, string>> {
    try {
      await this.httpClient.post('/auth/forgot-password', { email });
      return Result.ok();
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Failed to send reset email'));
    }
  }

  async resetPassword(token: string, newPassword: string, repassword: string): Promise<Result<void, string>> {
    try {
      await this.httpClient.post('/auth/reset-password', { token, password: newPassword, repassword });
      return Result.ok();
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Password reset failed'));
    }
  }

  async listSessions(): Promise<Result<SessionDto[], string>> {
    try {
      const response = await this.httpClient.get<SessionDto[]>('/auth/sessions');
      return Result.ok(response);
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Failed to load sessions'));
    }
  }

  async revokeSession(tokenId: string): Promise<Result<void, string>> {
    try {
      await this.httpClient.delete(`/auth/sessions/${tokenId}`);
      return Result.ok();
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Failed to revoke session'));
    }
  }

  async revokeAllSessions(): Promise<Result<void, string>> {
    try {
      await this.httpClient.delete('/auth/sessions');
      return Result.ok();
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Failed to revoke sessions'));
    }
  }
}
