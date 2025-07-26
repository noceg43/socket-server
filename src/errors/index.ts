/**
 * Base application error class
 * All custom errors should extend this class
 */
export abstract class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly errorCode: string

  constructor(message: string, statusCode: number, errorCode: string, isOperational = true) {
    super(message)

    this.statusCode = statusCode
    this.isOperational = isOperational
    this.errorCode = errorCode

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }

    this.name = this.constructor.name
  }
}

/**
 * Validation errors (400 Bad Request)
 */
export class ValidationError extends AppError {
  public readonly field?: string

  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.field = field
  }
}

/**
 * Authentication errors (401 Unauthorized)
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

/**
 * Authorization errors (403 Forbidden)
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

/**
 * Resource not found errors (404 Not Found)
 */
export class NotFoundError extends AppError {
  public readonly resource?: string

  constructor(message: string, resource?: string) {
    super(message, 404, 'NOT_FOUND_ERROR')
    this.resource = resource
  }
}

/**
 * Conflict errors (409 Conflict)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR')
  }
}

/**
 * Rate limit errors (429 Too Many Requests)
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR')
  }
}

/**
 * Internal server errors (500 Internal Server Error)
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false)
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends AppError {
  public readonly operation?: string

  constructor(message: string, operation?: string) {
    super(message, 500, 'DATABASE_ERROR', false)
    this.operation = operation
  }
}

/**
 * Redis-related errors
 */
export class RedisError extends DatabaseError {
  public readonly errorCode = 'REDIS_ERROR'

  constructor(message: string, operation?: string) {
    super(message, operation)
    Object.defineProperty(this, 'errorCode', { value: 'REDIS_ERROR', writable: false })
  }
}

/**
 * WebSocket-related errors
 */
export class WebSocketError extends AppError {
  public readonly socketId?: string

  constructor(message: string, socketId?: string) {
    super(message, 500, 'WEBSOCKET_ERROR')
    this.socketId = socketId
  }
}

/**
 * Room-related errors
 */
export class RoomError extends AppError {
  public readonly roomId?: string

  constructor(message: string, statusCode: number, roomId?: string) {
    super(message, statusCode, 'ROOM_ERROR')
    this.roomId = roomId
  }
}

/**
 * User-related errors
 */
export class UserError extends AppError {
  public readonly userId?: string

  constructor(message: string, statusCode: number, userId?: string) {
    super(message, statusCode, 'USER_ERROR')
    this.userId = userId
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends AppError {
  public readonly configKey?: string

  constructor(message: string, configKey?: string) {
    super(message, 500, 'CONFIGURATION_ERROR', false)
    this.configKey = configKey
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Type guard to check if error is operational
 */
export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational
}
