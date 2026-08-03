import type { Result } from '@/shared/business';
import type { Permission } from '../entities/Permission';
import type { Role } from '../entities/Role';

export interface IAuthorizationRepository {
  getUserPermissions(userId: string): Promise<Result<Permission[], string>>;
  getUserRoles(userId: string): Promise<Result<Role[], string>>;
  checkPermission(userId: string, permission: string): Promise<Result<boolean, string>>;
  checkRole(userId: string, role: string): Promise<Result<boolean, string>>;
}
