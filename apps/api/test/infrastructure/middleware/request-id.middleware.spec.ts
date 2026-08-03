import { RequestIdMiddleware } from "../../../src/middleware/request-id.middleware"
import { Request, Response, NextFunction } from "express"

describe("RequestIdMiddleware", () => {
  let middleware: RequestIdMiddleware
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    middleware = new RequestIdMiddleware()

    mockRequest = {
      headers: {},
    }

    mockResponse = {
      setHeader: jest.fn(),
    }

    mockNext = jest.fn()
  })

  it("should generate request ID if not provided", () => {
    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext)

    // Assert
    expect(mockRequest["id"]).toBeDefined()
    expect(typeof mockRequest["id"]).toBe("string")
    expect(mockRequest["id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ) // UUID v4 format
  })

  it("should use existing request ID from header", () => {
    // Arrange
    const existingId = "existing-request-id-123"
    mockRequest.headers = { "x-request-id": existingId }

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext)

    // Assert
    expect(mockRequest["id"]).toBe(existingId)
  })

  it("should set X-Request-Id response header", () => {
    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext)

    // Assert
    expect(mockResponse.setHeader).toHaveBeenCalledWith("X-Request-Id", mockRequest["id"])
  })

  it("should call next middleware", () => {
    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext)

    // Assert
    expect(mockNext).toHaveBeenCalled()
  })

  it("should generate unique IDs for different requests", () => {
    // Arrange
    const mockRequest2: Partial<Request> = { headers: {} }
    const mockResponse2: Partial<Response> = { setHeader: jest.fn() }

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext)
    middleware.use(mockRequest2 as Request, mockResponse2 as Response, mockNext)

    // Assert
    expect(mockRequest["id"]).not.toBe(mockRequest2["id"])
  })
})
