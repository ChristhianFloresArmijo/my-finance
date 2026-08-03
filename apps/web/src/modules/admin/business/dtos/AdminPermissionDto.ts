/** Shape returned by GET /permissions (list endpoint) */
export interface AdminPermissionListItem {
  id: string
  resource: string
  action: string
  scope: string        // 'ALL' | 'OWN' | 'TEAM' | 'ORG'
  description: string | null
  is_system: boolean
  status: string
  created_at?: string
  updated_at?: string | null
}

/** Body for POST /permissions */
export interface CreatePermissionDto {
  resource: string
  action: string
  scope?: string       // defaults to 'ALL'
  description?: string
}

/** What GET /user-permissions/:userId/permissions returns */
export interface UserDirectPermissionItem {
  id: string
  user_id: string
  permission_id: string
  status: string
  assigned_at: string | null
  expires_at: string | null
}
