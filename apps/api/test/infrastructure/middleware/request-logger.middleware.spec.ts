import { RequestLoggerMiddleware } from "../../../src/middleware/request-logger.middleware"
import { Logger } from "@nestjs/common"
import { Request, Response, NextFunction } from "express"

describe("RequestLoggerMiddleware", () => {
  let middleware: RequestLoggerMiddleware
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction
  let loggerSpy: jest.SpyInstance
  let errorSpy: jest.SpyInstance
  let warnSpy: jest.SpyInstance

  beforeEach(() => {
    middleware = new RequestLoggerMiddleware()

    mockRequest = {
      method: "GET",
      originalUrl: "/api/users",
      ip: "127.0.0.1",
      get: jest.fn((header) => {
        if (header === "user-agent") return "Mozilla/5.0"
        return null
      }),
      id: "test-request-id-123",
    } as any

    mockResponse = {
      statusCode: 200,
      on: jest.fn((event, callback) => {
        if (event === "finish") {
          // Simulate finish event immediately
          setTimeout(callback, 0)
        }
        return mockResponse
      }),
      get: jest.fn((header) => {
        if (header === "content-length") return "1234"
        return null
      }),
    } as any

    mockNext = jest.fn()

    // Spy on logger methods
    loggerSpy = jest.spyOn(Logger.prototype, "log").mockImplementation()
    errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation()
    warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation()
  })

  afterEach(() => {
    loggerSpy.mockRestore()
    errorSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it("should log incoming request", () => {
    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext)

    // Assert
    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining("GET /api/users"))
    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining("test-request-id-123"))
  })

  it("should log response on finish", (done) => {
    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext)

    // Assert - wait for finish event
    setTimeout(() => {
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining("200"))
      done()
    }, 10)
  })

  it("should log response duration", (done) => {
    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext)

    // Assert
    setTimeout(() => {
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringMatching(/\d+ms/))
      done()
    }, 10)
  })

  it("should call next middleware", () => {
    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext)

    // Assert
    expect(mockNext).toHaveBeenCalled()
  })

  it("should log warn for client errors (4xx)", (done) => {
    // Arrange
    mockResponse.statusCode = 400

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext)

    // Assert
    setTimeout(() => {
      expect(warnSpy).toHaveBeenCalled()
      done()
    }, 10)
  })

  it("should log error for server errors (5xx)", (done) => {
    // Arrange
    mockResponse.statusCode = 500

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext)

    // Assert
    setTimeout(() => {
      expect(errorSpy).toHaveBeenCalled()
      done()
    }, 10)
  })
})
