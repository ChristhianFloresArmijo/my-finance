import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { User } from '../../business';
import type { CurrentUserProfileDto, CurrentUserPreferencesDto } from '../../business';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const profile = ref<CurrentUserProfileDto | null>(null);
  const preferences = ref<CurrentUserPreferencesDto | null>(null);
  const isLoading = ref(false);

  const isAuthenticated = computed(() => !!user.value);

  function setUser(newUser: User | null) {
    user.value = newUser;
  }

  function setProfile(p: CurrentUserProfileDto | null) {
    profile.value = p;
  }

  function setPreferences(p: CurrentUserPreferencesDto | null) {
    preferences.value = p;
  }

  function clearAuth() {
    user.value = null;
    profile.value = null;
    preferences.value = null;
  }

  return {
    user,
    profile,
    preferences,
    isLoading,
    isAuthenticated,
    setUser,
    setProfile,
    setPreferences,
    clearAuth,
  };
});
