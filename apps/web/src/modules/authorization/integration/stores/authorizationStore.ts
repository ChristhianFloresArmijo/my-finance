import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Permission } from '../../business';
import type { Role } from '../../business';

export const useAuthorizationStore = defineStore('authorization', () => {
  const permissions = ref<Permission[]>([]);
  const roles = ref<Role[]>([]);
  const isLoading = ref(false);

  const permissionNames = computed(() => permissions.value.map((p) => p.name));
  const roleNames = computed(() => roles.value.map((r) => r.name));

  function setPermissions(newPermissions: Permission[]) {
    permissions.value = newPermissions;
  }

  function setRoles(newRoles: Role[]) {
    roles.value = newRoles;
  }

  function hasPermission(permission: string): boolean {
    return permissions.value.some((p) => p.matches(permission));
  }

  function hasRole(role: string): boolean {
    return roleNames.value.includes(role);
  }

  function hasAnyPermission(perms: string[]): boolean {
    return perms.some((p) => hasPermission(p));
  }

  function hasAllPermissions(perms: string[]): boolean {
    return perms.every((p) => hasPermission(p));
  }

  function hasAnyRole(roleList: string[]): boolean {
    return roleList.some((r) => hasRole(r));
  }

  function hasAllRoles(roleList: string[]): boolean {
    return roleList.every((r) => hasRole(r));
  }

  function clearAuthorization() {
    permissions.value = [];
    roles.value = [];
  }

  return {
    permissions,
    roles,
    isLoading,
    permissionNames,
    roleNames,
    setPermissions,
    setRoles,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    hasAllRoles,
    clearAuthorization,
  };
});
