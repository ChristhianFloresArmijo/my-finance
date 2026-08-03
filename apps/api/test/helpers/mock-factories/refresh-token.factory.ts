import { RefreshToken } from "@auth/business/entities/refresh-token.entity"
import { Status } from '@database/prisma/generated-client'
import { v4 as uuidv4 } from "uuid"

/**
 * Mock data for RefreshToken entity
 */
export const mockRefreshTokenData = {
  id: uuidv4(),
  user_id: uuidv4(),
  token: uuidv4(),
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  status: Status.ACTIVE as Status,
  created_at: new Date(),
  updated_at: null,
  deleted_at: null,
}

/**
 * Factory to create a mock RefreshToken entity
 * @param overrides - Partial data to override defaults
 * @returns RefreshToken entity instance
 */
export const createMockRefreshToken = (
  overrides: Partial<typeof mockRefreshTokenData> = {},
): RefreshToken => {
  const data = { ...mockRefreshTokenData, ...overrides }
  const result = RefreshToken.instance(data)

  if (!result.isOk) {
    throw new Error(`Failed to create mock refresh token: ${JSON.stringify(result.error)}`)
  }

  return result.value
}

/**
 * Factory to create an expired RefreshToken
 * @returns Expired RefreshToken entity
 */
export const createExpiredRefreshToken = (): RefreshToken => {
  return createMockRefreshToken({
    expires_at: new Date(Date.now() - 1000), // Expired 1 second ago
  })
}

/**
 * Factory to create a deleted/revoked RefreshToken
 * @returns Deleted RefreshToken entity
 */
export const createRevokedRefreshToken = (): RefreshToken => {
  return createMockRefreshToken({
    deleted_at: new Date(),
    status: Status.INACTIVE as Status,
  })
}

/**
 * Check if a refresh token is expired
 * @param token - RefreshToken entity
 * @returns True if token is expired
 */
export const isTokenExpired = (token: RefreshToken): boolean => {
  return token.expires_at < new Date()
}

/**
 * Check if a refresh token is revoked
 * @param token - RefreshToken entity
 * @returns True if token is revoked
 */
export const isTokenRevoked = (token: RefreshToken): boolean => {
  return token.deleted_at !== null || token.status !== Status.ACTIVE
}
