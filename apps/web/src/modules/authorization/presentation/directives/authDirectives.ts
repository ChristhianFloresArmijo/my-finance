import type { DirectiveBinding } from 'vue';
import { useAuthorizationStore } from '@/modules/authorization/integration';

/**
 * v-can directive — shows element only if the user has the given permission.
 * Usage: v-can="'user:create'"
 */
export const vCan = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
    const authorizationStore = useAuthorizationStore();
    if (!authorizationStore.hasPermission(binding.value)) {
      el.style.display = 'none';
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string>) {
    const authorizationStore = useAuthorizationStore();
    el.style.display = authorizationStore.hasPermission(binding.value) ? '' : 'none';
  },
};

/**
 * v-role directive — shows element only if the user has the given role.
 * Usage: v-role="'admin'"
 */
export const vRole = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
    const authorizationStore = useAuthorizationStore();
    if (!authorizationStore.hasRole(binding.value)) {
      el.style.display = 'none';
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string>) {
    const authorizationStore = useAuthorizationStore();
    el.style.display = authorizationStore.hasRole(binding.value) ? '' : 'none';
  },
};
