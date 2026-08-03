import { Result } from '@/shared/business';
import type { UserProfile } from '../business/entities/UserProfile';
import type { IUserProfileRepository, UpdateProfileDto } from '../business';

export class UpdateProfileUseCase {
  private readonly userProfileRepository: IUserProfileRepository;
  constructor(userProfileRepository: IUserProfileRepository) {
    this.userProfileRepository = userProfileRepository;
  }

  async execute(userId: string, data: UpdateProfileDto): Promise<Result<UserProfile, string>> {
    try {
      const result = await this.userProfileRepository.updateProfile(userId, data);
      if (result.isFailure) return Result.fail(result.error);
      return Result.ok(result.value);
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Profile update failed');
    }
  }
}
