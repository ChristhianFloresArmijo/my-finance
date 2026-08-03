import type { Result } from '@/shared/business';
import type { Permission } from '../entities/Permission';

export interface IPermissionRepository {
  getUserPermissions(userId: string): Promise<Result<Permission[], string>>;
  checkPermission(userId: string, permission: string): Promise<Result<boolean, string>>;
}
