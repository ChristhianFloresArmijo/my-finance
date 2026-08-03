import type { Result } from '@/shared/business';
import type { Role } from '../entities/Role';

export interface IRoleRepository {
  getUserRoles(userId: string): Promise<Result<Role[], string>>;
  checkRole(userId: string, role: string): Promise<Result<boolean, string>>;
}
