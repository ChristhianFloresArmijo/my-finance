/**
 * Extracts a user-facing message from an unknown error.
 * Handles axios-style errors (response.data.message), Error instances, and fallback.
 */
export function getHttpErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { data?: { message?: unknown } } }).response;
    const msg = res?.data?.message;
    if (typeof msg === 'string') return msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
