import { Result } from '@/shared/business';
import type { IUserRepository, CurrentUserDto, SignUpDto } from '../business';

export class SignUpUseCase {
  private readonly userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(data: SignUpDto): Promise<Result<CurrentUserDto, string>> {
    try {
      const result = await this.userRepository.signUp(data);
      if (result.isFailure) return Result.fail(result.error);
      return Result.ok(result.value);
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Sign up failed');
    }
  }
}
