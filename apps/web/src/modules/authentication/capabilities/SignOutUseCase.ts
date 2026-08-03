import { Result } from '@/shared/business';
import type { IUserRepository } from '../business';

export class SignOutUseCase {
  private readonly userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(): Promise<Result<void, string>> {
    try {
      const result = await this.userRepository.signOut();
      if (result.isFailure) return Result.fail(result.error);
      return Result.ok();
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Sign out failed');
    }
  }
}
