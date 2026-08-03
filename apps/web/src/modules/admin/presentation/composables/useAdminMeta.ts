import { ref, inject } from 'vue'
import { HTTP_CLIENT_KEY } from '@/shared/integration'

export interface EnumOption {
  value: string
  label: string
}

export interface AdminEnums {
  status: EnumOption[]
  permissionScope: EnumOption[]
}

export interface AuditLogEntry {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  performed_by: string | null
  payload: Record<string, unknown> | null
  created_at: string
}

export interface AuditLogPage {
  items: AuditLogEntry[]
  total: number
  limit: number
  offset: number
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalRoles: number
  totalPermissions: number
}

let enumsCache: AdminEnums | null = null

export function useAdminMeta() {
  const enums = ref<AdminEnums>(
    enumsCache ?? { status: [] as EnumOption[], permissionScope: [] as EnumOption[] },
  )
  const stats = ref<AdminStats>({ totalUsers: 0, activeUsers: 0, totalRoles: 0, totalPermissions: 0 })
  const isLoadingEnums = ref(false)
  const isLoadingStats = ref(false)

  const client = inject(HTTP_CLIENT_KEY)!

  async function fetchEnums() {
    if (enumsCache) {
      enums.value = enumsCache
      return
    }
    isLoadingEnums.value = true
    try {
      const data = await client.get<AdminEnums>('/meta/enums')
      enumsCache = data
      enums.value = data
    } catch {
      // fallback — keeps UI working even if endpoint is unavailable
      enums.value = {
        status: [
          { value: 'ACTIVE',    label: 'Active' },
          { value: 'INACTIVE',  label: 'Inactive' },
          { value: 'SUSPENDED', label: 'Suspended' },
          { value: 'PENDING',   label: 'Pending' },
          { value: 'DELETED',   label: 'Deleted' },
        ],
        permissionScope: [
          { value: 'ALL',  label: 'All — any record' },
          { value: 'OWN',  label: 'Own — user\'s own records' },
          { value: 'TEAM', label: 'Team — user\'s team records' },
          { value: 'ORG',  label: 'Org — user\'s org records' },
        ],
      }
    } finally {
      isLoadingEnums.value = false
    }
  }

  async function fetchStats() {
    isLoadingStats.value = true
    try {
      stats.value = await client.get<AdminStats>('/admin/stats')
    } finally {
      isLoadingStats.value = false
    }
  }

  async function fetchAuditLogs(params: {
    limit?: number
    offset?: number
    action?: string
    entity_type?: string
    performed_by?: string
  } = {}): Promise<AuditLogPage> {
    const query = new URLSearchParams()
    if (params.limit !== undefined) query.set('limit', String(params.limit))
    if (params.offset !== undefined) query.set('offset', String(params.offset))
    if (params.action) query.set('action', params.action)
    if (params.entity_type) query.set('entity_type', params.entity_type)
    if (params.performed_by) query.set('performed_by', params.performed_by)
    const qs = query.toString()
    return client.get<AuditLogPage>(`/admin/audit${qs ? `?${qs}` : ''}`)
  }

  return { enums, stats, isLoadingEnums, isLoadingStats, fetchEnums, fetchStats, fetchAuditLogs }
}
