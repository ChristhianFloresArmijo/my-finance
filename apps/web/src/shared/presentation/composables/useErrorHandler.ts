import { ref } from 'vue';

/**
 * Standard error-handling composable.
 *
 * Usage:
 *   const { error, handleError, clearError, withErrorHandling } = useErrorHandler()
 *
 *   // Wrap an async call:
 *   await withErrorHandling(() => someAsyncFn())
 *
 *   // Or handle imperatively:
 *   try { ... } catch (e) { handleError(e) }
 */
export function useErrorHandler() {
  const error = ref<string | null>(null);

  function handleError(e: unknown): void {
    if (typeof e === 'string') {
      error.value = e;
    } else if (e instanceof Error) {
      error.value = e.message;
    } else {
      error.value = 'An unexpected error occurred';
    }
  }

  function clearError(): void {
    error.value = null;
  }

  async function withErrorHandling<T>(fn: () => Promise<T>): Promise<T | undefined> {
    clearError();
    try {
      return await fn();
    } catch (e) {
      handleError(e);
      return undefined;
    }
  }

  return { error, handleError, clearError, withErrorHandling };
}
