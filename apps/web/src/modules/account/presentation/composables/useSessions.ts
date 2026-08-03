import { ref, inject } from 'vue';
import { HTTP_CLIENT_KEY } from '@/shared/integration';
import { UserRepository } from '@/modules/authentication/integration';
import type { SessionDto } from '@/modules/authentication/business';

export function useSessions() {
  const adaptedClient = inject(HTTP_CLIENT_KEY)!;
  const userRepository = new UserRepository(adaptedClient);

  const sessions = ref<SessionDto[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const revokeLoadingId = ref<string | null>(null);
  const revokeError = ref<string | null>(null);

  async function loadSessions() {
    loading.value = true;
    error.value = null;
    const result = await userRepository.listSessions();
    loading.value = false;
    if (result.isSuccess) {
      sessions.value = result.value;
    } else {
      error.value = result.error;
    }
  }

  async function revokeSession(id: string) {
    revokeLoadingId.value = id;
    revokeError.value = null;
    const result = await userRepository.revokeSession(id);
    revokeLoadingId.value = null;
    if (result.isSuccess) {
      sessions.value = sessions.value.filter(s => s.id !== id);
    } else {
      revokeError.value = result.error;
    }
  }

  async function revokeAllSessions() {
    loading.value = true;
    revokeError.value = null;
    const result = await userRepository.revokeAllSessions();
    loading.value = false;
    if (result.isSuccess) {
      sessions.value = [];
    } else {
      revokeError.value = result.error;
    }
  }

  return {
    sessions,
    loading,
    error,
    revokeLoadingId,
    revokeError,
    loadSessions,
    revokeSession,
    revokeAllSessions,
  };
}
