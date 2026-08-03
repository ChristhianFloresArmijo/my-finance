import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { initTheme } from '@/shared/presentation/composables/useTheme';
import { VueQueryPlugin } from '@tanstack/vue-query';
import router from './router';
import App from './App.vue';
import './styles/main.css';

import { vCan, vRole } from '@/modules/authorization/presentation/directives';
import { useAuthStore } from '@/modules/authentication/integration/stores/authStore';
import { useAuthorizationStore } from '@/modules/authorization/integration/stores/authorizationStore';
import { User } from '@/modules/authentication/business/entities/User';
import { Role } from '@/modules/authorization/business/entities/Role';
import { Permission } from '@/modules/authorization/business/entities/Permission';
import { config } from '@/config';
import type { CurrentUserDto } from '@/modules/authentication/business';
import {
  AxiosHttpClient,
  BackendAdapterFactory,
  AdaptedHttpClient,
  HTTP_CLIENT_KEY,
} from '@/shared/integration';

// ─── Singleton HTTP client ─────────────────────────────────────────────────
// Created once here; provided to the entire app via Vue's DI system.
// All composables inject this instead of constructing their own instances.
export const httpClient = new AdaptedHttpClient(
  new AxiosHttpClient(config.api.baseUrl),
  BackendAdapterFactory.create(config.backend.type),
);

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.provide(HTTP_CLIENT_KEY, httpClient);

/**
 * Rehydrate auth state from HTTP-only cookie before the first router navigation.
 * Uses the singleton httpClient so TransformInterceptor envelope unwrapping is applied.
 */
async function initAuth(): Promise<void> {
  try {
    const dto = await httpClient.get<CurrentUserDto>('/auth/me');

    const authStore = useAuthStore();
    const authorizationStore = useAuthorizationStore();

    authStore.setUser(
      User.create(
        {
          first_name: dto.first_name,
          last_name: dto.last_name,
          email: dto.email,
          status: dto.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
          created_at: new Date(dto.created_at),
        },
        dto.id,
      ),
    );

    authorizationStore.setRoles(
      dto.roles.map((r) => Role.create({ name: r.name, display_name: r.display_name }, r.id)),
    );

    authorizationStore.setPermissions(
      dto.permissions.map((p) =>
        Permission.create({ resource: p.resource, action: p.action, description: p.description }, p.id),
      ),
    );
  } catch {
    // No valid session — stores stay empty, router will redirect to sign-in as needed
  }
}

// Apply saved theme before first render to avoid flash
initTheme();

initAuth().then(() => {
  app.use(router);
  app.use(VueQueryPlugin);
  app.directive('can', vCan);
  app.directive('role', vRole);
  app.mount('#app');
});
