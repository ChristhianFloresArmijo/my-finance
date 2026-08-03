export interface RoleDto {
  id: string
  name: string
  display_name: string
  description: string | null
  is_system: boolean
  status: string
  created_at?: string
  updated_at?: string | null
}

/**
 * What GET /roles/:id/permissions actually returns from the backend.
 * The backend RolePermission entity only has role_id + permission_id.
 * Cross-reference with AdminPermissionListItem to get resource/action/scope.
 */
export interface RolePermissionAssignment {
  id: string
  role_id: string
  permission_id: string
  status: string
  created_at: string
  updated_at: string | null
}

/** @deprecated — use RolePermissionAssignment. Kept for backward compat. */
export interface RolePermissionDto {
  id: string
  resource: string
  action: string
  scope: string
  description: string | null
}
