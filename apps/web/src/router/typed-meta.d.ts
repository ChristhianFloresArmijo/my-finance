import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /** Route requires an authenticated session. Unauthenticated users are redirected to the nearest sign-in page. */
    requiresAuth?: boolean;
    /** Route is only accessible to unauthenticated users (sign-in, sign-up). Authenticated users are redirected away. */
    guest?: boolean;
    /** Permission key that the current user must hold to access this route (e.g. 'admin:access', 'client:access'). */
    requiresPermission?: string;
  }
}
