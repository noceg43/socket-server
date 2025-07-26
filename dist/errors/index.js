"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationError = exports.UserError = exports.RoomError = exports.WebSocketError = exports.RedisError = exports.DatabaseError = exports.InternalServerError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
exports.isAppError = isAppError;
exports.isOperationalError = isOperationalError;
/**
 * Base application error class
 * All custom errors should extend this class
 */
class AppError extends Error {
    statusCode;
    isOperational;
    errorCode;
    constructor(message, statusCode, errorCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errorCode = errorCode;
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
        this.name = this.constructor.name;
    }
}
exports.AppError = AppError;
/**
 * Validation errors (400 Bad Request)
 */
class ValidationError extends AppError {
    field;
    constructor(message, field) {
        super(message, 400, 'VALIDATION_ERROR');
        this.field = field;
    }
}
exports.ValidationError = ValidationError;
/**
 * Authentication errors (401 Unauthorized)
 */
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Authorization errors (403 Forbidden)
 */
class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}
exports.AuthorizationError = AuthorizationError;
/**
 * Resource not found errors (404 Not Found)
 */
class NotFoundError extends AppError {
    resource;
    constructor(message, resource) {
        super(message, 404, 'NOT_FOUND_ERROR');
        this.resource = resource;
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Conflict errors (409 Conflict)
 */
class ConflictError extends AppError {
    constructor(message) {
        super(message, 409, 'CONFLICT_ERROR');
    }
}
exports.ConflictError = ConflictError;
/**
 * Rate limit errors (429 Too Many Requests)
 */
class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_ERROR');
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Internal server errors (500 Internal Server Error)
 */
class InternalServerError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500, 'INTERNAL_SERVER_ERROR', false);
    }
}
exports.InternalServerError = InternalServerError;
/**
 * Database-related errors
 */
class DatabaseError extends AppError {
    operation;
    constructor(message, operation) {
        super(message, 500, 'DATABASE_ERROR', false);
        this.operation = operation;
    }
}
exports.DatabaseError = DatabaseError;
/**
 * Redis-related errors
 */
class RedisError extends DatabaseError {
    errorCode = 'REDIS_ERROR';
    constructor(message, operation) {
        super(message, operation);
        Object.defineProperty(this, 'errorCode', { value: 'REDIS_ERROR', writable: false });
    }
}
exports.RedisError = RedisError;
/**
 * WebSocket-related errors
 */
class WebSocketError extends AppError {
    socketId;
    constructor(message, socketId) {
        super(message, 500, 'WEBSOCKET_ERROR');
        this.socketId = socketId;
    }
}
exports.WebSocketError = WebSocketError;
/**
 * Room-related errors
 */
class RoomError extends AppError {
    roomId;
    constructor(message, statusCode, roomId) {
        super(message, statusCode, 'ROOM_ERROR');
        this.roomId = roomId;
    }
}
exports.RoomError = RoomError;
/**
 * User-related errors
 */
class UserError extends AppError {
    userId;
    constructor(message, statusCode, userId) {
        super(message, statusCode, 'USER_ERROR');
        this.userId = userId;
    }
}
exports.UserError = UserError;
/**
 * Configuration errors
 */
class ConfigurationError extends AppError {
    configKey;
    constructor(message, configKey) {
        super(message, 500, 'CONFIGURATION_ERROR', false);
        this.configKey = configKey;
    }
}
exports.ConfigurationError = ConfigurationError;
/**
 * Type guard to check if error is an AppError
 */
function isAppError(error) {
    return error instanceof AppError;
}
/**
 * Type guard to check if error is operational
 */
function isOperationalError(error) {
    return isAppError(error) && error.isOperational;
}
//# sourceMappingURL=index.js.map