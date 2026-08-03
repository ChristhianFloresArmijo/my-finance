/** Shape returned by GET /account (list endpoint — User entity fields only, no RBAC) */
export interface AdminUserListItem {
  id: string
  first_name: string
  last_name: string
  email: string
  status: string
  created_at: string
}

/** Shape returned by GET /account/:id (findCurrent — full RBAC included) */
export type AdminUserDetail = import('@/modules/authentication/business').CurrentUserDto
