import { Result } from '@/shared/business';
import type { IRoleRepository } from '../business';

export class CheckRoleUseCase {
  private readonly roleRepository: IRoleRepository;
  constructor(roleRepository: IRoleRepository) {
    this.roleRepository = roleRepository;
  }

  async execute(userId: string, role: string): Promise<Result<boolean, string>> {
    try {
      const result = await this.roleRepository.checkRole(userId, role);
      if (result.isFailure) return Result.fail(result.error);
      return Result.ok(result.value);
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Role check failed');
    }
  }
}
