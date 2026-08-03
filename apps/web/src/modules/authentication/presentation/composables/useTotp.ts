import { ref, inject } from 'vue';
import { HTTP_CLIENT_KEY } from '@/shared/integration';
import { UserRepository } from '../../integration';
import type { TotpStatusDto } from '../../business';

export function useTotp() {
  const adaptedClient = inject(HTTP_CLIENT_KEY)!;
  const userRepository = new UserRepository(adaptedClient);

  const status = ref<TotpStatusDto | null>(null);
  const statusLoading = ref(false);
  const statusError = ref<string | null>(null);

  const setupUri = ref<string | null>(null);
  const setupLoading = ref(false);
  const setupError = ref<string | null>(null);

  const enableLoading = ref(false);
  const enableError = ref<string | null>(null);
  const recoveryCodes = ref<string[] | null>(null);

  const disableLoading = ref(false);
  const disableError = ref<string | null>(null);

  const regenLoading = ref(false);
  const regenError = ref<string | null>(null);

  async function fetchStatus() {
    statusLoading.value = true;
    statusError.value = null;
    const result = await userRepository.getTotpStatus();
    statusLoading.value = false;
    if (result.isSuccess) {
      status.value = result.value;
    } else {
      statusError.value = result.error;
    }
  }

  async function startSetup() {
    setupLoading.value = true;
    setupError.value = null;
    setupUri.value = null;
    const result = await userRepository.setupTotp();
    setupLoading.value = false;
    if (result.isSuccess) {
      setupUri.value = result.value.uri;
    } else {
      setupError.value = result.error;
    }
  }

  async function enable(code: string): Promise<boolean> {
    enableLoading.value = true;
    enableError.value = null;
    recoveryCodes.value = null;
    const result = await userRepository.enableTotp(code);
    enableLoading.value = false;
    if (result.isSuccess) {
      recoveryCodes.value = result.value.recovery_codes;
      setupUri.value = null;
      await fetchStatus();
      return true;
    } else {
      enableError.value = result.error;
      return false;
    }
  }

  async function disable(code: string): Promise<boolean> {
    disableLoading.value = true;
    disableError.value = null;
    const result = await userRepository.disableTotp(code);
    disableLoading.value = false;
    if (result.isSuccess) {
      await fetchStatus();
      return true;
    } else {
      disableError.value = result.error;
      return false;
    }
  }

  async function regenerateCodes(code: string): Promise<boolean> {
    regenLoading.value = true;
    regenError.value = null;
    recoveryCodes.value = null;
    const result = await userRepository.regenerateRecoveryCodes(code);
    regenLoading.value = false;
    if (result.isSuccess) {
      recoveryCodes.value = result.value.recovery_codes;
      await fetchStatus();
      return true;
    } else {
      regenError.value = result.error;
      return false;
    }
  }

  function clearRecoveryCodes() {
    recoveryCodes.value = null;
  }

  return {
    status,
    statusLoading,
    statusError,
    fetchStatus,

    setupUri,
    setupLoading,
    setupError,
    startSetup,

    enableLoading,
    enableError,
    enable,

    disableLoading,
    disableError,
    disable,

    regenLoading,
    regenError,
    regenerateCodes,

    recoveryCodes,
    clearRecoveryCodes,
  };
}
