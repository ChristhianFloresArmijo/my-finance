import { success, failure, Result } from "@shared/business/utils/error-handling"

/**
 * Error Handling Tests
 *
 * Tests for the Result type and error handling utilities.
 * These are foundational utilities used throughout the application.
 */

describe("Error Handling Utils", () => {
  describe("success", () => {
    it("should create successful result with object", () => {
      // Arrange & Act
      const result = success({ id: "123", name: "Test" })

      // Assert
      expect(result.isOk).toBe(true)
      expect(result.value).toEqual({ id: "123", name: "Test" })
      expect(result.error).toBeUndefined()
    })

    it("should work with primitive values", () => {
      // Act
      const stringResult = success("hello")
      const numberResult = success(42)
      const boolResult = success(true)

      // Assert
      expect(stringResult.isOk).toBe(true)
      expect(stringResult.value).toBe("hello")
      expect(numberResult.value).toBe(42)
      expect(boolResult.value).toBe(true)
    })

    it("should work with null and undefined", () => {
      // Act
      const nullResult = success(null)
      const undefinedResult = success(undefined)

      // Assert
      expect(nullResult.isOk).toBe(true)
      expect(nullResult.value).toBeNull()
      expect(undefinedResult.isOk).toBe(true)
      expect(undefinedResult.value).toBeUndefined()
    })

    it("should work with arrays", () => {
      // Act
      const result = success([1, 2, 3])

      // Assert
      expect(result.isOk).toBe(true)
      expect(result.value).toEqual([1, 2, 3])
      expect(Array.isArray(result.value)).toBe(true)
    })
  })

  describe("failure", () => {
    it("should create failed result with error object", () => {
      // Arrange & Act
      const result = failure({ validation: ["Email is required"] })

      // Assert
      expect(result.isOk).toBe(false)
      expect(result.error).toEqual({ validation: ["Email is required"] })
      expect(result.value).toBeUndefined()
    })

    it("should work with string errors", () => {
      // Act
      const result = failure("Something went wrong")

      // Assert
      expect(result.isOk).toBe(false)
      expect(result.error).toBe("Something went wrong")
    })

    it("should work with Error instances", () => {
      // Arrange
      const error = new Error("Test error")

      // Act
      const result = failure(error)

      // Assert
      expect(result.isOk).toBe(false)
      expect(result.error).toBe(error)
      expect(result.error.message).toBe("Test error")
    })

    it("should work with complex error objects", () => {
      // Arrange
      const complexError = {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        fields: {
          email: ["Invalid email format"],
          password: ["Password too short"],
        },
      }

      // Act
      const result = failure(complexError)

      // Assert
      expect(result.isOk).toBe(false)
      expect(result.error).toEqual(complexError)
    })
  })

  describe("Result type narrowing", () => {
    it("should properly narrow success type", () => {
      // Arrange
      const result: Result<{ id: string }, string> = success({ id: "123" })

      // Act & Assert
      if (result.isOk) {
        // TypeScript should know result.value is { id: string }
        expect(result.value.id).toBe("123")
        expect(result.error).toBeUndefined()
      } else {
        fail("Should be a success result")
      }
    })

    it("should properly narrow failure type", () => {
      // Arrange
      const result: Result<{ id: string }, string> = failure("Error occurred")

      // Act & Assert
      if (!result.isOk) {
        // TypeScript should know result.error is string
        expect(result.error).toBe("Error occurred")
        expect(result.value).toBeUndefined()
      } else {
        fail("Should be a failure result")
      }
    })
  })

  describe("chaining and transformation", () => {
    it("should allow chaining with map-like operations", () => {
      // Arrange
      const result = success(5)

      // Act
      const transformed = result.isOk ? success(result.value * 2) : result

      // Assert
      expect(transformed.isOk).toBe(true)
      if (transformed.isOk) {
        expect(transformed.value).toBe(10)
      }
    })

    it("should preserve failure in chain", () => {
      // Arrange
      const result = failure("Initial error")

      // Act
      const transformed = result.isOk ? success(result.value) : result

      // Assert
      expect(transformed.isOk).toBe(false)
      if (!transformed.isOk) {
        expect(transformed.error).toBe("Initial error")
      }
    })
  })
})
