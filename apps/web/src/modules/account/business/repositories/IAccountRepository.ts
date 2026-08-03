import type { Result } from '@/shared/business';
import type { User } from '@/modules/authentication/business';
import type { UpdateProfileDto, ChangePasswordDto, UpdatePreferencesDto } from '../schemas/AccountSchemas';

export interface IAccountRepository {
  getProfile(userId: string): Promise<Result<User, string>>;
  updateProfile(userId: string, data: UpdateProfileDto): Promise<Result<User, string>>;
  changePassword(userId: string, data: ChangePasswordDto): Promise<Result<void, string>>;
  uploadAvatar(userId: string, file: File): Promise<Result<string, string>>;
  deleteAvatar(userId: string): Promise<Result<void, string>>;
  updatePreferences(userId: string, data: UpdatePreferencesDto): Promise<Result<void, string>>;
  deleteAccount(userId: string, password: string): Promise<Result<void, string>>;
}
