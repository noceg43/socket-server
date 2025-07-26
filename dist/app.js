"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const cors_1 = __importDefault(require("cors"));
const rooms_1 = __importDefault(require("@/controllers/rooms"));
const login_1 = __importDefault(require("@/controllers/login"));
const middleware_1 = __importDefault(require("@/utils/middleware"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(middleware_1.default.limiter);
app.use(middleware_1.default.requestLogger);
// Apply token extractor globally to make token available
app.use(middleware_1.default.tokenExtractor);
// Public route for getting a token
app.use('/api/login', middleware_1.default.loginMiddleware, login_1.default);
// Protected routes - require a valid token
app.use('/api/rooms', middleware_1.default.userExtractor, rooms_1.default);
app.use(middleware_1.default.unknownEndpoint);
app.use(middleware_1.default.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map