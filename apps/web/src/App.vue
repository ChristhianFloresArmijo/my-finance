<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { RouterView, useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

function handleSessionExpired() {
  // Use the router (SPA navigation, no page reload) so initAuth() doesn't re-run.
  // Redirect to the appropriate sign-in page based on the current route.
  const isAdminRoute = route.path.startsWith('/admin');
  router.push(isAdminRoute ? '/admin/login' : '/auth/sign-in');
}

onMounted(() => {
  window.addEventListener('auth:session-expired', handleSessionExpired);
});

onUnmounted(() => {
  window.removeEventListener('auth:session-expired', handleSessionExpired);
});
</script>
