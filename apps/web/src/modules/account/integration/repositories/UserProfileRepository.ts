import { Result } from '@/shared/business';
import { getHttpErrorMessage, type HttpClient } from '@/shared/integration';
import { UserProfile } from '../../business/entities/UserProfile';
import type { IUserProfileRepository, UpdateProfileDto, ChangePasswordDto, UpdatePreferencesDto } from '../../business';

interface ProfileResponse {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
}

export class UserProfileRepository implements IUserProfileRepository {
  private readonly httpClient: HttpClient;
  constructor(httpClient: HttpClient) { this.httpClient = httpClient; }

  async getProfile(userId: string): Promise<Result<UserProfile, string>> {
    try {
      const r = await this.httpClient.get<ProfileResponse>(`/account/${userId}`);
      return Result.ok(UserProfile.create(
        { first_name: r.first_name, last_name: r.last_name, full_name: r.full_name, email: r.email },
        r.id
      ));
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Failed to get profile'));
    }
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<Result<UserProfile, string>> {
    try {
      const r = await this.httpClient.put<ProfileResponse>(`/account/${userId}`, data);
      return Result.ok(UserProfile.create(
        { first_name: r.first_name, last_name: r.last_name, full_name: r.full_name, email: r.email },
        r.id
      ));
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Profile update failed'));
    }
  }

  async changePassword(userId: string, data: ChangePasswordDto): Promise<Result<void, string>> {
    try {
      await this.httpClient.post(`/account/${userId}/password`, data);
      return Result.ok();
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Password change failed'));
    }
  }

  async uploadAvatar(userId: string, file: File): Promise<Result<string, string>> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const r = await this.httpClient.post<{ avatar: string }>(
        `/account/${userId}/avatar`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return Result.ok(r.avatar);
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Avatar upload failed'));
    }
  }

  async deleteAvatar(userId: string): Promise<Result<void, string>> {
    try {
      await this.httpClient.delete(`/account/${userId}/avatar`);
      return Result.ok();
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Avatar deletion failed'));
    }
  }

  async updatePreferences(userId: string, data: UpdatePreferencesDto): Promise<Result<void, string>> {
    try {
      await this.httpClient.put(`/account/${userId}/preferences`, data);
      return Result.ok();
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Preferences update failed'));
    }
  }

  async deleteAccount(userId: string, password: string): Promise<Result<void, string>> {
    try {
      await this.httpClient.post(`/account/${userId}/delete`, { password });
      return Result.ok();
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Account deletion failed'));
    }
  }
}
