import { computed, inject } from 'vue';
import { HTTP_CLIENT_KEY } from '@/shared/integration';
import { useAuthStore } from '@/modules/authentication/integration';
import { RoleRepository, PermissionRepository, useAuthorizationStore } from '../../integration';

export function useAuthorization() {
  const authStore = useAuthStore();
  const authorizationStore = useAuthorizationStore();

  const adaptedClient = inject(HTTP_CLIENT_KEY)!;
  const roleRepository = new RoleRepository(adaptedClient);
  const permissionRepository = new PermissionRepository(adaptedClient);

  const isLoading = computed(() => authorizationStore.isLoading);
  const permissions = computed(() => authorizationStore.permissions);
  const roles = computed(() => authorizationStore.roles);

  const loadUserAuthorization = async (): Promise<void> => {
    if (!authStore.user) return;

    authorizationStore.isLoading = true;

    try {
      const [permissionsResult, rolesResult] = await Promise.all([
        permissionRepository.getUserPermissions(authStore.user.id),
        roleRepository.getUserRoles(authStore.user.id),
      ]);

      if (permissionsResult.isSuccess) {
        authorizationStore.setPermissions(permissionsResult.value);
      }

      if (rolesResult.isSuccess) {
        authorizationStore.setRoles(rolesResult.value);
      }
    } finally {
      authorizationStore.isLoading = false;
    }
  };

  const can = (permission: string): boolean => authorizationStore.hasPermission(permission);
  const canAny = (perms: string[]): boolean => authorizationStore.hasAnyPermission(perms);
  const canAll = (perms: string[]): boolean => authorizationStore.hasAllPermissions(perms);
  const hasRole = (role: string): boolean => authorizationStore.hasRole(role);
  const hasAnyRole = (roleList: string[]): boolean => authorizationStore.hasAnyRole(roleList);

  return {
    isLoading,
    permissions,
    roles,
    loadUserAuthorization,
    can,
    canAny,
    canAll,
    hasRole,
    hasAnyRole,
  };
}
