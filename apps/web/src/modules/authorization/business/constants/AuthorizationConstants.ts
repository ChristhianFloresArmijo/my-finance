export const Permissions = {
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ALL: 'user:*',

  ROLE_READ: 'role:read',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_ALL: 'role:*',

  PERMISSION_READ: 'permission:read',
  PERMISSION_CREATE: 'permission:create',
  PERMISSION_UPDATE: 'permission:update',
  PERMISSION_DELETE: 'permission:delete',
  PERMISSION_ALL: 'permission:*',

  POST_READ: 'post:read',
  POST_CREATE: 'post:create',
  POST_UPDATE: 'post:update',
  POST_DELETE: 'post:delete',
  POST_ALL: 'post:*',

  ALL: '*:*',
} as const;

export const Roles = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
  GUEST: 'guest',
} as const;
