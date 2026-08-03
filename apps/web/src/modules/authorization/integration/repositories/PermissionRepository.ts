import { Result } from '@/shared/business';
import { getHttpErrorMessage, type HttpClient } from '@/shared/integration';
import { Permission } from '../../business';
import type { IPermissionRepository } from '../../business';

export class PermissionRepository implements IPermissionRepository {
  private readonly httpClient: HttpClient;
  constructor(httpClient: HttpClient) { this.httpClient = httpClient; }

  async getUserPermissions(userId: string): Promise<Result<Permission[], string>> {
    try {
      const response = await this.httpClient.get<
        Array<{ id: string; resource: string; action: string; description?: string }>
      >(`/authorization/users/${userId}/permissions`);

      const permissions = response.map((p) =>
        Permission.create({ resource: p.resource, action: p.action, description: p.description }, p.id)
      );
      return Result.ok(permissions);
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Failed to get user permissions'));
    }
  }

  async checkPermission(userId: string, permission: string): Promise<Result<boolean, string>> {
    try {
      const response = await this.httpClient.post<{ hasPermission: boolean }>(
        `/authorization/check-permission`, { userId, permission }
      );
      return Result.ok(response.hasPermission);
    } catch (error: unknown) {
      return Result.fail(getHttpErrorMessage(error, 'Permission check failed'));
    }
  }
}
