import { GlobalExceptionFilter } from "../../../src/filters/global-exception.filter"
import { ArgumentsHost, HttpException, HttpStatus, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Request, Response } from "express"

describe("GlobalExceptionFilter", () => {
  let filter: GlobalExceptionFilter
  let mockConfigService: jest.Mocked<ConfigService>
  let mockArgumentsHost: ArgumentsHost
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let loggerErrorSpy: jest.SpyInstance
  let loggerWarnSpy: jest.SpyInstance

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn((key) => {
        if (key === "nodeEnv") return "development"
        return null
      }),
    } as any

    filter = new GlobalExceptionFilter(mockConfigService)

    mockRequest = {
      url: "/api/users",
      method: "GET",
      id: "test-request-id",
    } as any

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any

    loggerErrorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation()
    loggerWarnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation()
  })

  afterEach(() => {
    loggerErrorSpy.mockRestore()
    loggerWarnSpy.mockRestore()
  })

  it("should handle HttpException", () => {
    // Arrange
    const exception = new HttpException("Not found", HttpStatus.NOT_FOUND)

    // Act
    filter.catch(exception, mockArgumentsHost)

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(404)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: "Not found",
        path: "/api/users",
        method: "GET",
        requestId: "test-request-id",
      }),
    )
  })

  it("should handle generic errors as 500", () => {
    // Arrange
    const exception = new Error("Unexpected error")

    // Act
    filter.catch(exception, mockArgumentsHost)

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: "Internal server error",
      }),
    )
  })

  it("should log errors with request context", () => {
    // Arrange
    const exception = new Error("Test error")

    // Act
    filter.catch(exception, mockArgumentsHost)

    // Assert
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("GET /api/users"),
      expect.any(String),
    )
  })

  it("should include timestamp", () => {
    // Arrange
    const exception = new HttpException("Bad Request", HttpStatus.BAD_REQUEST)

    // Act
    filter.catch(exception, mockArgumentsHost)

    // Assert
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      }),
    )
  })

  it("should hide internal errors in production", () => {
    // Arrange
    mockConfigService.get.mockReturnValue("production")
    filter = new GlobalExceptionFilter(mockConfigService)
    const exception = new Error("Internal database error")

    // Act
    filter.catch(exception, mockArgumentsHost)

    // Assert
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Internal server error",
      }),
    )
  })

  it("should use warn level for 4xx errors", () => {
    // Arrange
    const exception = new HttpException("Bad Request", HttpStatus.BAD_REQUEST)

    // Act
    filter.catch(exception, mockArgumentsHost)

    // Assert
    expect(loggerWarnSpy).toHaveBeenCalled()
  })

  it("should use error level for 5xx errors", () => {
    // Arrange
    const exception = new HttpException("Internal Error", HttpStatus.INTERNAL_SERVER_ERROR)

    // Act
    filter.catch(exception, mockArgumentsHost)

    // Assert
    expect(loggerErrorSpy).toHaveBeenCalled()
  })

  it("should handle HttpException with object response", () => {
    // Arrange
    const exception = new HttpException(
      { message: "Validation failed", errors: ["field1", "field2"] },
      HttpStatus.BAD_REQUEST,
    )

    // Act
    filter.catch(exception, mockArgumentsHost)

    // Assert
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Validation failed",
        errors: ["field1", "field2"],
      }),
    )
  })
})
