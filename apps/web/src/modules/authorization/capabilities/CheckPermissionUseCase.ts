import { Result } from '@/shared/business';
import type { IPermissionRepository } from '../business';

export class CheckPermissionUseCase {
  private readonly permissionRepository: IPermissionRepository;
  constructor(permissionRepository: IPermissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  async execute(userId: string, permission: string): Promise<Result<boolean, string>> {
    try {
      const result = await this.permissionRepository.checkPermission(userId, permission);
      if (result.isFailure) return Result.fail(result.error);
      return Result.ok(result.value);
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Permission check failed');
    }
  }
}
