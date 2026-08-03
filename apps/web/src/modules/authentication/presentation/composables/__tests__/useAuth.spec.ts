import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuth } from '../useAuth'
import { Result } from '@/shared/business'

// ─── Hoist mock fns BEFORE vi.mock factory runs ───────────────────────────────

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signIn2fa: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(),
  verifyEmail: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  push: vi.fn(),
}))

vi.mock('@/modules/authentication/integration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/authentication/integration')>()
  return {
    ...actual,
    UserRepository: class MockUserRepository {
      signIn = mocks.signIn
      signIn2fa = mocks.signIn2fa
      signOut = mocks.signOut
      getCurrentUser = mocks.getCurrentUser
      verifyEmail = mocks.verifyEmail
      forgotPassword = mocks.forgotPassword
      resetPassword = mocks.resetPassword
    },
  }
})

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

const MOCK_USER_DTO = {
  id: 'user-1',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  status: 'ACTIVE',
  created_at: new Date().toISOString(),
  roles: [{ id: 'r1', name: 'client', display_name: 'Client' }],
  permissions: [{ id: 'p1', resource: 'client', action: 'access', description: '' }],
  profile: null,
  preferences: null,
}

describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('signIn', () => {
    it('populates stores and returns success on normal sign-in', async () => {
      mocks.signIn.mockResolvedValueOnce(Result.ok(null))
      mocks.getCurrentUser.mockResolvedValueOnce(Result.ok(MOCK_USER_DTO))

      const { signIn, authStore } = useAuth()
      const result = await signIn({ email: 'test@example.com', password: 'pass' })

      expect(result.isSuccess).toBe(true)
      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.user?.email).toBe('test@example.com')
    })

    it('returns failure and leaves stores empty on bad credentials', async () => {
      mocks.signIn.mockResolvedValueOnce(Result.fail('Invalid credentials'))

      const { signIn, authStore } = useAuth()
      const result = await signIn({ email: 'bad@example.com', password: 'wrong' })

      expect(result.isSuccess).toBe(false)
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('returns requires_2fa result without calling checkAuth', async () => {
      const totpPending = { requires_2fa: true as const, totp_pending_token: 'pending-tok' }
      mocks.signIn.mockResolvedValueOnce(Result.ok(totpPending))

      const { signIn } = useAuth()
      const result = await signIn({ email: 'user@example.com', password: 'pass' })

      expect(result.isSuccess).toBe(true)
      if (result.isSuccess) expect(result.value?.requires_2fa).toBe(true)
      expect(mocks.getCurrentUser).not.toHaveBeenCalled()
    })

    it('sets isLoading to false after completion', async () => {
      mocks.signIn.mockResolvedValueOnce(Result.fail('err'))

      const { signIn, isLoading } = useAuth()
      await signIn({ email: 'x@x.com', password: 'y' })

      expect(isLoading.value).toBe(false)
    })
  })

  describe('signIn2fa', () => {
    it('populates stores on successful 2FA verification', async () => {
      mocks.signIn2fa.mockResolvedValueOnce(Result.ok(undefined))
      mocks.getCurrentUser.mockResolvedValueOnce(Result.ok(MOCK_USER_DTO))

      const { signIn2fa, authStore } = useAuth()
      const result = await signIn2fa('pending-tok', '123456')

      expect(result.isSuccess).toBe(true)
      expect(authStore.isAuthenticated).toBe(true)
    })

    it('returns failure and leaves stores empty on wrong code', async () => {
      mocks.signIn2fa.mockResolvedValueOnce(Result.fail('Invalid 2FA code'))

      const { signIn2fa, authStore } = useAuth()
      const result = await signIn2fa('pending-tok', '000000')

      expect(result.isSuccess).toBe(false)
      expect(authStore.isAuthenticated).toBe(false)
    })
  })

  describe('signOut', () => {
    it('clears stores and redirects to sign-in by default', async () => {
      mocks.signIn.mockResolvedValueOnce(Result.ok(null))
      mocks.getCurrentUser.mockResolvedValueOnce(Result.ok(MOCK_USER_DTO))
      mocks.signOut.mockResolvedValueOnce(undefined)

      const { signIn, signOut, authStore } = useAuth()
      await signIn({ email: 'test@example.com', password: 'pass' })
      expect(authStore.isAuthenticated).toBe(true)

      await signOut()

      expect(authStore.isAuthenticated).toBe(false)
      expect(mocks.push).toHaveBeenCalledWith('/auth/sign-in')
    })

    it('does not redirect when redirectTo is null', async () => {
      mocks.signOut.mockResolvedValueOnce(undefined)

      const { signOut } = useAuth()
      await signOut(null)

      expect(mocks.push).not.toHaveBeenCalled()
    })

    it('redirects to custom path when provided', async () => {
      mocks.signOut.mockResolvedValueOnce(undefined)

      const { signOut } = useAuth()
      await signOut('/admin/login')

      expect(mocks.push).toHaveBeenCalledWith('/admin/login')
    })
  })

  describe('checkAuth', () => {
    it('returns true and populates stores when session is valid', async () => {
      mocks.getCurrentUser.mockResolvedValueOnce(Result.ok(MOCK_USER_DTO))

      const { checkAuth, authStore } = useAuth()
      const ok = await checkAuth()

      expect(ok).toBe(true)
      expect(authStore.isAuthenticated).toBe(true)
    })

    it('returns false and clears stores when no valid session', async () => {
      mocks.getCurrentUser.mockResolvedValueOnce(Result.fail('Unauthorized'))

      const { checkAuth, authStore } = useAuth()
      const ok = await checkAuth()

      expect(ok).toBe(false)
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('returns false when getCurrentUser throws', async () => {
      mocks.getCurrentUser.mockRejectedValueOnce(new Error('Network error'))

      const { checkAuth } = useAuth()
      const ok = await checkAuth()

      expect(ok).toBe(false)
    })
  })
})
