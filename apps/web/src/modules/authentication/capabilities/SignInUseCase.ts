import { Result } from '@/shared/business';
import type { IUserRepository, SignInDto, TotpPendingDto } from '../business';

export class SignInUseCase {
  private readonly userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(credentials: SignInDto): Promise<Result<TotpPendingDto | null, string>> {
    try {
      const result = await this.userRepository.signIn(credentials);
      if (result.isFailure) return Result.fail(result.error);
      return Result.ok(result.value);
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Sign in failed');
    }
  }
}
