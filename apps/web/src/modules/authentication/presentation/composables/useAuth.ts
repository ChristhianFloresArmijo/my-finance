import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';
import { Result } from '@/shared/business';
import { HTTP_CLIENT_KEY } from '@/shared/integration';
import { UserRepository, useAuthStore } from '../../integration';
import { useAuthorizationStore } from '@/modules/authorization/integration/stores/authorizationStore';
import { Role } from '@/modules/authorization/business/entities/Role';
import { Permission } from '@/modules/authorization/business/entities/Permission';
import { User } from '../../business/entities/User';
import { SignInUseCase, SignUpUseCase, SignOutUseCase } from '../../capabilities';
import type { SignInDto, SignUpDto, CurrentUserDto, TotpPendingDto } from '../../business';

export function useAuth() {
  const router = useRouter();
  const authStore = useAuthStore();
  const authorizationStore = useAuthorizationStore();
  const error = ref<string | null>(null);
  const isLoading = ref(false);

  const adaptedClient = inject(HTTP_CLIENT_KEY)!;
  const userRepository = new UserRepository(adaptedClient);

  const signInUseCase = new SignInUseCase(userRepository);
  const signUpUseCase = new SignUpUseCase(userRepository);
  const signOutUseCase = new SignOutUseCase(userRepository);

  /**
   * Populate authStore + authorizationStore from a CurrentUserDto.
   * Called after sign-in, sign-up, and on app startup rehydration.
   */
  function populateStores(dto: CurrentUserDto): void {
    authStore.setUser(
      User.create(
        {
          first_name: dto.first_name,
          last_name: dto.last_name,
          email: dto.email,
          status: dto.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
          created_at: new Date(dto.created_at),
        },
        dto.id
      )
    );

    authorizationStore.setRoles(
      dto.roles.map((r) => Role.create({ name: r.name, display_name: r.display_name }, r.id))
    );

    authorizationStore.setPermissions(
      dto.permissions.map((p) =>
        Permission.create({ resource: p.resource, action: p.action, description: p.description }, p.id)
      )
    );

    authStore.setProfile(dto.profile ?? null);
    authStore.setPreferences(dto.preferences ?? null);
  }

  const signIn = async (credentials: SignInDto): Promise<Result<TotpPendingDto | null, string>> => {
    error.value = null;
    isLoading.value = true;
    authStore.isLoading = true;

    try {
      const result = await signInUseCase.execute(credentials);
      if (result.isSuccess) {
        if (!result.value?.requires_2fa) {
          // Normal sign-in — cookies set; fetch enriched user to populate stores
          await checkAuth();
        }
        // If requires_2fa, caller handles the next step
      } else {
        error.value = result.error;
      }
      return result;
    } finally {
      isLoading.value = false;
      authStore.isLoading = false;
    }
  };

  const signIn2fa = async (pendingToken: string, code: string): Promise<Result<void, string>> => {
    error.value = null;
    isLoading.value = true;
    authStore.isLoading = true;

    try {
      const result = await userRepository.signIn2fa(pendingToken, code);
      if (result.isSuccess) {
        // Cookies now set; populate stores
        await checkAuth();
      } else {
        error.value = result.error;
      }
      return result;
    } finally {
      isLoading.value = false;
      authStore.isLoading = false;
    }
  };

  const signUp = async (data: SignUpDto): Promise<Result<CurrentUserDto, string>> => {
    error.value = null;
    isLoading.value = true;
    authStore.isLoading = true;

    try {
      const result = await signUpUseCase.execute(data);
      if (result.isSuccess) {
        populateStores(result.value);
      } else {
        error.value = result.error;
      }
      return result;
    } finally {
      isLoading.value = false;
      authStore.isLoading = false;
    }
  };

  const signOut = async (redirectTo: string | null = '/auth/sign-in'): Promise<void> => {
    error.value = null;
    isLoading.value = true;
    authStore.isLoading = true;

    try {
      await signOutUseCase.execute();
      authStore.clearAuth();
      authorizationStore.clearAuthorization();
      if (redirectTo) router.push(redirectTo);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign out failed';
    } finally {
      isLoading.value = false;
      authStore.isLoading = false;
    }
  };

  /**
   * Rehydrate session from HTTP-only cookie. Called on app startup and after sign-in.
   * Returns true if a valid session exists.
   */
  const checkAuth = async (): Promise<boolean> => {
    try {
      const result = await userRepository.getCurrentUser();
      if (result.isSuccess) {
        populateStores(result.value);
        return true;
      }
      authStore.clearAuth();
      authorizationStore.clearAuthorization();
      return false;
    } catch {
      authStore.clearAuth();
      authorizationStore.clearAuthorization();
      return false;
    }
  };

  const verifyEmail = async (token: string): Promise<Result<void, string>> => {
    error.value = null;
    isLoading.value = true;
    try {
      const result = await userRepository.verifyEmail(token);
      if (!result.isSuccess) error.value = result.error;
      return result;
    } finally {
      isLoading.value = false;
    }
  };

  const forgotPassword = async (email: string): Promise<Result<void, string>> => {
    error.value = null;
    isLoading.value = true;
    try {
      const result = await userRepository.forgotPassword(email);
      if (!result.isSuccess) error.value = result.error;
      return result;
    } finally {
      isLoading.value = false;
    }
  };

  const resetPassword = async (
    token: string,
    newPassword: string,
    repassword: string,
  ): Promise<Result<void, string>> => {
    error.value = null;
    isLoading.value = true;
    try {
      const result = await userRepository.resetPassword(token, newPassword, repassword);
      if (!result.isSuccess) error.value = result.error;
      return result;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    error,
    isLoading,
    authStore,
    signIn,
    signIn2fa,
    signUp,
    signOut,
    checkAuth,
    verifyEmail,
    forgotPassword,
    resetPassword,
  };
}
