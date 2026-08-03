import { ref, type Ref } from 'vue';

export interface UseAsyncStateOptions {
  immediate?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export interface UseAsyncState<T> {
  data: Ref<T | null>;
  error: Ref<Error | null>;
  isLoading: Ref<boolean>;
  execute: (...args: unknown[]) => Promise<void>;
}

export function useAsyncState<T>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  options: UseAsyncStateOptions = {}
): UseAsyncState<T> {
  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<Error | null>(null);
  const isLoading = ref(false);

  const execute = async (...args: unknown[]): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await asyncFn(...args);
      data.value = result;
      options.onSuccess?.(result);
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      options.onError?.(error.value);
    } finally {
      isLoading.value = false;
    }
  };

  if (options.immediate) {
    execute();
  }

  return {
    data,
    error,
    isLoading,
    execute,
  };
}
