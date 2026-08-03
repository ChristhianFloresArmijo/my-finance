<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ total.toLocaleString() }} total entries
      </span>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <input
        v-model="filterAction"
        type="text"
        placeholder="Filter by action…"
        class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
        @change="reload"
      />
      <input
        v-model="filterEntityType"
        type="text"
        placeholder="Entity type…"
        class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-40"
        @change="reload"
      />
      <input
        v-model="filterPerformedBy"
        type="text"
        placeholder="Performed by (UUID)…"
        class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-52"
        @change="reload"
      />
      <button
        class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        @click="clearFilters"
      >
        Clear
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400"
    >
      {{ error }}
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
      <div v-if="isLoading" class="p-8 text-center text-sm text-gray-400">Loading…</div>
      <div v-else-if="!items.length" class="p-8 text-center text-sm text-gray-400">
        No audit log entries found.
      </div>
      <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Timestamp
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Action
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Entity
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Entity ID
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Performed By
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Payload
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="entry in items"
            :key="entry.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono">
              {{ formatDate(entry.created_at) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="actionClass(entry.action)"
              >
                {{ entry.action }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
              {{ entry.entity_type }}
            </td>
            <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">
              {{ entry.entity_id ? truncate(entry.entity_id) : '—' }}
            </td>
            <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">
              {{ entry.performed_by ? truncate(entry.performed_by) : '—' }}
            </td>
            <td class="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 max-w-xs truncate">
              {{ entry.payload ? JSON.stringify(entry.payload) : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="total > pageSize" class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
      <span>Showing {{ offset + 1 }}–{{ Math.min(offset + pageSize, total) }} of {{ total }}</span>
      <div class="flex gap-2">
        <button
          :disabled="offset === 0"
          class="rounded px-3 py-1 border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
          @click="prevPage"
        >
          ← Previous
        </button>
        <button
          :disabled="offset + pageSize >= total"
          class="rounded px-3 py-1 border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
          @click="nextPage"
        >
          Next →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminMeta, type AuditLogEntry } from '../composables/useAdminMeta'

const { fetchAuditLogs } = useAdminMeta()

const items = ref<AuditLogEntry[]>([])
const total = ref(0)
const isLoading = ref(false)
const error = ref<string | null>(null)

const pageSize = 50
const offset = ref(0)
const filterAction = ref('')
const filterEntityType = ref('')
const filterPerformedBy = ref('')

async function load() {
  isLoading.value = true
  error.value = null
  try {
    const page = await fetchAuditLogs({
      limit: pageSize,
      offset: offset.value,
      action: filterAction.value || undefined,
      entity_type: filterEntityType.value || undefined,
      performed_by: filterPerformedBy.value || undefined,
    })
    items.value = page.items
    total.value = page.total
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load audit log'
  } finally {
    isLoading.value = false
  }
}

function reload() {
  offset.value = 0
  load()
}

function clearFilters() {
  filterAction.value = ''
  filterEntityType.value = ''
  filterPerformedBy.value = ''
  reload()
}

function prevPage() {
  offset.value = Math.max(0, offset.value - pageSize)
  load()
}

function nextPage() {
  offset.value += pageSize
  load()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

function truncate(s: string, n = 12) {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

function actionClass(action: string) {
  if (action.startsWith('create')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (action.startsWith('delete')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  if (action.startsWith('update') || action.startsWith('change')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  if (action.startsWith('assign') || action.startsWith('revoke')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

onMounted(load)
</script>
