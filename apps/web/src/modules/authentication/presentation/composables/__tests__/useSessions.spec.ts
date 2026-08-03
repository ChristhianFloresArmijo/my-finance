import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSessions } from '@/modules/account/presentation/composables/useSessions'
import { Result } from '@/shared/business'
import type { SessionDto } from '@/modules/authentication/business'

// ─── Hoist mock fns BEFORE vi.mock factory runs ───────────────────────────────

const mocks = vi.hoisted(() => ({
  listSessions: vi.fn(),
  revokeSession: vi.fn(),
  revokeAllSessions: vi.fn(),
}))

vi.mock('@/modules/authentication/integration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/authentication/integration')>()
  return {
    ...actual,
    UserRepository: class MockUserRepository {
      listSessions = mocks.listSessions
      revokeSession = mocks.revokeSession
      revokeAllSessions = mocks.revokeAllSessions
    },
  }
})

function makeSession(id: string): SessionDto {
  return {
    id,
    user_id: 'user-1',
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
  } as unknown as SessionDto
}

describe('useSessions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('loadSessions', () => {
    it('populates sessions list on success', async () => {
      const data = [makeSession('s1'), makeSession('s2')]
      mocks.listSessions.mockResolvedValueOnce(Result.ok(data))

      const { loadSessions, sessions } = useSessions()
      await loadSessions()

      expect(sessions.value).toHaveLength(2)
      expect(sessions.value[0]?.id).toBe('s1')
    })

    it('sets error and leaves sessions empty on failure', async () => {
      mocks.listSessions.mockResolvedValueOnce(Result.fail('Unauthorized'))

      const { loadSessions, sessions, error } = useSessions()
      await loadSessions()

      expect(sessions.value).toHaveLength(0)
      expect(error.value).toBe('Unauthorized')
    })

    it('sets loading to false after completion', async () => {
      mocks.listSessions.mockResolvedValueOnce(Result.ok([]))

      const { loadSessions, loading } = useSessions()
      await loadSessions()

      expect(loading.value).toBe(false)
    })
  })

  describe('revokeSession', () => {
    it('removes the revoked session from the list', async () => {
      mocks.listSessions.mockResolvedValueOnce(Result.ok([makeSession('s1'), makeSession('s2')]))
      mocks.revokeSession.mockResolvedValueOnce(Result.ok(undefined))

      const { loadSessions, revokeSession, sessions } = useSessions()
      await loadSessions()
      await revokeSession('s1')

      expect(sessions.value).toHaveLength(1)
      expect(sessions.value[0]?.id).toBe('s2')
    })

    it('sets revokeError and keeps list unchanged on failure', async () => {
      mocks.listSessions.mockResolvedValueOnce(Result.ok([makeSession('s1')]))
      mocks.revokeSession.mockResolvedValueOnce(Result.fail('Session not found'))

      const { loadSessions, revokeSession, sessions, revokeError } = useSessions()
      await loadSessions()
      await revokeSession('s1')

      expect(sessions.value).toHaveLength(1)
      expect(revokeError.value).toBe('Session not found')
    })

    it('sets revokeLoadingId during revocation and clears after', async () => {
      mocks.listSessions.mockResolvedValueOnce(Result.ok([makeSession('s1')]))
      mocks.revokeSession.mockResolvedValueOnce(Result.ok(undefined))

      const { loadSessions, revokeSession, revokeLoadingId } = useSessions()
      await loadSessions()

      const revokePromise = revokeSession('s1')
      expect(revokeLoadingId.value).toBe('s1')
      await revokePromise
      expect(revokeLoadingId.value).toBeNull()
    })
  })

  describe('revokeAllSessions', () => {
    it('empties the sessions list on success', async () => {
      mocks.listSessions.mockResolvedValueOnce(Result.ok([makeSession('s1'), makeSession('s2')]))
      mocks.revokeAllSessions.mockResolvedValueOnce(Result.ok(undefined))

      const { loadSessions, revokeAllSessions, sessions } = useSessions()
      await loadSessions()
      await revokeAllSessions()

      expect(sessions.value).toHaveLength(0)
    })

    it('sets revokeError and keeps list on failure', async () => {
      mocks.listSessions.mockResolvedValueOnce(Result.ok([makeSession('s1')]))
      mocks.revokeAllSessions.mockResolvedValueOnce(Result.fail('Server error'))

      const { loadSessions, revokeAllSessions, sessions, revokeError } = useSessions()
      await loadSessions()
      await revokeAllSessions()

      expect(sessions.value).toHaveLength(1)
      expect(revokeError.value).toBe('Server error')
    })
  })
})
