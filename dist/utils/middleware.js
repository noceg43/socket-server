"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketUserExtractor = exports.userExtractor = exports.authenticateUser = exports.tokenExtractor = exports.errorHandler = exports.unknownEndpoint = exports.limiter = exports.requestLogger = void 0;
exports.loginMiddleware = loginMiddleware;
const jwt = __importStar(require("jsonwebtoken"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = __importDefault(require("./logger"));
const config_1 = __importDefault(require("./config"));
const auth_1 = __importDefault(require("./auth"));
const user_1 = require("@/models/user");
const types_1 = require("@/types");
const requestLogger = (request, response, next) => {
    logger_1.default.info('Method:', request.method);
    logger_1.default.info('Path:  ', request.path);
    logger_1.default.info('Body:  ', request.body);
    logger_1.default.info('---');
    next();
};
exports.requestLogger = requestLogger;
exports.limiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many requests from this device',
});
const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' });
};
exports.unknownEndpoint = unknownEndpoint;
const errorHandler = (error, request, response, next) => {
    logger_1.default.error(error.message);
    if (error.name === 'CastError') {
        response.status(400).send({ error: 'malformatted id' });
        return;
    }
    else if (error.name === 'ValidationError') {
        response.status(400).json({ error: error.message });
        return;
    }
    next(error);
};
exports.errorHandler = errorHandler;
function loginMiddleware(req, res, next) {
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    if (!signature || !timestamp) {
        res.status(400).json({ error: 'Missing signature or timestamp' });
        return;
    }
    try {
        const isSigned = auth_1.default.checkLoginSignature(signature, timestamp);
        if (!isSigned) {
            res.status(401).json({ error: 'Invalid signature' });
            return;
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
        return;
    }
    next(); // HMAC is valid
}
const tokenExtractor = (request, response, next) => {
    const authorization = request.get('authorization');
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        request.token = authorization.substring(7);
    }
    else {
        request.token = undefined;
    }
    next();
};
exports.tokenExtractor = tokenExtractor;
// Common authentication logic
const authenticateUser = (token) => {
    if (!token) {
        return { error: 'token missing', status: 401 };
    }
    try {
        const decodedToken = jwt.verify(token, config_1.default.JWT_SECRET);
        // Validate token payload with Zod
        const validatedToken = types_1.TokenPayloadSchema.parse(decodedToken);
        if (!validatedToken.id) {
            return { error: 'token invalid', status: 401 };
        }
        return { user: validatedToken };
    }
    catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return { error: 'invalid token', status: 401 };
        }
        else if (error instanceof jwt.TokenExpiredError) {
            return { error: 'token expired', status: 401 };
        }
        // Handle other potential errors including Zod validation errors
        return { error: 'token verification failed', status: 500 };
    }
};
exports.authenticateUser = authenticateUser;
// REST API user extractor middleware
const userExtractor = (request, response, next) => {
    const result = (0, exports.authenticateUser)(request.token);
    if (result.error) {
        response.status(result.status || 500).json({ error: result.error });
        return;
    }
    request.user = result.user;
    next();
};
exports.userExtractor = userExtractor;
// WebSocket user extractor middleware
const socketUserExtractor = (socket, next) => {
    // Extract token from socket handshake auth or headers (since postman sends it in headers)
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    const userName = socket.handshake.auth?.name;
    const result = (0, exports.authenticateUser)(token);
    if (result.error) {
        const error = new Error(result.error);
        error.data = { status: result.status };
        next(error);
        return;
    }
    if (result.user) {
        // Attach user to socket
        socket.user = new user_1.User(result.user.id, userName || 'Anonymous');
    }
    next();
};
exports.socketUserExtractor = socketUserExtractor;
exports.default = {
    requestLogger: exports.requestLogger,
    limiter: exports.limiter,
    unknownEndpoint: exports.unknownEndpoint,
    errorHandler: exports.errorHandler,
    tokenExtractor: exports.tokenExtractor,
    userExtractor: exports.userExtractor,
    socketUserExtractor: exports.socketUserExtractor,
    authenticateUser: exports.authenticateUser,
    loginMiddleware
};
//# sourceMappingURL=middleware.js.map