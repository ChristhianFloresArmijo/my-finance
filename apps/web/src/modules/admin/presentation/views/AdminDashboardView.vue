<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold">Dashboard</h1>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex flex-col gap-1">
        <span class="text-xs text-gray-500 uppercase tracking-wide">Total Users</span>
        <span class="text-3xl font-bold">{{ isLoadingStats ? '…' : stats.totalUsers }}</span>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex flex-col gap-1">
        <span class="text-xs text-gray-500 uppercase tracking-wide">Active Users</span>
        <span class="text-3xl font-bold text-green-600">{{ isLoadingStats ? '…' : stats.activeUsers }}</span>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex flex-col gap-1">
        <span class="text-xs text-gray-500 uppercase tracking-wide">Total Roles</span>
        <span class="text-3xl font-bold">{{ isLoadingStats ? '…' : stats.totalRoles }}</span>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex flex-col gap-1">
        <span class="text-xs text-gray-500 uppercase tracking-wide">Total Permissions</span>
        <span class="text-3xl font-bold">{{ isLoadingStats ? '…' : stats.totalPermissions }}</span>
      </div>
    </div>

    <!-- Quick nav -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <RouterLink
        v-for="link in quickLinks"
        :key="link.to"
        :to="link.to"
        class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 hover:shadow-md transition text-sm font-medium text-center"
      >
        {{ link.label }}
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAdminMeta } from '../composables/useAdminMeta'

const { stats, isLoadingStats, fetchStats } = useAdminMeta()

const quickLinks = [
  { label: 'Manage Users', to: '/admin/users' },
  { label: 'Manage Roles', to: '/admin/roles' },
  { label: 'Manage Permissions', to: '/admin/permissions' },
  { label: 'Audit Log', to: '/admin/audit' },
]

onMounted(() => fetchStats())
</script>
