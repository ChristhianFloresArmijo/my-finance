import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/modules/authentication/integration';
import { useAuthorizationStore } from '@/modules/authorization/integration';

const routes: RouteRecordRaw[] = [
  // ─── Public ───────────────────────────────────────────────────────────────
  {
    path: '/',
    name: 'home',
    component: () => import('../modules/home/presentation/views/HomeView.vue'),
  },
  {
    path: '/demo/forms',
    name: 'form-demo',
    component: () => import('../modules/demo/presentation/views/FormDemoView.vue'),
  },
  {
    path: '/demo/authorization',
    name: 'authorization-demo',
    component: () => import('../modules/demo/presentation/views/AuthorizationDemoView.vue'),
  },
  {
    path: '/auth',
    redirect: '/auth/sign-in',
    children: [
      {
        path: 'sign-in',
        name: 'sign-in',
        component: () => import('../modules/authentication/presentation/views/SignInView.vue'),
        meta: { guest: true },
      },
      {
        path: 'sign-up',
        name: 'sign-up',
        component: () => import('../modules/authentication/presentation/views/RegisterView.vue'),
        meta: { guest: true },
      },
      {
        path: 'verify-email',
        name: 'verify-email',
        component: () => import('../modules/authentication/presentation/views/VerifyEmailView.vue'),
        meta: { guest: true },
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('../modules/authentication/presentation/views/ForgotPasswordView.vue'),
        meta: { guest: true },
      },
      {
        path: 'reset-password',
        name: 'reset-password',
        component: () => import('../modules/authentication/presentation/views/ResetPasswordView.vue'),
        meta: { guest: true },
      },
    ],
  },

  // ─── Client portal (wrapped in ClientLayout) ──────────────────────────────
  {
    path: '/',
    component: () => import('../modules/home/presentation/layouts/ClientLayout.vue'),
    meta: { requiresAuth: true, requiresPermission: 'client:access' },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../modules/home/presentation/views/DashboardView.vue'),
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('../modules/account/presentation/views/ProfileView.vue'),
      },
      {
        path: 'security',
        name: 'security',
        component: () => import('../modules/account/presentation/views/SecurityView.vue'),
      },
    ],
  },

  // ─── Admin login ──────────────────────────────────────────────────────────
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('../modules/admin/presentation/views/AdminSignInView.vue'),
    meta: { guest: true },
  },

  // ─── Admin portal (wrapped in AdminLayout) ────────────────────────────────
  {
    path: '/admin',
    component: () => import('../modules/admin/presentation/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresPermission: 'admin:access' },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('../modules/admin/presentation/views/AdminDashboardView.vue'),
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('../modules/admin/presentation/views/UsersListView.vue'),
      },
      {
        path: 'users/:id',
        name: 'admin-user-detail',
        component: () => import('../modules/admin/presentation/views/UserDetailView.vue'),
      },
      {
        path: 'roles',
        name: 'admin-roles',
        component: () => import('../modules/admin/presentation/views/RolesListView.vue'),
      },
      {
        path: 'roles/:id',
        name: 'admin-role-detail',
        component: () => import('../modules/admin/presentation/views/RoleDetailView.vue'),
      },
      {
        path: 'permissions',
        name: 'admin-permissions',
        component: () => import('../modules/admin/presentation/views/PermissionsListView.vue'),
      },
      {
        path: 'audit',
        name: 'admin-audit',
        component: () => import('../modules/admin/presentation/views/AuditLogView.vue'),
      },
      {
        path: 'profile',
        name: 'admin-profile',
        component: () => import('../modules/admin/presentation/views/AdminProfileView.vue'),
      },
    ],
  },

  // ─── Misc ─────────────────────────────────────────────────────────────────
  {
    path: '/users/create',
    name: 'users-create',
    component: () => import('../modules/home/presentation/views/HomeView.vue'),
    meta: {
      requiresAuth: true,
      requiresPermission: 'user:create',
    },
  },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const authorizationStore = useAuthorizationStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    const isAdminRoute = to.path.startsWith('/admin');
    next(isAdminRoute
      ? { name: 'admin-login' }
      : { name: 'sign-in', query: { redirect: to.fullPath } });
    return;
  }

  if (to.meta.guest && authStore.isAuthenticated) {
    const isAdminLogin = to.name === 'admin-login';
    next(isAdminLogin ? { name: 'admin-dashboard' } : { name: 'dashboard' });
    return;
  }

  if (to.meta.requiresPermission) {
    const requiredPermission = to.meta.requiresPermission;
    if (!authorizationStore.hasPermission(requiredPermission)) {
      next({ name: 'home' });
      return;
    }
  }

  next();
});

export default router;
