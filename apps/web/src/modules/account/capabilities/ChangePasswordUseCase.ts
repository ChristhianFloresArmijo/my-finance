import { Result } from '@/shared/business';
import type { IUserProfileRepository, ChangePasswordDto } from '../business';

export class ChangePasswordUseCase {
  private readonly userProfileRepository: IUserProfileRepository;
  constructor(userProfileRepository: IUserProfileRepository) {
    this.userProfileRepository = userProfileRepository;
  }

  async execute(userId: string, data: ChangePasswordDto): Promise<Result<void, string>> {
    try {
      const result = await this.userProfileRepository.changePassword(userId, data);
      if (result.isFailure) return Result.fail(result.error);
      return Result.ok();
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Password change failed');
    }
  }
}
