/**
 * Base application error class
 * All custom errors should extend this class
 */
export declare abstract class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly errorCode: string;
    constructor(message: string, statusCode: number, errorCode: string, isOperational?: boolean);
}
/**
 * Validation errors (400 Bad Request)
 */
export declare class ValidationError extends AppError {
    readonly field?: string;
    constructor(message: string, field?: string);
}
/**
 * Authentication errors (401 Unauthorized)
 */
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
/**
 * Authorization errors (403 Forbidden)
 */
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
/**
 * Resource not found errors (404 Not Found)
 */
export declare class NotFoundError extends AppError {
    readonly resource?: string;
    constructor(message: string, resource?: string);
}
/**
 * Conflict errors (409 Conflict)
 */
export declare class ConflictError extends AppError {
    constructor(message: string);
}
/**
 * Rate limit errors (429 Too Many Requests)
 */
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
/**
 * Internal server errors (500 Internal Server Error)
 */
export declare class InternalServerError extends AppError {
    constructor(message?: string);
}
/**
 * Database-related errors
 */
export declare class DatabaseError extends AppError {
    readonly operation?: string;
    constructor(message: string, operation?: string);
}
/**
 * Redis-related errors
 */
export declare class RedisError extends DatabaseError {
    readonly errorCode = "REDIS_ERROR";
    constructor(message: string, operation?: string);
}
/**
 * WebSocket-related errors
 */
export declare class WebSocketError extends AppError {
    readonly socketId?: string;
    constructor(message: string, socketId?: string);
}
/**
 * Room-related errors
 */
export declare class RoomError extends AppError {
    readonly roomId?: string;
    constructor(message: string, statusCode: number, roomId?: string);
}
/**
 * User-related errors
 */
export declare class UserError extends AppError {
    readonly userId?: string;
    constructor(message: string, statusCode: number, userId?: string);
}
/**
 * Configuration errors
 */
export declare class ConfigurationError extends AppError {
    readonly configKey?: string;
    constructor(message: string, configKey?: string);
}
/**
 * Type guard to check if error is an AppError
 */
export declare function isAppError(error: unknown): error is AppError;
/**
 * Type guard to check if error is operational
 */
export declare function isOperationalError(error: unknown): boolean;
//# sourceMappingURL=index.d.ts.map