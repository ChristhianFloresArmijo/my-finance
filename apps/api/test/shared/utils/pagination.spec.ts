import { Pagination } from "@shared/business/value-object/pagination"

/**
 * Pagination Tests
 *
 * Tests for the Pagination utility class.
 */

describe("Pagination", () => {
  describe("constructor", () => {
    it("should create pagination with default values", () => {
      // Act
      const pagination = new Pagination()

      // Assert
      expect(pagination.limit).toBe(1000)
      expect(pagination.offset).toBe(0)
    })

    it("should create pagination with custom limit and offset", () => {
      // Act
      const pagination = new Pagination({ limit: "20", offset: "40" })

      // Assert
      expect(pagination.limit).toBe(20)
      expect(pagination.offset).toBe(40)
    })

    it("should handle limit only", () => {
      // Act
      const pagination = new Pagination({ limit: "50" })

      // Assert
      expect(pagination.limit).toBe(50)
      expect(pagination.offset).toBe(0)
    })

    it("should handle offset only", () => {
      // Act
      const pagination = new Pagination({ offset: "100" })

      // Assert
      expect(pagination.limit).toBe(1000)
      expect(pagination.offset).toBe(100)
    })
  })

  describe("type conversion", () => {
    it("should convert string numbers to numbers", () => {
      // Act
      const pagination = new Pagination({ limit: "25", offset: "50" })

      // Assert
      expect(pagination.limit).toBe(25)
      expect(pagination.offset).toBe(50)
      expect(typeof pagination.limit).toBe("number")
      expect(typeof pagination.offset).toBe("number")
    })

    it("should handle NaN values gracefully", () => {
      // Act
      const pagination = new Pagination({ limit: "abc", offset: "xyz" })

      // Assert
      expect(isNaN(pagination.limit)).toBe(true)
      expect(isNaN(pagination.offset)).toBe(true)
    })
  })

  describe("edge cases", () => {
    it("should handle zero values", () => {
      // Act
      const pagination = new Pagination({ limit: "0", offset: "0" })

      // Assert
      expect(pagination.limit).toBe(0)
      expect(pagination.offset).toBe(0)
    })

    it("should handle negative values", () => {
      // Act
      const pagination = new Pagination({ limit: "-10", offset: "-5" })

      // Assert
      expect(pagination.limit).toBe(-10)
      expect(pagination.offset).toBe(-5)
    })
  })

  describe("large numbers", () => {
    it("should handle large limits", () => {
      // Act
      const pagination = new Pagination({ limit: "5000" })

      // Assert
      expect(pagination.limit).toBe(5000)
    })

    it("should handle large offsets", () => {
      // Act
      const pagination = new Pagination({ offset: "100000" })

      // Assert
      expect(pagination.offset).toBe(100000)
    })
  })

  describe("undefined and null handling", () => {
    it("should handle undefined object", () => {
      // Act
      const pagination = new Pagination(undefined)

      // Assert
      expect(pagination.limit).toBe(1000)
      expect(pagination.offset).toBe(0)
    })

    it("should handle null values in object (defaults to 0 or 1000)", () => {
      // Act
      const pagination = new Pagination({ limit: null as any, offset: null as any })

      // Assert
      // null || 1000 = 1000, null || 0 = 0
      expect(pagination.limit).toBe(1000)
      expect(pagination.offset).toBe(0)
    })
  })
})
