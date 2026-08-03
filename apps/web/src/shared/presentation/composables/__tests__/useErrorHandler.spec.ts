import { describe, it, expect, beforeEach } from 'vitest'
import { useErrorHandler } from '../useErrorHandler'

describe('useErrorHandler', () => {
  let composable: ReturnType<typeof useErrorHandler>

  beforeEach(() => {
    composable = useErrorHandler()
  })

  // ─── handleError ──────────────────────────────────────────────────────────

  describe('handleError', () => {
    it('stores string errors directly', () => {
      composable.handleError('Something went wrong')
      expect(composable.error.value).toBe('Something went wrong')
    })

    it('extracts message from Error instances', () => {
      composable.handleError(new Error('Network failure'))
      expect(composable.error.value).toBe('Network failure')
    })

    it('uses fallback message for unknown throw types', () => {
      composable.handleError(42)
      expect(composable.error.value).toBe('An unexpected error occurred')
    })

    it('uses fallback message for null', () => {
      composable.handleError(null)
      expect(composable.error.value).toBe('An unexpected error occurred')
    })

    it('uses fallback message for plain objects', () => {
      composable.handleError({ code: 500 })
      expect(composable.error.value).toBe('An unexpected error occurred')
    })
  })

  // ─── clearError ───────────────────────────────────────────────────────────

  describe('clearError', () => {
    it('resets error to null', () => {
      composable.handleError('oops')
      composable.clearError()
      expect(composable.error.value).toBeNull()
    })

    it('is idempotent when error is already null', () => {
      composable.clearError()
      expect(composable.error.value).toBeNull()
    })
  })

  // ─── withErrorHandling ────────────────────────────────────────────────────

  describe('withErrorHandling', () => {
    it('returns the resolved value on success', async () => {
      const result = await composable.withErrorHandling(() => Promise.resolve(42))
      expect(result).toBe(42)
      expect(composable.error.value).toBeNull()
    })

    it('catches thrown errors and sets error message', async () => {
      const result = await composable.withErrorHandling(() => {
        throw new Error('Async failure')
      })
      expect(result).toBeUndefined()
      expect(composable.error.value).toBe('Async failure')
    })

    it('catches rejected promises and sets error', async () => {
      const result = await composable.withErrorHandling(() => Promise.reject(new Error('Rejected')))
      expect(result).toBeUndefined()
      expect(composable.error.value).toBe('Rejected')
    })

    it('clears previous error before running the function', async () => {
      composable.handleError('old error')
      await composable.withErrorHandling(() => Promise.resolve('ok'))
      expect(composable.error.value).toBeNull()
    })

    it('handles string throws inside the function', async () => {
      const result = await composable.withErrorHandling(() => { throw 'raw string error' })
      expect(result).toBeUndefined()
      expect(composable.error.value).toBe('raw string error')
    })
  })

  // ─── Independence between instances ──────────────────────────────────────

  it('each call to useErrorHandler creates independent reactive state', () => {
    const a = useErrorHandler()
    const b = useErrorHandler()
    a.handleError('error in A')
    expect(b.error.value).toBeNull()
  })
})
