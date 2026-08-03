<template>
  <div class="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
    <div class="mx-auto max-w-4xl px-4">
      <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Authorization Demo</h1>
      <p class="mb-8 text-gray-600 dark:text-gray-400">
        Role-Based Access Control using <code>v-can</code> and <code>v-role</code> directives.
      </p>

      <Card class="mb-6">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Current Authorization State
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Roles:</p>
            <div class="flex flex-wrap gap-2">
              <Badge
                v-for="role in authorizationStore.roleNames"
                :key="role"
                variant="primary"
              >
                {{ role }}
              </Badge>
              <span
                v-if="authorizationStore.roleNames.length === 0"
                class="text-sm text-gray-400 dark:text-gray-500"
              >
                No roles assigned
              </span>
            </div>
          </div>
          <div>
            <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Permissions:</p>
            <div class="flex flex-wrap gap-2">
              <Badge
                v-for="perm in authorizationStore.permissionNames"
                :key="perm"
                variant="success"
              >
                {{ perm }}
              </Badge>
              <span
                v-if="authorizationStore.permissionNames.length === 0"
                class="text-sm text-gray-400 dark:text-gray-500"
              >
                No permissions assigned
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card class="mb-6">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">v-can Directive</h2>
        <div class="space-y-3">
          <div
            v-can="'user:create'"
            class="rounded border border-green-200 bg-green-50 p-3 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
          >
            Visible with <code>user:create</code> permission
          </div>
          <div
            v-can="'user:delete'"
            class="rounded border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
          >
            Visible with <code>user:delete</code> permission
          </div>
          <div
            v-can="'*:*'"
            class="rounded border border-purple-200 bg-purple-50 p-3 text-purple-800 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
          >
            Visible with wildcard <code>*:*</code> permission (super admin)
          </div>
        </div>
      </Card>

      <Card class="mb-6">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">v-role Directive</h2>
        <div class="space-y-3">
          <div
            v-role="'admin'"
            class="rounded border border-blue-200 bg-blue-50 p-3 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
          >
            Visible to <code>admin</code> role only
          </div>
          <div
            v-role="'moderator'"
            class="rounded border border-yellow-200 bg-yellow-50 p-3 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
          >
            Visible to <code>moderator</code> role only
          </div>
        </div>
      </Card>

      <Card>
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Usage</h2>
        <pre
          class="overflow-auto rounded bg-gray-100 p-4 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        >{{ codeExample }}</pre>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthorizationStore } from '@/modules/authorization/integration'
import { Badge, Card } from '@/shared/presentation/components/ui'

const authorizationStore = useAuthorizationStore()

const codeExample = `<!-- Show element only if user has the permission -->
<button v-can="'user:create'">Create User</button>

<!-- Show element only if user has the role -->
<nav v-role="'admin'">Admin Panel</nav>

<!-- Programmatic check via composable -->
import { useAuthorization } from '@/modules/authorization/presentation/composables';

const { can, hasRole } = useAuthorization();

if (can('user:create')) { ... }
if (hasRole('admin')) { ... }`
</script>
