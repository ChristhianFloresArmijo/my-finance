import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';
import { Result } from '@/shared/business';
import type { UserProfile } from '../../business/entities/UserProfile';
import { useAuthStore } from '@/modules/authentication/integration';
import { HTTP_CLIENT_KEY } from '@/shared/integration';
import { UserProfileRepository } from '../../integration';
import { UpdateProfileUseCase, ChangePasswordUseCase } from '../../capabilities';
import type { UpdateProfileDto, ChangePasswordDto, UpdatePreferencesDto } from '../../business';

export function useAccount() {
  const router = useRouter();
  const authStore = useAuthStore();
  const error = ref<string | null>(null);
  const isLoading = ref(false);
  const avatarUrl = ref<string | null>(null);

  const adaptedClient = inject(HTTP_CLIENT_KEY)!;
  const userProfileRepository = new UserProfileRepository(adaptedClient);

  const updateProfileUseCase = new UpdateProfileUseCase(userProfileRepository);
  const changePasswordUseCase = new ChangePasswordUseCase(userProfileRepository);

  const updateProfile = async (data: UpdateProfileDto): Promise<Result<UserProfile, string>> => {
    if (!authStore.user) return Result.fail('User not authenticated');

    error.value = null;
    isLoading.value = true;

    try {
      const result = await updateProfileUseCase.execute(authStore.user.id, data);
      if (result.isFailure) error.value = result.error;
      return result;
    } finally {
      isLoading.value = false;
    }
  };

  const changePassword = async (data: ChangePasswordDto): Promise<Result<void, string>> => {
    if (!authStore.user) return Result.fail('User not authenticated');

    error.value = null;
    isLoading.value = true;

    try {
      const result = await changePasswordUseCase.execute(authStore.user.id, data);
      if (result.isFailure) error.value = result.error;
      return result;
    } finally {
      isLoading.value = false;
    }
  };

  const uploadAvatar = async (file: File): Promise<Result<string, string>> => {
    if (!authStore.user) return Result.fail('User not authenticated');

    error.value = null;
    isLoading.value = true;

    try {
      const result = await userProfileRepository.uploadAvatar(authStore.user.id, file);
      if (result.isSuccess) {
        avatarUrl.value = result.value;
      } else {
        error.value = result.error;
      }
      return result;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteAvatar = async (): Promise<Result<void, string>> => {
    if (!authStore.user) return Result.fail('User not authenticated');

    error.value = null;
    isLoading.value = true;

    try {
      const result = await userProfileRepository.deleteAvatar(authStore.user.id);
      if (result.isSuccess) {
        avatarUrl.value = null;
      } else {
        error.value = result.error;
      }
      return result;
    } finally {
      isLoading.value = false;
    }
  };

  const updatePreferences = async (data: UpdatePreferencesDto): Promise<Result<void, string>> => {
    if (!authStore.user) return Result.fail('User not authenticated');

    error.value = null;
    isLoading.value = true;

    try {
      const result = await userProfileRepository.updatePreferences(authStore.user.id, data);
      if (result.isFailure) error.value = result.error;
      return result;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteAccount = async (password: string): Promise<Result<void, string>> => {
    if (!authStore.user) return Result.fail('User not authenticated');

    error.value = null;
    isLoading.value = true;

    try {
      const result = await userProfileRepository.deleteAccount(authStore.user.id, password);
      if (result.isSuccess) {
        authStore.clearAuth();
        router.push('/');
      } else {
        error.value = result.error;
      }
      return result;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    error,
    isLoading,
    avatarUrl,
    authStore,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAvatar,
    updatePreferences,
    deleteAccount,
  };
}
