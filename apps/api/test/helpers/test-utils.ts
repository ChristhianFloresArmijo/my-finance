/**
 * Test Helper Utilities
 *
 * Common utilities used across all test files.
 */

/**
 * Waits for a specified amount of time (in milliseconds)
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Creates a deep clone of an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Checks if a date is valid
 */
export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Generates a random string of specified length
 */
export const randomString = (length: number): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join(
    "",
  )
}

/**
 * Generates a random email
 */
export const randomEmail = (): string => {
  return `${randomString(10)}@example.com`.toLowerCase()
}

/**
 * Strips undefined values from an object
 */
export const stripUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value
    }
    return acc
  }, {} as any)
}

/**
 * Checks if two objects are deeply equal
 */
export const deepEqual = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

/**
 * Extracts error messages from validation errors
 */
export const extractErrorMessages = (errors: any[]): string[] => {
  return errors.map((error) => {
    if (typeof error === "string") return error
    if (error.message) return error.message
    return JSON.stringify(error)
  })
}
