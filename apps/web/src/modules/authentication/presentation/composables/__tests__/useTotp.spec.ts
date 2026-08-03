import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTotp } from '../useTotp'
import { Result } from '@/shared/business'

// ─── Hoist mock fns BEFORE vi.mock factory runs ───────────────────────────────

const mocks = vi.hoisted(() => ({
  getTotpStatus: vi.fn(),
  setupTotp: vi.fn(),
  enableTotp: vi.fn(),
  disableTotp: vi.fn(),
  regenerateRecoveryCodes: vi.fn(),
}))

vi.mock('@/modules/authentication/integration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/authentication/integration')>()
  return {
    ...actual,
    UserRepository: class MockUserRepository {
      getTotpStatus = mocks.getTotpStatus
      setupTotp = mocks.setupTotp
      enableTotp = mocks.enableTotp
      disableTotp = mocks.disableTotp
      regenerateRecoveryCodes = mocks.regenerateRecoveryCodes
    },
  }
})

const TOTP_STATUS_OFF = { totp_enabled: false, totp_enabled_at: null, recovery_codes_remaining: 0 }
const TOTP_STATUS_ON = { totp_enabled: true, totp_enabled_at: new Date().toISOString(), recovery_codes_remaining: 8 }

describe('useTotp', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchStatus', () => {
    it('populates status on success', async () => {
      mocks.getTotpStatus.mockResolvedValueOnce(Result.ok(TOTP_STATUS_OFF))

      const { fetchStatus, status } = useTotp()
      await fetchStatus()

      expect(status.value?.totp_enabled).toBe(false)
    })

    it('sets statusError on failure', async () => {
      mocks.getTotpStatus.mockResolvedValueOnce(Result.fail('Unauthorized'))

      const { fetchStatus, statusError } = useTotp()
      await fetchStatus()

      expect(statusError.value).toBe('Unauthorized')
    })

    it('sets statusLoading to false after completion', async () => {
      mocks.getTotpStatus.mockResolvedValueOnce(Result.ok(TOTP_STATUS_OFF))

      const { fetchStatus, statusLoading } = useTotp()
      await fetchStatus()

      expect(statusLoading.value).toBe(false)
    })
  })

  describe('startSetup', () => {
    it('sets setupUri on success', async () => {
      mocks.setupTotp.mockResolvedValueOnce(Result.ok({ uri: 'otpauth://totp/App:user@x.com?secret=XYZ' }))

      const { startSetup, setupUri } = useTotp()
      await startSetup()

      expect(setupUri.value).toMatch(/^otpauth:\/\/totp\//)
    })

    it('sets setupError on failure', async () => {
      mocks.setupTotp.mockResolvedValueOnce(Result.fail('2FA setup failed'))

      const { startSetup, setupError, setupUri } = useTotp()
      await startSetup()

      expect(setupError.value).toBe('2FA setup failed')
      expect(setupUri.value).toBeNull()
    })
  })

  describe('enable', () => {
    it('returns true and stores recovery codes on success', async () => {
      const codes = ['CODE1', 'CODE2', 'CODE3']
      mocks.enableTotp.mockResolvedValueOnce(Result.ok({ recovery_codes: codes }))
      mocks.getTotpStatus.mockResolvedValueOnce(Result.ok(TOTP_STATUS_ON))

      const { enable, recoveryCodes } = useTotp()
      const ok = await enable('123456')

      expect(ok).toBe(true)
      expect(recoveryCodes.value).toEqual(codes)
    })

    it('clears setupUri after enabling', async () => {
      mocks.enableTotp.mockResolvedValueOnce(Result.ok({ recovery_codes: [] }))
      mocks.getTotpStatus.mockResolvedValueOnce(Result.ok(TOTP_STATUS_ON))
      mocks.setupTotp.mockResolvedValueOnce(Result.ok({ uri: 'otpauth://totp/...' }))

      const { startSetup, enable, setupUri } = useTotp()
      await startSetup()
      expect(setupUri.value).not.toBeNull()

      await enable('123456')
      expect(setupUri.value).toBeNull()
    })

    it('returns false and sets enableError on wrong code', async () => {
      mocks.enableTotp.mockResolvedValueOnce(Result.fail('Invalid verification code'))

      const { enable, enableError } = useTotp()
      const ok = await enable('000000')

      expect(ok).toBe(false)
      expect(enableError.value).toBe('Invalid verification code')
    })
  })

  describe('disable', () => {
    it('returns true and refreshes status on success', async () => {
      mocks.disableTotp.mockResolvedValueOnce(Result.ok(undefined))
      mocks.getTotpStatus.mockResolvedValueOnce(Result.ok(TOTP_STATUS_OFF))

      const { disable, status } = useTotp()
      const ok = await disable('123456')

      expect(ok).toBe(true)
      expect(status.value?.totp_enabled).toBe(false)
    })

    it('returns false and sets disableError on failure', async () => {
      mocks.disableTotp.mockResolvedValueOnce(Result.fail('Invalid code'))

      const { disable, disableError } = useTotp()
      const ok = await disable('bad')

      expect(ok).toBe(false)
      expect(disableError.value).toBe('Invalid code')
    })
  })

  describe('regenerateCodes', () => {
    it('stores new codes on success', async () => {
      const newCodes = ['NEW1', 'NEW2']
      mocks.regenerateRecoveryCodes.mockResolvedValueOnce(Result.ok({ recovery_codes: newCodes }))
      mocks.getTotpStatus.mockResolvedValueOnce(Result.ok(TOTP_STATUS_ON))

      const { regenerateCodes, recoveryCodes } = useTotp()
      const ok = await regenerateCodes('123456')

      expect(ok).toBe(true)
      expect(recoveryCodes.value).toEqual(newCodes)
    })

    it('returns false and sets regenError on failure', async () => {
      mocks.regenerateRecoveryCodes.mockResolvedValueOnce(Result.fail('Invalid code'))

      const { regenerateCodes, regenError } = useTotp()
      const ok = await regenerateCodes('bad')

      expect(ok).toBe(false)
      expect(regenError.value).toBe('Invalid code')
    })
  })

  it('clearRecoveryCodes sets recoveryCodes back to null', async () => {
    mocks.enableTotp.mockResolvedValueOnce(Result.ok({ recovery_codes: ['X1'] }))
    mocks.getTotpStatus.mockResolvedValueOnce(Result.ok(TOTP_STATUS_ON))

    const { enable, clearRecoveryCodes, recoveryCodes } = useTotp()
    await enable('123456')
    expect(recoveryCodes.value).not.toBeNull()

    clearRecoveryCodes()
    expect(recoveryCodes.value).toBeNull()
  })
})
