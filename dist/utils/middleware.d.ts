import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';
import { AuthenticatedRequest, AuthenticationResult } from '@/types';
export declare const requestLogger: (request: Request, response: Response, next: NextFunction) => void;
export declare const limiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const unknownEndpoint: (request: Request, response: Response) => void;
export declare const errorHandler: (error: Error, request: Request, response: Response, next: NextFunction) => void;
export declare function loginMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare const tokenExtractor: (request: AuthenticatedRequest, response: Response, next: NextFunction) => void;
export declare const authenticateUser: (token: string | null | undefined) => AuthenticationResult;
export declare const userExtractor: (request: AuthenticatedRequest, response: Response, next: NextFunction) => void;
export declare const socketUserExtractor: (socket: Socket, next: (err?: Error) => void) => void;
declare const _default: {
    requestLogger: (request: Request, response: Response, next: NextFunction) => void;
    limiter: import("express-rate-limit").RateLimitRequestHandler;
    unknownEndpoint: (request: Request, response: Response) => void;
    errorHandler: (error: Error, request: Request, response: Response, next: NextFunction) => void;
    tokenExtractor: (request: AuthenticatedRequest, response: Response, next: NextFunction) => void;
    userExtractor: (request: AuthenticatedRequest, response: Response, next: NextFunction) => void;
    socketUserExtractor: (socket: Socket, next: (err?: Error) => void) => void;
    authenticateUser: (token: string | null | undefined) => AuthenticationResult;
    loginMiddleware: typeof loginMiddleware;
};
export default _default;
//# sourceMappingURL=middleware.d.ts.map