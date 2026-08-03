import { Result } from '@/shared/business';
import { getHttpErrorMessage, type HttpClient } from '@/shared/integration';
import { Role } from '../../business';
import type { IRoleRepository } from '../../business';

export class RoleRepository implements IRoleRepository {
  private readonly httpClient: HttpClient;
  constructor(httpClient: HttpClient) { this.httpClient = httpClient; }

  async getUserRoles(userId: string): Promise<Result<Role[], string>> {
    try {
      const response = await this.httpClient.get<
        Array<{ id: string; name: string; display_name: string; description?: string }>
      >(`/authorization/users/${userId}/roles`);

      const roles = response.map((r) =>
        Role.create({ name: r.name, display_name: r.display_name, description: r.description }, r.id)
      );
      return Result.ok(roles);
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Failed to get user roles'));
    }
  }

  async checkRole(userId: string, role: string): Promise<Result<boolean, string>> {
    try {
      const response = await this.httpClient.post<{ hasRole: boolean }>(
        `/authorization/check-role`, { userId, role }
      );
      return Result.ok(response.hasRole);
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Role check failed'));
    }
  }
}
